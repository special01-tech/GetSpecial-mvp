import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/server/db/prisma.client';
import { logAudit } from '@/server/lib/audit';
import { CandidateGenerator } from './candidate-generator';
import { HardFilters } from './hard-filters';
import { OpportunityScorer } from './opportunity-scorer';
import { FallbackEngine } from './fallback-engine';
import { OpportunityLlmOutputSchema, OpportunityCandidate, OpportunityLlmOutput } from './types';

export class OpportunityEngineService {
  private anthropic: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('...')) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  /**
   * Pipeline d'exécution canonique :
   * SIGNAL → CONDITION → FILTER → OPPORTUNITY CANDIDATES → EVALUATION → DECISION
   */
  async generateOpportunities(restaurantId: string): Promise<any[]> {
    // 1. Collecter le contexte complet
    const restaurant = await (prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        profile: true,
        offers: { where: { status: 'active' } },
        signals: {
          where: { detectedAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
          orderBy: { detectedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!restaurant) throw new Error('Restaurant introuvable');

    // Récupérer les rejets des dernières 48h
    const recentDismissalsList = await (prisma as any).feedbackEvent.findMany({
      where: {
        restaurantId,
        type: 'dismiss_opportunity',
        createdAt: { gte: new Date(Date.now() - 48 * 3600 * 1000) },
      },
      select: { reason: true },
    });
    const recentDismissals = new Set<string>(
      recentDismissalsList.map((d: any) => (d.reason || '').toLowerCase().trim()).filter(Boolean)
    );

    // Compter les opportunités générées aujourd'hui (Anti-fatigue)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const recentOppsCount = await (prisma as any).opportunity.count({
      where: {
        restaurantId,
        suggestedAt: { gte: todayStart },
      },
    });

    // 2. Générer les candidats à partir des faits réels
    let candidates = CandidateGenerator.generateCandidates(
      restaurant,
      restaurant.signals || [],
      restaurant.offers || []
    );

    // 3. Filtrage strict par règles dures (Hard Filters sans IA)
    const qualifiedCandidates: OpportunityCandidate[] = [];
    for (const cand of candidates) {
      const filterResult = await HardFilters.evaluate(
        cand,
        restaurant,
        recentDismissals,
        recentOppsCount
      );
      if (filterResult.passed) {
        qualifiedCandidates.push(cand);
      }
    }

    // 4. Si aucun candidat qualifié, tenter la chaîne de secours (Fallback Engine)
    if (qualifiedCandidates.length === 0) {
      const fallback = FallbackEngine.getFallbackCandidate(restaurant, restaurant.offers || []);
      if (fallback) {
        qualifiedCandidates.push(fallback);
      }
    }

    // Si toujours rien : respecter la règle Section 26 "ne rien inventer, ne rien proposer"
    if (qualifiedCandidates.length === 0) {
      return [];
    }

    // Trier les candidats par score déterministe
    const scoredCandidates = qualifiedCandidates.map((cand) => {
      const score = OpportunityScorer.scoreCandidate(cand, recentOppsCount, false);
      return { candidate: cand, finalScore: score };
    });
    scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);

    // Ne retenir que les 1 à 2 meilleures opportunités (règle anti-fatigue)
    const topCandidates = scoredCandidates.slice(0, 2);

    // 5. Évaluation IA & Mise en forme avec faits vérifiés (Ground Truth)
    const createdOpportunities = [];

    for (const { candidate, finalScore } of topCandidates) {
      let evaluation: OpportunityLlmOutput;

      if (!this.anthropic) {
        // Mode déterministe garanti : zéro hallucination
        evaluation = {
          relevant: true,
          relevance_score: finalScore,
          title: candidate.suggestedTitle,
          reason: candidate.facts.join(' • '),
          recommended_angle: candidate.suggestedAngle,
          recommended_tone: restaurant.profile?.tone || 'chaleureux',
          facts_used: candidate.facts,
        };
      } else {
        const prompt = `Tu es l'assistant marketing opérationnel de GetSpecial pour le restaurant "${restaurant.name}".
RÈGLE ABSOLUE : Tu n'as STRICTEMENT AUCUN DROIT d'inventer des faits. Utilise uniquement la liste ci-dessous.
Angle suggéré : ${candidate.suggestedAngle}.
Faits autorisés :
${candidate.facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Format attendu : Réponse JSON stricte :
{
  "relevant": true,
  "relevance_score": ${finalScore},
  "title": "${candidate.suggestedTitle.slice(0, 60)}",
  "reason": "phrase concise expliquant au gérant pourquoi cette opportunité est pertinente aujourd'hui",
  "recommended_angle": "${candidate.suggestedAngle}",
  "recommended_tone": "${restaurant.profile?.tone || 'chaleureux'}",
  "facts_used": ${JSON.stringify(candidate.facts)}
}`;

        try {
          const resp = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 400,
            messages: [{ role: 'user', content: prompt }],
          });
          const text = resp.content[0]?.type === 'text' ? resp.content[0].text : '';
          const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
          const validated = OpportunityLlmOutputSchema.safeParse(parsed);
          if (validated.success) {
            evaluation = validated.data;
          } else {
            throw new Error('Sortie LLM invalide');
          }
        } catch (err) {
          console.warn('[OPPORTUNITY_ENGINE] Fallback déterministe appliqué :', err);
          evaluation = {
            relevant: true,
            relevance_score: finalScore,
            title: candidate.suggestedTitle,
            reason: candidate.facts.join(' • '),
            recommended_angle: candidate.suggestedAngle,
            recommended_tone: restaurant.profile?.tone || 'chaleureux',
            facts_used: candidate.facts,
          };
        }
      }

      // 6. Décision & Persistance dans la table opportunities
      const created = await (prisma as any).opportunity.create({
        data: {
          restaurantId,
          signalId: candidate.signalId || null,
          title: evaluation.title,
          description: evaluation.reason,
          urgency: candidate.urgency,
          recommendedTone: evaluation.recommended_tone,
          relevanceScore: evaluation.relevance_score,
          factsCited: evaluation.facts_used,
          status: 'pending',
        },
      });

      createdOpportunities.push(created);
    }

    await logAudit({
      restaurantId,
      action: 'opportunity.pipeline_executed',
      entityType: 'opportunity',
      details: { candidatesFound: candidates.length, qualified: createdOpportunities.length },
    });

    return createdOpportunities;
  }

  /**
   * Rejeter une opportunité (alimente la boucle de rétroaction et cooldown)
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
