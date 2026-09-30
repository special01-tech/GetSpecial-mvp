/* =============================================================================
 * GetSpecial — Contrats d'Interface & DTOs (Data Transfer Objects)
 *
 * Types stricts partagés entre le Backend et le Frontend.
 * Garantit un formatage unifié et une cohérence totale d'affichage.
 * ============================================================================= */

/** Format standard de réponse de l'API */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/* -----------------------------------------------------------------------------
 * 1. RESTAURANT & PROFIL
 * -------------------------------------------------------------------------- */

export interface OfferDTO {
  id: string;
  title: string;
  description: string;
  discountValue?: string | null;
  recurrence: string;
  status: 'active' | 'paused' | 'archived';
}

export interface SocialAccountDTO {
  id: string;
  platform: 'facebook' | 'instagram' | 'google_business' | 'tiktok';
  username?: string | null;
  status: 'connected' | 'reconnect_needed' | 'disconnected';
  lastSyncAt?: string | null;
}

export interface RestaurantStatsDTO {
  reach: string;
  reachGrowth: string;
  interactions: string;
  interactionsGrowth: string;
  clicks: string;
  clicksGrowth: string;
}

export interface RestaurantDTO {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  status: 'Ouvert' | 'Fermé' | 'En pause';
  isPaused: boolean;
  avatar: string;
  coverImage: string;
  logoText: string;
  typeEtablissement: string;
  address: string;
  hours: string;
  posStatus: string;
  communicationTone: string;
  targetAudience: string;
  offers: OfferDTO[];
  socialAccounts: SocialAccountDTO[];
  stats: RestaurantStatsDTO;
  photos: string[];
}

/* -----------------------------------------------------------------------------
 * 2. OPPORTUNITÉS & IDÉES
 * -------------------------------------------------------------------------- */

export type OpportunityBadge = 'Offre spéciale' | 'Relance' | 'Tendance' | 'Événement' | 'Météo';
export type OpportunityIconType = 'weather' | 'sport' | 'cocktail' | 'dish' | 'music' | 'trend' | 'calendar';
export type IdeaFilter = 'today' | 'week' | 'weather' | 'events' | 'trends' | 'performance' | 'season';

export interface OpportunityDTO {
  id: string;
  title: string;
  category: string;
  period: string;
  description: string;
  badge: OpportunityBadge;
  image: string;
  iconType: OpportunityIconType;
  ctaText: string;
  urgency: 'high' | 'medium' | 'low';
  relevanceScore: number;
  factsCited?: string[];
  status: 'pending' | 'accepted' | 'dismissed' | 'generated';
  suggestedAt: string;
  signal?: {
    type: string;
    source: string;
    detectedAt: string;
  } | null;
}

export interface IdeaItemDTO {
  id: string;
  title: string;
  category: string;
  period: string;
  description: string;
  filter: IdeaFilter;
  image: string;
  iconType: OpportunityIconType;
  factsCited?: string[];
  relevanceScore: number;
}

/* -----------------------------------------------------------------------------
 * 3. POSTS & PUBLICATIONS
 * -------------------------------------------------------------------------- */

export type PublicationStatus = 'to_publish' | 'scheduled' | 'published';
export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'google_business';

export interface PublicationDTO {
  id: string;
  postId?: string;
  title: string;
  text: string;
  date: string;       // ex: "18 Avr"
  time: string;       // ex: "12:00"
  fullDate: string;   // ISO string pour le tri et le calendrier
  status: PublicationStatus;
  statusLabel: string;
  image: string;
  platforms: SocialPlatform[];
  reach?: string;
  interactions?: string;
}

/* -----------------------------------------------------------------------------
 * 4. PERFORMANCES & ANALYTICS
 * -------------------------------------------------------------------------- */

export interface TopPerformanceDTO {
  rank: number;
  id: string;
  title: string;
  reach: string;
  interactions: string;
  growth: string;
  image: string;
}

export interface PlatformDistributionDTO {
  platform: string;
  label: string;
  percentage: number;
  color: string;
}

export interface PerformanceDTO {
  summary: RestaurantStatsDTO;
  topPublications: TopPerformanceDTO[];
  platformDistribution: PlatformDistributionDTO[];
}

/* -----------------------------------------------------------------------------
 * 5. DASHBOARD SUMMARY
 * -------------------------------------------------------------------------- */

export interface DashboardSummaryDTO {
  restaurant: {
    id: string;
    name: string;
    subtitle: string;
    avatar: string;
    status: string;
  };
  opportunities: OpportunityDTO[];
  stats: RestaurantStatsDTO;
  recentPublications: PublicationDTO[];
}
