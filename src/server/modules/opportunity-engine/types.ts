import { z } from 'zod';

/* =============================================================================
 * Demand Opportunity Engine — Types & Schémas Zod
 * ============================================================================= */

export type OpportunityUrgency = 'high' | 'medium' | 'low';
export type OpportunityCategory =
  | 'EMPTY_SLOT'
  | 'LOCAL_EVENT'
  | 'WEATHER_BOOST'
  | 'SPECIAL_OCCASION'
  | 'OFFER_PROMOTION';

export type DistributionChannel = 'INSTAGRAM' | 'FACEBOOK' | 'GOOGLE_BUSINESS';

/**
 * Schéma Zod de l'offre commerciale en salle
 */
export const DemandOfferSchema = z.object({
  label: z.string().min(2).describe("Nom court de la formule (ex: 'Formule Express Burger & Pinte')"),
  details: z.string().min(3).describe("Description précise de ce que le client commande"),
  codeWord: z
    .string()
    .describe("Mot-code oral court pour le comptoir (ex: 'MATCH15', 'MARDI15')")
    .transform((val) => val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'SPECIAL'),
  validityText: z.string().min(3).describe("Créneau de validité (ex: 'Ce soir de 18h30 à 20h15 uniquement')"),
});
export type DemandOffer = z.infer<typeof DemandOfferSchema>;

/**
 * Schéma Zod de la distribution & timing
 */
export const DemandDistributionSchema = z.object({
  channels: z
    .array(z.enum(['INSTAGRAM', 'FACEBOOK', 'GOOGLE_BUSINESS']))
    .min(1)
    .default(['INSTAGRAM', 'FACEBOOK']),
  recommendedPublishTime: z.string().default('11:30').describe("Heure recommandée de publication (ex: '11:30')"),
  publishTimingReason: z.string().default('Moment optimal pour capter la clientèle').describe("Justification de l'heure de publication"),
});
export type DemandDistribution = z.infer<typeof DemandDistributionSchema>;

/**
 * Schéma Zod d'une opportunité unitaire
 */
export const DemandOpportunityItemSchema = z.object({
  title: z.string().min(3).max(100).describe("Titre accrocheur et clair de l'action"),
  description: z.string().min(5).describe("Explication synthétique de l'action commerciale"),
  category: z.enum([
    'EMPTY_SLOT',
    'LOCAL_EVENT',
    'WEATHER_BOOST',
    'SPECIAL_OCCASION',
    'OFFER_PROMOTION',
  ]),
  urgency: z
    .enum(['high', 'medium', 'low', 'moderate'])
    .transform((v) => (v === 'moderate' ? 'medium' : v))
    .default('medium'),
  importance: z
    .enum(['HIGH', 'MEDIUM', 'MODERATE'])
    .default('HIGH')
    .describe("Force ou importance de l'opportunité déterminée par l'IA (HIGH, MEDIUM, MODERATE)"),
  impactScore: z.number().int().min(1).max(100).default(85).describe("Score d'impact ou de force de 1 à 100 estimé par l'IA"),
  offer: DemandOfferSchema,
  reasons: z
    .union([z.array(z.string().min(3)), z.string().transform((s) => [s])])
    .default(['Opportunité commerciale cohérente avec les signaux du jour.']),
  distribution: DemandDistributionSchema.default({
    channels: ['INSTAGRAM', 'FACEBOOK'],
    recommendedPublishTime: '11:30',
    publishTimingReason: 'Pour capter les décisions de sortie.',
  }),
  factsUsed: z
    .union([z.array(z.string()), z.string().transform((s) => [s])])
    .default([]),
});
export type DemandOpportunityItem = z.infer<typeof DemandOpportunityItemSchema>;

/**
 * Schéma Zod de sortie de l'IA (jusqu'à 5 opportunités max)
 */
export const DemandOpportunityOutputSchema = z.object({
  hasOpportunity: z.boolean().describe("true si au moins une opportunité pertinente a été identifiée"),
  opportunities: z
    .array(DemandOpportunityItemSchema)
    .max(5)
    .default([])
    .describe("Liste ordonnée des opportunités (max 5)"),
  summaryRationale: z.string().optional().describe("Synthèse globale de la réflexion"),
});
export type DemandOpportunityOutput = z.infer<typeof DemandOpportunityOutputSchema>;

/**
 * Dossier de contexte structuré préparé pour l'IA
 */
export interface ContextDossier {
  restaurant: {
    id: string;
    name: string;
    type: string;
    address: string;
    city: string;
    timezone: string;
    specialties: string[];
    hasTerrace: boolean;
    averageTicket?: string;
    offPeakDays: string[];
    baselineCovers: number;
    preferredEventTypes: string[];
    constraints: string[];
    tone: string;
  };
  currentDay: {
    dayKey: string;
    dayNameFr: string;
    isOffPeakDay: boolean;
    isClosed: boolean;
    hoursText?: string;
  };
  weather: {
    available: boolean;
    condition?: string;
    temperature?: number;
    tempUnit?: string;
    isSunny?: boolean;
    isRain?: boolean;
    summary?: string;
  };
  events: Array<{
    id: string;
    title: string;
    type: string;
    venue?: string;
    distanceMeters?: number;
    startTime?: string;
    summary?: string;
  }>;
  activeOffers: Array<{
    id: string;
    title: string;
    description: string;
    discountValue?: string;
    lastPromotedAt?: string;
  }>;
  recentDismissals: string[];
}

/**
 * Rapport d'exécution déclarant explicitement les mocks et sources
 */
export interface ExecutionReport {
  timestamp: string;
  restaurantId: string;
  modelUsed: string;
  isMock: boolean;
  mockReason?: string;
  signalsConsumed: {
    weatherAvailable: boolean;
    eventsFound: number;
    activeOffersCount: number;
  };
  filterStatus: {
    passed: boolean;
    rejectReason?: string;
  };
  opportunitiesGenerated: number;
}

/**
 * Résultat complet retourné par l'Opportunity Engine
 */
export interface OpportunityEngineResult {
  opportunities: any[];
  executionReport: ExecutionReport;
}
