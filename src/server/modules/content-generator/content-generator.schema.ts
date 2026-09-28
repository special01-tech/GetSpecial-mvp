import { z } from 'zod';

/* =============================================================================
 * Module CREATE : Content Generator — Schémas & Types
 *
 * Rôle : Prépare et structure les contenus (texte + visuel) calibrés pour chaque réseau.
 * ============================================================================= */

/** Plateformes cibles supportées */
export const PlatformEnum = z.enum(['instagram', 'facebook', 'google-business']);
export type Platform = z.infer<typeof PlatformEnum>;

/** Statuts d'un contenu */
export const ContentStatusEnum = z.enum(['draft', 'ready', 'published']);
export type ContentStatus = z.infer<typeof ContentStatusEnum>;

/** Schéma de création d'un contenu */
export const CreateContentSchema = z.object({
  text: z.string().min(1, 'Le texte est requis'),
  imageUrl: z.string().url().optional().nullable(),
  platform: PlatformEnum,
  status: ContentStatusEnum.default('draft'),
  restaurantId: z.string().min(1, 'Le restaurantId est requis'),
  opportunityId: z.string().optional().nullable(),
});
export type CreateContentInput = z.infer<typeof CreateContentSchema>;

/** Schéma de mise à jour d'un contenu */
export const UpdateContentSchema = CreateContentSchema.partial().omit({ restaurantId: true });
export type UpdateContentInput = z.infer<typeof UpdateContentSchema>;

/** Type représentatif d'un contenu */
export interface ContentRecord {
  id: string;
  text: string;
  imageUrl?: string | null;
  platform: string;
  status: string;
  restaurantId: string;
  opportunityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
