import { z } from 'zod';

/* =============================================================================
 * Module THINK : Opportunity Engine — Schémas & Types
 *
 * Rôle : Évalue les signaux et identifie les opportunités de communication pertinentes.
 * ============================================================================= */

/** Statuts d'une opportunité */
export const OpportunityStatusEnum = z.enum(['pending', 'accepted', 'dismissed']);
export type OpportunityStatus = z.infer<typeof OpportunityStatusEnum>;

/** Schéma de création d'une opportunité issue d'un signal */
export const CreateOpportunitySchema = z.object({
  title: z.string().min(2, 'Le titre est requis'),
  description: z.string().min(5, 'La description est requise'),
  relevanceScore: z.number().min(0).max(1),
  status: OpportunityStatusEnum.default('pending'),
  signalId: z.string().min(1, "L'identifiant du signal est requis"),
});
export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>;

/** Type représentatif d'une opportunité */
export interface OpportunityRecord {
  id: string;
  title: string;
  description: string;
  relevanceScore: number;
  suggestedAt: Date;
  status: OpportunityStatus;
  signalId: string;
}
