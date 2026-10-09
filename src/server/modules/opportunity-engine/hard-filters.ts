import { ContextDossier } from './types';
import { prisma } from '@/server/db/prisma.client';

export interface HardFilterResult {
  passed: boolean;
  rejectReason?: string;
}

export class HardFilters {
  /**
   * Évalue les 4 filtres bloquants stricts sans appel IA (0 coût).
   * Retourne passed: false si le restaurant ne doit pas recevoir de proposition aujourd'hui.
   */
  static async evaluate(
    dossier: ContextDossier,
    restaurant: any
  ): Promise<HardFilterResult> {
    // 1. Restaurant en pause explicite
    if (restaurant.isPaused) {
      return {
        passed: false,
        rejectReason: 'Restaurant actuellement en pause de communication par le gérant.',
      };
    }

    // 2. Jour de fermeture de l'établissement
    if (dossier.currentDay.isClosed) {
      return {
        passed: false,
        rejectReason: `L'établissement est indiqué comme fermé le ${dossier.currentDay.dayNameFr}.`,
      };
    }

    // 3. Plafond d'opportunités du jour (Plafond de 5 opportunités max demandé)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let todayCount = 0;
    try {
      todayCount = await (prisma as any).opportunity.count({
        where: {
          restaurantId: dossier.restaurant.id,
          status: 'pending',
          suggestedAt: { gte: todayStart },
        },
      });
    } catch {
      todayCount = 0;
    }

    if (todayCount >= 5) {
      return {
        passed: false,
        rejectReason: 'Plafond quotidien de 5 opportunités en attente déjà atteint pour aujourd’hui.',
      };
    }

    return { passed: true };
  }
}
