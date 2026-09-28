import { z } from 'zod';

/* =============================================================================
 * Module KNOW : Context Store — Schémas & Types
 *
 * Rôle : Gère l'identité et le profil complet de chaque restaurant.
 * ============================================================================= */

/** Types d'établissements supportés */
export const RestaurantTypeEnum = z.enum([
  'fast-food',
  'restaurant',
  'bar',
  'café',
  'boulangerie',
  'food-truck',
]);
export type RestaurantType = z.infer<typeof RestaurantTypeEnum>;

/** Schéma de création d'un profil restaurant */
export const CreateRestaurantSchema = z.object({
  name: z.string().min(2, 'Le nom doit comporter au moins 2 caractères'),
  type: RestaurantTypeEnum,
  address: z.string().min(5, "L'adresse est requise"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().default('Europe/Paris'),
  openingHours: z.record(z.string(), z.string()).optional(),
  specialties: z.array(z.string()).default([]),
  userId: z.string(),
});
export type CreateRestaurantInput = z.infer<typeof CreateRestaurantSchema>;

/** Schéma de mise à jour d'un profil restaurant */
export const UpdateRestaurantSchema = CreateRestaurantSchema.partial().omit({ userId: true });
export type UpdateRestaurantInput = z.infer<typeof UpdateRestaurantSchema>;

/** Type complet du restaurant dans le Context Store */
export interface RestaurantProfile {
  id: string;
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  timezone: string;
  openingHours?: Record<string, string> | null;
  specialties: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
