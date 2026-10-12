/**
 * Fonctions pures de comptage en salle (Section 6).
 */

export type RedemptionStatus = 'claimed' | 'confirmed' | 'cancelled';

export interface RedemptionRecord {
  id: string;
  offerId: string;
  status: RedemptionStatus;
  partySize: number;
  source?: string;
  createdAt: Date;
  confirmedAt?: Date | null;
  cancelledAt?: Date | null;
}

/**
 * Calcul des utilisations réelles et dédoublonnage.
 * Ne JAMAIS additionner claimed et confirmed : une ligne non annulée = 1 utilisation.
 */
export function calculateCounterMetrics(records: RedemptionRecord[]) {
  // Exclure les annulations
  const activeRecords = records.filter((r) => r.status !== 'cancelled');

  // Nombre d'utilisations = nombre de passages non annulés
  const totalUses = activeRecords.length;

  // Personnes = somme des tailles de groupe
  const totalPersons = activeRecords.reduce((sum, r) => sum + (r.partySize || 1), 0);

  const claimedCount = activeRecords.filter((r) => r.status === 'claimed').length;
  const confirmedCount = activeRecords.filter((r) => r.status === 'confirmed').length;

  return {
    totalUses,
    totalPersons,
    claimedCount,
    confirmedCount,
  };
}

/**
 * Règle d'annulation sous 2 minutes (120 000 ms)
 */
export function canCancelRedemption(createdAt: Date, now: Date = new Date()): boolean {
  const diffMs = now.getTime() - createdAt.getTime();
  return diffMs <= 2 * 60 * 1000 && diffMs >= 0;
}
