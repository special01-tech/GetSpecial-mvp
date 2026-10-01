import { OpportunityCandidate } from './types';
import { UrgencyCalculator } from './urgency-calculator';

export interface ScoringWeights {
  relevanceWeight: number;
  urgencyWeight: number;
  rarityWeight: number;
  fatiguePenalty: number;
  rejectionPenalty: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  relevanceWeight: 0.45,
  urgencyWeight: 0.25,
  rarityWeight: 0.15,
  fatiguePenalty: 0.1,
  rejectionPenalty: 0.2,
};

export class OpportunityScorer {
  /**
   * Calcule le score final normalisé d'un candidat [0.0 - 1.0]
   */
  static scoreCandidate(
    candidate: OpportunityCandidate,
    recentPostsCountToday: number,
    hasRecentSimilarRejection: boolean,
    weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
  ): number {
    const relevance = candidate.rawScore;
    const urgency = UrgencyCalculator.getUrgencyWeight(candidate.urgency);
    const rarity = candidate.type === 'event' || candidate.type === 'holiday' ? 0.9 : 0.6;
    const fatigue = Math.min(1.0, recentPostsCountToday * 0.5) * weights.fatiguePenalty;
    const rejection = hasRecentSimilarRejection ? weights.rejectionPenalty : 0.0;

    const finalScore =
      relevance * weights.relevanceWeight +
      urgency * weights.urgencyWeight +
      rarity * weights.rarityWeight -
      fatigue -
      rejection;

    return Math.min(0.99, Math.max(0.1, Math.round(finalScore * 100) / 100));
  }
}
