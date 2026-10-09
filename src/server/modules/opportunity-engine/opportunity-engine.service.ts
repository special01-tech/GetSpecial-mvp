import { prisma } from '@/server/db/prisma.client';
import { logAudit } from '@/server/lib/audit';
import { ContextBuilder } from './context-builder';
import { HardFilters } from './hard-filters';
import { OpenRouterClient } from './openrouter-client';
import {
  OpportunityEngineResult,
  ExecutionReport,
  DemandOpportunityItem,
} from './types';

/* =============================================================================
 * Module THINK : Demand Opportunity Engine — Service Principal
 * ============================================================================= */

export class OpportunityEngineService {
  private openRouterClient: OpenRouterClient;

  constructor() {
    this.openRouterClient = new OpenRouterClient();
  }

  /**
   * Exécute le pipeline complet de bout en bout et retourne les opportunités
   * avec le rapport d'exécution transparent (incluant la déclaration explicite des mocks).
   */
  async generateOpportunitiesWithReport(restaurantId: string): Promise<OpportunityEngineResult> {
    const timestamp = new Date().toISOString();

    // 1. Construire le dossier VIP factuel (Tolérance totale aux pannes)
    const { dossier, restaurant } = await ContextBuilder.buildDossier(restaurantId);

    // 2. Évaluer les filtres bloquants sans IA (0 coût)
    const filterResult = await HardFilters.evaluate(dossier, restaurant);

    if (!filterResult.passed) {
      await logAudit({
        restaurantId,
        action: 'opportunity.pipeline_filtered',
        entityType: 'opportunity',
        details: { rejectReason: filterResult.rejectReason },
      });

      return {
        opportunities: [],
        executionReport: {
          timestamp,
          restaurantId,
          modelUsed: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.7-sonnet',
          isMock: false,
          signalsConsumed: {
            weatherAvailable: dossier.weather.available,
            eventsFound: dossier.events.length,
            activeOffersCount: dossier.activeOffers.length,
          },
          filterStatus: {
            passed: false,
            rejectReason: filterResult.rejectReason,
          },
          opportunitiesGenerated: 0,
        },
      };
    }

    // 3. Réflexion IA sous guardrails stricts (OpenRouter / Fallback déterministe)
    const { output, isMock, mockReason } = await this.openRouterClient.evaluateDossier(dossier);

    if (!output.hasOpportunity || output.opportunities.length === 0) {
      await logAudit({
        restaurantId,
        action: 'opportunity.pipeline_executed',
        entityType: 'opportunity',
        details: { status: 'no_opportunity', isMock, mockReason },
      });

      return {
        opportunities: [],
        executionReport: {
          timestamp,
          restaurantId,
          modelUsed: isMock ? 'deterministic-local-fallback' : (process.env.OPENROUTER_MODEL || 'anthropic/claude-3.7-sonnet'),
          isMock,
          mockReason,
          signalsConsumed: {
            weatherAvailable: dossier.weather.available,
            eventsFound: dossier.events.length,
            activeOffersCount: dossier.activeOffers.length,
          },
          filterStatus: { passed: true },
          opportunitiesGenerated: 0,
        },
      };
    }

    // 4. Enregistrement Prisma (Plafonné à 5 opportunités max)
    const topOpportunities = output.opportunities.slice(0, 5);
    const createdRecords: any[] = [];

    for (const opp of topOpportunities) {
      // Préparation du payload factsCited compatible (string[] + métadonnées attachées)
      const formattedFacts = [
        `Code: ${opp.offer.codeWord}`,
        `Offre: ${opp.offer.label} (${opp.offer.validityText})`,
        ...opp.factsUsed,
        ...opp.reasons.map((r) => `Raison: ${r}`),
      ];

      const importance = opp.importance || 'HIGH';
      const impactScore = opp.impactScore || (importance === 'HIGH' ? 90 : importance === 'MEDIUM' ? 78 : 65);

      const created = await (prisma as any).opportunity.create({
        data: {
          restaurantId,
          title: opp.title,
          description: opp.description,
          urgency: opp.urgency,
          recommendedTone: dossier.restaurant.tone,
          relevanceScore: impactScore / 100,
          factsCited: {
            facts: formattedFacts,
            importance,
            impactScore,
            offer: opp.offer,
            reasons: opp.reasons,
            distribution: opp.distribution,
            category: opp.category,
          },
          status: 'pending',
        },
      });

      // Enrichissement de l'objet retourné avec les détails structurés
      createdRecords.push({
        ...created,
        importance,
        impactScore,
        offer: opp.offer,
        reasons: opp.reasons,
        distribution: opp.distribution,
        codeWord: opp.offer.codeWord,
        category: opp.category,
      });
    }

    const report: ExecutionReport = {
      timestamp,
      restaurantId,
      modelUsed: isMock ? 'deterministic-local-fallback' : (process.env.OPENROUTER_MODEL || 'anthropic/claude-3.7-sonnet'),
      isMock,
      mockReason,
      signalsConsumed: {
        weatherAvailable: dossier.weather.available,
        eventsFound: dossier.events.length,
        activeOffersCount: dossier.activeOffers.length,
      },
      filterStatus: { passed: true },
      opportunitiesGenerated: createdRecords.length,
    };

    await logAudit({
      restaurantId,
      action: 'opportunity.pipeline_executed',
      entityType: 'opportunity',
      details: {
        isMock,
        mockReason,
        count: createdRecords.length,
        categories: topOpportunities.map((o) => o.category),
      },
    });

    return {
      opportunities: createdRecords,
      executionReport: report,
    };
  }

  /**
   * Méthode canonique pour compatibilité directe avec les routes existantes (retourne un tableau d'opportunités)
   */
  async generateOpportunities(restaurantId: string): Promise<any[]> {
    const result = await this.generateOpportunitiesWithReport(restaurantId);
    return result.opportunities;
  }

  /**
   * Rejeter une opportunité (alimente la boucle de rétroaction et cooldown 48h)
   */
  async dismissOpportunity(opportunityId: string, restaurantId: string, reason?: string): Promise<void> {
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

/** Instance singleton exportée pour l'ensemble du serveur */
export const opportunityEngineService = new OpportunityEngineService();
