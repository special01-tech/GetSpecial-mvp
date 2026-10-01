import { OpportunityCandidate } from './types';
import { prisma } from '@/server/db/prisma.client';

export interface FilterResult {
  passed: boolean;
  rejectReason?: string;
}

export class HardFilters {
  /**
   * Applique la série de filtres bloquants sans appel IA
   */
  static async evaluate(
    candidate: OpportunityCandidate,
    restaurant: any,
    recentDismissals: Set<string>,
    recentOpportunitiesCount: number
  ): Promise<FilterResult> {
    // 1. Restaurant en pause de communication
    if (restaurant.isPaused) {
      return { passed: false, rejectReason: 'Restaurant currently paused by manager' };
    }

    // 2. Limite quotidienne de propositions atteinte (Anti-fatigue max 3 opportunités par jour)
    if (recentOpportunitiesCount >= 3) {
      return { passed: false, rejectReason: 'Daily opportunity limit reached for restaurant' };
    }

    // 3. Vérification des contraintes explicites du restaurateur (Section 10)
    const constraints: string[] = restaurant.profile?.constraints || [];
    for (const c of constraints) {
      const normConstraint = c.toLowerCase();
      // Ex: "never talk about sports", "pas d'alcool"
      if (
        normConstraint.includes('sport') &&
        candidate.type === 'event' &&
        (candidate.suggestedAngle === 'game_night' ||
         candidate.sourceEvent?.toLowerCase().includes('sport') ||
         candidate.suggestedTitle.toLowerCase().includes('match') ||
         candidate.suggestedTitle.toLowerCase().includes('sport'))
      ) {
        return { passed: false, rejectReason: `Explicit constraint violated: ${c}` };
      }
      if (normConstraint.includes('alcool') && candidate.suggestedAngle.toLowerCase().includes('cocktail')) {
        return { passed: false, rejectReason: `Explicit constraint violated: ${c}` };
      }
    }

    // 4. Cooldown de rejet : le gérant a-t-il rejeté un thème identique dans les dernières 48h ?
    for (const dismissedReason of recentDismissals) {
      if (
        candidate.suggestedTitle.toLowerCase().includes(dismissedReason) ||
        candidate.suggestedAngle.toLowerCase().includes(dismissedReason)
      ) {
        return { passed: false, rejectReason: `Theme under active manager cooldown: ${dismissedReason}` };
      }
    }

    // 5. Horaires de fermeture : si le restaurant est fermé aujourd'hui
    const openingHours = restaurant.openingHours || {};
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDayKey = days[new Date().getDay()];
    const todayHours = openingHours[currentDayKey];

    if (todayHours && (todayHours.toLowerCase().includes('ferm') || todayHours.toLowerCase().includes('close'))) {
      return { passed: false, rejectReason: 'Restaurant is closed on this day' };
    }

    return { passed: true };
  }
}
