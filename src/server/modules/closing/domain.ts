/**
 * Fonctions pures de clôture et calcul de la baseline B (Section 6 & 7).
 */

export interface ServiceClosingRecord {
  id: string;
  restaurantId: string;
  serviceDateStr: string;
  service: 'midi' | 'soir';
  totalCovers: number;
  hadActiveOffer: boolean;
  createdAt: Date;
}

/**
 * Calcul de la médiane d'une liste de nombres
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

/**
 * Calcul des couverts habituels B :
 * - Médiane des 8 dernières clôtures SANS offre active pour le même service et jour de semaine.
 * - Tant qu'il y en a moins de 4, repli sur la valeur déclarée par le restaurateur.
 */
export function calculateBaselineCovers(params: {
  closingsWithoutOffer: number[]; // Historique trié par date décroissante
  declaredBaseline: number;
}): { baselineB: number; source: 'déclaré' | 'mesuré'; sampleCount: number } {
  const { closingsWithoutOffer, declaredBaseline } = params;
  const sample = closingsWithoutOffer.slice(0, 8);

  if (sample.length < 4) {
    return {
      baselineB: declaredBaseline,
      source: 'déclaré',
      sampleCount: sample.length,
    };
  }

  return {
    baselineB: calculateMedian(sample),
    source: 'mesuré',
    sampleCount: sample.length,
  };
}
