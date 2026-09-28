import { z } from 'zod';
import { PlatformEnum } from '../content-generator/content-generator.schema';

/* =============================================================================
 * Module PUBLISH : Publisher — Schémas & Types
 *
 * Rôle : Gère la planification et l'exécution des publications sur les réseaux cibles.
 * ============================================================================= */

/** Statuts d'une publication */
export const PublicationStatusEnum = z.enum(['scheduled', 'published', 'failed']);
export type PublicationStatus = z.infer<typeof PublicationStatusEnum>;

/** Schéma de planification d'une publication */
export const SchedulePublicationSchema = z.object({
  platform: PlatformEnum,
  scheduledAt: z.coerce.date().optional(),
  contentId: z.string().min(1, 'Le contentId est requis'),
  restaurantId: z.string().min(1, 'Le restaurantId est requis'),
});
export type SchedulePublicationInput = z.infer<typeof SchedulePublicationSchema>;

/** Type représentatif d'une publication */
export interface PublicationRecord {
  id: string;
  platform: string;
  externalPostId?: string | null;
  publishedAt?: Date | null;
  scheduledAt?: Date | null;
  status: PublicationStatus;
  contentId: string;
  restaurantId: string;
}
