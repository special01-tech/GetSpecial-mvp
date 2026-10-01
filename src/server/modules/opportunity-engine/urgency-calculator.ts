import { OpportunityUrgency } from './types';

export class UrgencyCalculator {
  /**
   * Calcule l'urgence déterministe basée sur le delta temporel jusqu'à l'événement ou le service cible.
   */
  static calculate(targetTime?: Date | null): OpportunityUrgency {
    if (!targetTime) {
      return 'medium'; // Valeur par défaut pour une opportunité générale du jour
    }

    const now = Date.now();
    const diffHours = (targetTime.getTime() - now) / (1000 * 3600);

    if (diffHours <= 0) {
      // Déjà commencé ou immédiat
      return 'high';
    }

    if (diffHours < 2) {
      return 'high'; // < 2h : Urgent / Immédiat
    }

    if (diffHours <= 8) {
      return 'medium'; // 2h à 8h : Créneau du jour (ex: ce midi ou ce soir)
    }

    return 'low'; // > 8h / lendemain : Anticipation
  }

  /**
   * Multiplicateur de score associé à l'urgence
   */
  static getUrgencyWeight(urgency: OpportunityUrgency): number {
    switch (urgency) {
      case 'high':
        return 0.95;
      case 'medium':
        return 0.75;
      case 'low':
        return 0.55;
    }
  }
}
