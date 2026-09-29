import { prisma } from '@/server/db/prisma.client';
import { ValidationError } from '@/server/lib/errors';
import {
  RecordFeedbackSchema,
  type RecordFeedbackInput,
  type FeedbackRecord,
} from './feedback-loop.schema';

/* =============================================================================
 * Module LEARN : Feedback Loop — Service
 *
 * Rôle : Relie les données d'impact (ventes caisse POS, métriques) aux actions passées.
 * ============================================================================= */

export class FeedbackLoopService {
  /**
   * Enregistre un événement de retour (vente, reach, interaction, etc.).
   */
  async recordFeedback(data: RecordFeedbackInput): Promise<FeedbackRecord> {
    const validated = RecordFeedbackSchema.safeParse(data);
    if (!validated.success) {
      throw new ValidationError(validated.error.issues[0]?.message ?? 'Événement feedback invalide');
    }

    const created = await prisma.feedbackEvent.create({
      data: {
        type: validated.data.type,
        value: validated.data.value,
        publicationId: validated.data.publicationId ?? null,
        restaurantId: validated.data.restaurantId,
      },
    });

    return created as unknown as FeedbackRecord;
  }

  /**
   * Récupère les métriques pour un restaurant sur une période donnée.
   */
  async getMetricsByRestaurant(restaurantId: string): Promise<FeedbackRecord[]> {
    const events = await (prisma as any).feedbackEvent.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });

    return events as unknown as FeedbackRecord[];
  }

  /**
   * Récupère le feedback directement rattaché à une publication spécifique.
   */
  async getFeedbackByPublication(publicationId: string): Promise<FeedbackRecord[]> {
    const events = await (prisma as any).feedbackEvent.findMany({
      where: { publicationId },
      orderBy: { createdAt: 'asc' },
    });

    return events as unknown as FeedbackRecord[];
  }
}

/** Instance singleton du service FeedbackLoop */
export const feedbackLoopService = new FeedbackLoopService();
