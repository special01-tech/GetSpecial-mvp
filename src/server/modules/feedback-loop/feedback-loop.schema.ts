import { z } from 'zod';

/* =============================================================================
 * Module LEARN : Feedback Loop — Schémas & Types
 *
 * Rôle : Collecte les indicateurs de performance (ventes de caisse, engagement)
 *        et les relie aux publications passées pour mesurer l'impact.
 * ============================================================================= */

/** Types d'événements de feedback */
export const FeedbackTypeEnum = z.enum(['sale', 'engagement', 'reach', 'click']);
export type FeedbackType = z.infer<typeof FeedbackTypeEnum>;

/** Schéma d'enregistrement d'un événement de feedback */
export const RecordFeedbackSchema = z.object({
  type: FeedbackTypeEnum,
  value: z.number().min(0, 'La valeur doit être positive'),
  publicationId: z.string().optional().nullable(),
  restaurantId: z.string().min(1, 'Le restaurantId est requis'),
});
export type RecordFeedbackInput = z.infer<typeof RecordFeedbackSchema>;

/** Type représentatif d'un événement de feedback */
export interface FeedbackRecord {
  id: string;
  type: string;
  value: number;
  recordedAt: Date;
  publicationId?: string | null;
  restaurantId: string;
}
