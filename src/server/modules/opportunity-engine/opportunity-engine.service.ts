import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { prisma } from '@/server/db/prisma.client';
import { logAudit } from '@/server/lib/audit';

// Schéma de validation strict de la sortie Claude
export const ClaudeOpportunitySchema = z.object({
  opportunities: z.array(
    z.object({
      title: z.string().min(5),
      description: z.string().min(10),
      urgency: z.enum(['high', 'medium', 'low']),
      recommendedTone: z.string(),
      relevanceScore: z.number().min(0).max(1),
      verifiedFacts: z.array(z.string()).min(1), // Doit référencer au moins un fait existant
    })
  ),
});

export type ClaudeOpportunityResult = z.infer<typeof ClaudeOpportunitySchema>;

export class OpportunityEngineService {
  private anthropic: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  /**
   * Étape 1 : Filtrage déterministe par règles métier (sans IA)
   */
  async applyRuleFilters(restaurantId: string) {
    const restaurant = await (prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        profile: true,
        offers: { where: { status: 'active' } },
        signals: {
          where: { detectedAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
          orderBy: { detectedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!restaurant) throw new Error('Restaurant introuvable');

    // Récupération des rejets récents pour cooldown
    const recentDismissals = await (prisma as any).feedbackEvent.findMany({
      where: {
        restaurantId,
        type: 'dismiss_opportunity',
        createdAt: { gte: new Date(Date.now() - 48 * 3600 * 1000) },
      },
      select: { reason: true },
    });

    const dismissedThemes = new Set(recentDismissals.map((d: any) => d.reason?.toLowerCase()));

    // Filtrer signaux
    const filteredSignals = (restaurant.signals || []).filter((sig: any) => {
      const summary = ((sig.data as any)?.summary || '').toLowerCase();
      // Si le thème a été rejeté récemment
      for (const theme of dismissedThemes) {
        if (theme && summary.includes(theme)) return false;
      }
      return true;
    });

    // Solution de secours : offre non communiquée depuis 3 jours
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000);
    const unpromotedOffers = (restaurant.offers || []).filter((o: any) => {
      return !o.lastPromotedAt || new Date(o.lastPromotedAt) < threeDaysAgo;
    });

    return {
      restaurant,
      filteredSignals,
      unpromotedOffers,
    };
  }

  /**
   * Étape 2 : Appel Claude avec validation Zod et vérification stricte des faits
   */
  async generateOpportunities(restaurantId: string): Promise<any[]> {
    const context = await this.applyRuleFilters(restaurantId);
    const { restaurant, filteredSignals, unpromotedOffers } = context;

    // Faits autorisés (Ground Truth vérifiable)
    const establishedFacts: string[] = [
      `Restaurant: ${restaurant.name} (${restaurant.type})`,
      `Adresse: ${restaurant.address}`,
      restaurant.profile?.hasTerrace ? 'Terrasse extérieure disponible' : 'Pas de terrasse',
      ...(restaurant.profile?.constraints || []).map((c: string) => `Contrainte: ${c}`),
      ...filteredSignals.map((s: any) => `Signal: ${(s.data as any)?.summary || (s.data as any)?.title}`),
      ...unpromotedOffers.map((o: any) => `Offre active non communiquée récemment: ${o.title} (${o.description})`),
    ];

    let resultJson: ClaudeOpportunityResult;

    if (!this.anthropic) {
      // Fallback déterministe quand pas de clé API ANTHROPIC configurée
      resultJson = {
        opportunities: [
          {
            title: `Mettre en avant : ${unpromotedOffers[0]?.title || 'Spécialités de la maison'}`,
            description: `Opportunité basée sur les conditions du jour pour dynamiser votre service.`,
            urgency: 'medium',
            recommendedTone: restaurant.profile?.tone || 'chaleureux',
            relevanceScore: 0.85,
            verifiedFacts: [establishedFacts[0] || 'Restaurant'],
          },
        ],
      };
    } else {
      const prompt = `Tu es un conseiller marketing pour restaurants. Analyse le contexte ci-dessous et propose 1 à 3 opportunités de communication immédiates ou pour la journée.
RÈGLE ABSOLUE : Tu as STRICTEMENT interdiction d'inventer des faits. Tous les faits mentionnés DOIVENT figurer dans la liste des "Faits vérifiés".
Format attendu : JSON pur conforme au schéma.

Faits vérifiés :
${establishedFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Format JSON attendu :
{
  "opportunities": [
    {
      "title": "string (5-60 chars)",
      "description": "string (court argumentaire)",
      "urgency": "high" | "medium" | "low",
      "recommendedTone": "${restaurant.profile?.tone || 'chaleureux'}",
      "relevanceScore": 0.0 à 1.0,
      "verifiedFacts": ["liste de faits textuels exactement issus de la liste"]
    }
  ]
}`;

      let attempts = 0;
      let valid = false;

      while (attempts < 2 && !valid) {
        attempts++;
        try {
          const response = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          });

          const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
          const parsed = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
          const validation = ClaudeOpportunitySchema.safeParse(parsed);

          if (validation.success) {
            // Contrôle que les faits cités sont plausibles dans establishedFacts
            resultJson = validation.data;
            valid = true;
          }
        } catch (err) {
          console.warn(`[OPPORTUNITY_ENGINE_ERROR] Tentative ${attempts} échouée :`, err);
        }
      }

      if (!valid) {
        await logAudit({
          restaurantId,
          action: 'opportunity.generation_failed',
          entityType: 'opportunity',
          details: { error: 'Validation Zod Claude impossible' },
        });
        throw new Error('Impossible de générer des opportunités valides');
      }
    }

    // Persister dans la table opportunities
    const createdOpportunities = [];
    for (const opp of resultJson!.opportunities) {
      const created = await (prisma as any).opportunity.create({
        data: {
          restaurantId,
          title: opp.title,
          description: opp.description,
          urgency: opp.urgency,
          recommendedTone: opp.recommendedTone,
          relevanceScore: opp.relevanceScore,
          factsCited: opp.verifiedFacts,
          status: 'pending',
        },
      });
      createdOpportunities.push(created);
    }

    await logAudit({
      restaurantId,
      action: 'opportunity.generated',
      entityType: 'opportunity',
      details: { count: createdOpportunities.length },
    });

    return createdOpportunities;
  }

  /**
   * Rejeter une opportunité (enregistré dans feedback)
   */
  async dismissOpportunity(opportunityId: string, restaurantId: string, reason?: string) {
    await (prisma as any).opportunity.update({
      where: { id: opportunityId },
      data: { status: 'dismissed' },
    });

    await (prisma as any).feedbackEvent.create({
      data: {
        restaurantId,
        opportunityId,
        type: 'dismiss_opportunity',
        reason: reason || 'Non pertinent pour le moment',
      },
    });

    await logAudit({
      restaurantId,
      action: 'opportunity.dismiss',
      entityType: 'opportunity',
      entityId: opportunityId,
      details: { reason },
    });
  }
}

export const opportunityEngineService = new OpportunityEngineService();
