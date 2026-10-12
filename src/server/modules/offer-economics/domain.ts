/**
 * Fonctions pures d'économie de l'offre (Section 8).
 * Aucun accès base ni réseau.
 */

export interface OfferEconomicsParams {
  dishPrice: number; // P (prix de vente)
  foodCostPct: number; // Ratio coût matière (ex: 0.30 pour 30%)
  discountPct?: number; // d (ex: 0.20 pour 20%)
  freeItemCost?: number; // C si article offert (coût de revient matière de l'article)
  baselineCovers: number; // B (couverts habituels sans offre)
  capacityCovers: number; // Capacité maximale du service
}

export interface OfferEconomicsResult {
  marginPerDish: number; // m = P - P * foodCostPct
  costPerUser: number; // C
  breakEvenCovers: number; // N* = B * C / (m - C)
  maxRisk: number; // -B * C
  targetCovers: number; // max(1, round(0.25 * (capacity - B)))
  isValid: boolean;
  rejectionReason?: string;
}

export function calculateOfferEconomics(params: OfferEconomicsParams): OfferEconomicsResult {
  const { dishPrice: P, foodCostPct, discountPct = 0, freeItemCost, baselineCovers: B, capacityCovers } = params;

  // Marge brute unitaire : m = P - P * foodCostPct
  const m = P * (1 - foodCostPct);

  // Coût de l'avantage par utilisateur : C
  let C = 0;
  if (freeItemCost !== undefined && freeItemCost > 0) {
    C = freeItemCost;
  } else if (discountPct > 0) {
    C = discountPct * P;
  }

  // Capacité et objectif
  const emptySeats = capacityCovers - B;
  const targetCovers = emptySeats <= 0 ? 0 : Math.max(1, Math.round(0.25 * emptySeats));

  // Règle d'interdiction 1 : C >= m (coût de l'avantage supérieur ou égal à la marge)
  if (C >= m) {
    return {
      marginPerDish: m,
      costPerUser: C,
      breakEvenCovers: Infinity,
      maxRisk: -B * C,
      targetCovers,
      isValid: false,
      rejectionReason: "Le coût de l'avantage (C) est supérieur ou égal à la marge unitaire (m).",
    };
  }

  // Règle d'interdiction 2 : Capacité insuffisante
  if (emptySeats <= 0) {
    return {
      marginPerDish: m,
      costPerUser: C,
      breakEvenCovers: 0,
      maxRisk: -B * C,
      targetCovers: 0,
      isValid: false,
      rejectionReason: 'Capacité atteinte : la salle est déjà pleine sans offre.',
    };
  }

  // Point mort : N* = B * C / (m - C)
  const breakEvenCovers = (B * C) / (m - C);

  // Risque maximal (si tous les habituels profitent de l'avantage sans nouveaux clients)
  const maxRisk = -B * C;

  return {
    marginPerDish: m,
    costPerUser: C,
    breakEvenCovers: Math.round(breakEvenCovers * 1000) / 1000,
    maxRisk,
    targetCovers,
    isValid: true,
  };
}

/**
 * Calcul du gain estimé et de la cannibalisation
 * Effet estimé = couverts du jour - baseline B
 * Gain = effet * m - total_personnes * C
 */
export function calculateImpactMetrics(params: {
  actualCovers: number;
  baselineB: number;
  totalOfferPersons: number; // Somme des party_size
  marginPerDish: number;
  costPerUser: number;
}) {
  const { actualCovers, baselineB, totalOfferPersons, marginPerDish: m, costPerUser: C } = params;
  
  const estimatedEffect = actualCovers - baselineB;
  const cannibalisation = Math.max(0, totalOfferPersons - estimatedEffect);
  const estimatedGain = estimatedEffect * m - totalOfferPersons * C;

  return {
    estimatedEffect,
    cannibalisation,
    estimatedGain,
  };
}
