import { z } from 'zod';

/* =============================================================================
 * Module AUTH — Schémas & Types
 *
 * Rôle : Validation des données d'authentification et gestion de session.
 * ============================================================================= */

/** Schéma d'inscription */
export const RegisterSchema = z.object({
  email: z.string().email('Format email invalide'),
  password: z.string().min(4, 'Le mot de passe doit comporter au moins 4 caractères'),
  name: z.preprocess(
    (val) => (typeof val === 'string' && val.trim().length > 0 ? val.trim() : undefined),
    z.string().min(1).optional()
  ),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

/** Schéma de connexion */
export const LoginSchema = z.object({
  email: z.string().email('Format email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

/** Profil utilisateur public (sans mot de passe) */
export interface SafeUser {
  id: string;
  email: string;
  name?: string | null;
  createdAt: Date;
  updatedAt: Date;
  restaurantId?: string | null;
  restaurantName?: string | null;
}
