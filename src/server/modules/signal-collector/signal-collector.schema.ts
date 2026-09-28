import { z } from 'zod';

/* =============================================================================
 * Module OBSERVE : Signal Collector — Schémas & Types
 *
 * Rôle : Collecte et normalise les signaux environnementaux (météo, événements, jours fériés).
 * ============================================================================= */

/** Types de signaux supportés */
export const SignalTypeEnum = z.enum(['weather', 'event', 'holiday', 'custom']);
export type SignalType = z.infer<typeof SignalTypeEnum>;

/** Schéma de création d'un signal collecté */
export const CreateSignalSchema = z.object({
  type: SignalTypeEnum,
  source: z.string().min(1, 'La source est requise'),
  data: z.record(z.string(), z.unknown()),
  restaurantId: z.string().min(1, 'Le restaurantId est requis'),
});
export type CreateSignalInput = z.infer<typeof CreateSignalSchema>;

/** Type représentatif d'un signal collecté */
export interface SignalRecord {
  id: string;
  type: string;
  source: string;
  data: Record<string, unknown>;
  detectedAt: Date;
  restaurantId: string;
}
