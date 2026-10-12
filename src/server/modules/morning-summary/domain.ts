/**
 * Fonctions pures de recommandation du Résumé du Matin (Section 7).
 *
 * Seuils constants :
 * Succès : Atteinte >= 100%
 * Partiel : 30% <= Atteinte < 100%
 * Échec : Atteinte < 30%
 */

export const THRESHOLD_SUCCESS = 1.0;
export const THRESHOLD_PARTIAL = 0.3;

export type MorningRecommendation = 'garder' | 'ajuster' | 'laisser';

export interface MorningSummaryEvaluation {
  targetCovers: number;
  actualPersons: number; // Somme des party_size
  attainmentRate: number; // actualPersons / targetCovers
  estimatedGain?: number;
  hasEnoughDataForGain: boolean;
  recommendation: MorningRecommendation;
  reason: string;
}

export function evaluateMorningSummary(params: {
  targetCovers: number;
  actualPersons: number;
  estimatedGain?: number;
  hasEnoughDataForGain: boolean;
}): MorningSummaryEvaluation {
  const { targetCovers, actualPersons, estimatedGain, hasEnoughDataForGain } = params;
  const target = targetCovers > 0 ? targetCovers : 1;
  const attainmentRate = actualPersons / target;

  if (attainmentRate >= THRESHOLD_SUCCESS) {
    // Si le gain estimé est négatif avec certitude, ajuster plutôt que garder
    if (hasEnoughDataForGain && estimatedGain !== undefined && estimatedGain < 0) {
      return {
        targetCovers,
        actualPersons,
        attainmentRate,
        estimatedGain,
        hasEnoughDataForGain,
        recommendation: 'ajuster',
        reason: 'Objectif atteint en couverts mais gain financier négatif (cannibalisation ou remise trop forte).',
      };
    }

    return {
      targetCovers,
      actualPersons,
      attainmentRate,
      estimatedGain,
      hasEnoughDataForGain,
      recommendation: 'garder',
      reason: hasEnoughDataForGain
        ? 'Objectif de couverts atteint et gain positif.'
        : 'Objectif de couverts atteint (gain financier provisoire).',
    };
  }

  if (attainmentRate >= THRESHOLD_PARTIAL) {
    return {
      targetCovers,
      actualPersons,
      attainmentRate,
      estimatedGain,
      hasEnoughDataForGain,
      recommendation: 'ajuster',
      reason: 'Résultats encourageants (30% à 99% de l’objectif). Ajuster l’horaire ou le message.',
    };
  }

  return {
    targetCovers,
    actualPersons,
    attainmentRate,
    estimatedGain,
    hasEnoughDataForGain,
    recommendation: 'laisser',
    reason: 'Résultats insuffisants (< 30% de l’objectif). Mettre en pause cet angle.',
  };
}
