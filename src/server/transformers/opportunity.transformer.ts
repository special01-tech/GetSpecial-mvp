/* =============================================================================
 * Opportunity Transformer
 *
 * Transforme les entités Prisma Opportunity en DTOs formatés pour le frontend.
 * ============================================================================= */

import type { OpportunityDTO, IdeaItemDTO } from '@/types/dto';
import {
  formatRelativePeriod,
  mapSignalToBadge,
  mapSignalToIconType,
  mapSignalToFilter,
  DEFAULT_IMAGES,
} from './formatters';

interface PrismaOpportunityWithSignal {
  id: string;
  title: string;
  description: string;
  urgency: string;
  recommendedTone?: string | null;
  relevanceScore: number;
  factsCited?: any;
  status: string;
  suggestedAt: Date;
  signalId?: string | null;
  signal?: {
    type: string;
    source: string;
    detectedAt: Date;
    data?: any;
  } | null;
}

/** Sélectionne une image contextuelle en fonction du type de signal */
function pickContextualImage(signalType?: string): string {
  switch (signalType?.toLowerCase()) {
    case 'weather':
    case 'meteo':
      return DEFAULT_IMAGES.weather;
    case 'sport':
    case 'event':
    case 'evenement':
      return DEFAULT_IMAGES.event;
    case 'cocktail':
    case 'bar':
      return DEFAULT_IMAGES.cocktail;
    case 'dessert':
      return DEFAULT_IMAGES.dessert;
    default:
      return DEFAULT_IMAGES.dish;
  }
}

/** Transforme une Opportunité Prisma vers un OpportunityDTO */
export function transformOpportunity(opp: PrismaOpportunityWithSignal): OpportunityDTO {
  const signalType = opp.signal?.type;
  const badge = mapSignalToBadge(signalType);
  const iconType = mapSignalToIconType(signalType);
  const period = formatRelativePeriod(opp.suggestedAt);
  const image = pickContextualImage(signalType);

  // Parsing sécurisé des factsCited (Json)
  let facts: string[] = [];
  if (Array.isArray(opp.factsCited)) {
    facts = opp.factsCited.map((f) => (typeof f === 'string' ? f : JSON.stringify(f)));
  } else if (typeof opp.factsCited === 'string') {
    facts = [opp.factsCited];
  }

  return {
    id: opp.id,
    title: opp.title,
    category: badge,
    period,
    description: opp.description,
    badge,
    image,
    iconType,
    ctaText: 'Créer la publication →',
    urgency: (opp.urgency as 'high' | 'medium' | 'low') || 'medium',
    relevanceScore: opp.relevanceScore ?? 0.5,
    factsCited: facts,
    status: (opp.status as 'pending' | 'accepted' | 'dismissed' | 'generated') || 'pending',
    suggestedAt: opp.suggestedAt ? new Date(opp.suggestedAt).toISOString() : new Date().toISOString(),
    signal: opp.signal
      ? {
          type: opp.signal.type,
          source: opp.signal.source,
          detectedAt: new Date(opp.signal.detectedAt).toISOString(),
        }
      : null,
  };
}

/** Transforme une Opportunité Prisma vers un IdeaItemDTO (pour la page Idées) */
export function transformIdeaItem(opp: PrismaOpportunityWithSignal): IdeaItemDTO {
  const signalType = opp.signal?.type;
  const badge = mapSignalToBadge(signalType);
  const iconType = mapSignalToIconType(signalType);
  const period = formatRelativePeriod(opp.suggestedAt);
  const filter = mapSignalToFilter(signalType, opp.suggestedAt);
  const image = pickContextualImage(signalType);

  let facts: string[] = [];
  if (Array.isArray(opp.factsCited)) {
    facts = opp.factsCited.map((f) => (typeof f === 'string' ? f : JSON.stringify(f)));
  } else if (typeof opp.factsCited === 'string') {
    facts = [opp.factsCited];
  }

  return {
    id: opp.id,
    title: opp.title,
    category: badge,
    period,
    description: opp.description,
    filter,
    image,
    iconType,
    factsCited: facts,
    relevanceScore: opp.relevanceScore ?? 0.5,
  };
}
