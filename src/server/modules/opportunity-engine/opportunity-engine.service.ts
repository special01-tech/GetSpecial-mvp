import { prisma } from '@/server/db/prisma.client';
import { NotFoundError, ValidationError } from '@/server/lib/errors';
import {
  CreateOpportunitySchema,
  type CreateOpportunityInput,
  type OpportunityRecord,
  type OpportunityStatus,
} from './opportunity-engine.schema';

/* =============================================================================
 * Module THINK : Opportunity Engine — Service
 *
 * Rôle : Décide et orchestre les opportunités de communication à forte valeur ajoutée.
 * ============================================================================= */

export class OpportunityEngineService {
  /**
   * Crée et enregistre une opportunité qualifiée.
   */
  async createOpportunity(data: CreateOpportunityInput): Promise<OpportunityRecord> {
    const validated = CreateOpportunitySchema.safeParse(data);
    if (!validated.success) {
      throw new ValidationError(validated.error.issues[0]?.message ?? 'Opportunité invalide');
    }

    const created = await prisma.opportunity.create({
      data: {
        title: validated.data.title,
        description: validated.data.description,
        relevanceScore: validated.data.relevanceScore,
        status: validated.data.status,
        signalId: validated.data.signalId,
      },
    });

    return created as unknown as OpportunityRecord;
  }

  /**
   * Récupère les opportunités pour un restaurant donné (filtrables par statut).
   */
  async getOpportunitiesByRestaurant(
    restaurantId: string,
    status?: OpportunityStatus
  ): Promise<OpportunityRecord[]> {
    const opportunities = await prisma.opportunity.findMany({
      where: {
        signal: {
          restaurantId,
        },
        ...(status ? { status } : {}),
      },
      orderBy: [
        { relevanceScore: 'desc' },
        { suggestedAt: 'desc' },
      ],
    });

    return opportunities as unknown as OpportunityRecord[];
  }

  /**
   * Met à jour le statut d'une opportunité (acceptée, rejetée, en attente).
   */
  async updateStatus(id: string, status: OpportunityStatus): Promise<OpportunityRecord> {
    const exists = await prisma.opportunity.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundError('Opportunité');
    }

    const updated = await prisma.opportunity.update({
      where: { id },
      data: { status },
    });

    return updated as unknown as OpportunityRecord;
  }
}

/** Instance singleton du service OpportunityEngine */
export const opportunityEngineService = new OpportunityEngineService();
