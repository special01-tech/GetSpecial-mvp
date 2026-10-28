import { ContextDossier } from './types';
import { prisma } from '@/server/db/prisma.client';

export interface HardFilterResult {
  passed: boolean;
  rejectReason?: string;
}

export class HardFilters {
  /**
   * Évalue les filtres bloquants stricts sans appel IA (0 coût).
   * Vérifie la mise en pause, les jours de fermeture, les contraintes gérant, les cooldowns et le plafond quotidien.
   */
  static async evaluate(
    dossierOrCandidate: ContextDossier | any,
    restaurant: any,
    rejectedThemes?: Set<string>,
    count?: number
  ): Promise<HardFilterResult> {
    // 1. Restaurant en pause explicite (Disjoncteur gérant)
    if (restaurant?.isPaused) {
      return {
        passed: false,
        rejectReason: 'Restaurant currently paused: communication désactivée par le gérant.',
      };
    }

    // 2. Jour de fermeture de l'établissement
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const todayKey = days[new Date().getDay()];
    const openingToday = restaurant?.openingHours?.[todayKey];
    if (dossierOrCandidate?.currentDay?.isClosed || openingToday === 'Fermé' || openingToday === 'closed') {
      return {
        passed: false,
        rejectReason: `Restaurant closed: l'établissement est fermé aujourd’hui (${dossierOrCandidate?.currentDay?.dayNameFr || todayKey}).`,
      };
    }

    // 3. Cooldown sur thèmes rejetés par le gérant
    if (rejectedThemes && dossierOrCandidate?.suggestedAngle && rejectedThemes.has(dossierOrCandidate.suggestedAngle)) {
      return {
        passed: false,
        rejectReason: `Theme under cooldown: l'angle '${dossierOrCandidate.suggestedAngle}' a été récemment rejeté par le gérant.`,
      };
    }

    // 4. Contraintes éditoriales explicites du profil restaurant (ex: "never talk about sports")
    const constraints: string[] = restaurant?.profile?.constraints || [];
    for (const constraint of constraints) {
      const cLower = (constraint || '').toLowerCase();
      if (cLower.includes('never talk about sports') || cLower.includes('no sports')) {
        const angle = (dossierOrCandidate?.suggestedAngle || dossierOrCandidate?.category || '').toLowerCase();
        const facts = (dossierOrCandidate?.facts || dossierOrCandidate?.factsUsed || []).join(' ').toLowerCase();
        const title = (dossierOrCandidate?.title || dossierOrCandidate?.suggestedTitle || '').toLowerCase();
        if (
          angle === 'game_night' ||
          angle.includes('sport') ||
          facts.includes('sports') ||
          facts.includes('sport') ||
          facts.includes('psg') ||
          title.includes('match') ||
          title.includes('psg')
        ) {
          return {
            passed: false,
            rejectReason: `constraint violated: ${constraint}`,
          };
        }
      }
    }

    // 5. Plafond d'opportunités du jour (Plafond de 5 opportunités max)
    if (count !== undefined && count >= 5) {
      return {
        passed: false,
        rejectReason: 'Plafond quotidien de 5 opportunités atteint.',
      };
    }

    const restId = dossierOrCandidate?.restaurant?.id || restaurant?.id;
    if (restId) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      let todayCount = 0;
      try {
        todayCount = await (prisma as any).opportunity.count({
          where: {
            restaurantId: restId,
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
    }

    return { passed: true };
  }
}

