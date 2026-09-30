import { prisma } from '@/server/db/prisma.client';
import { outstandService } from './outstand.service';
import { zernioService } from './zernio.service';
import { postSafetyService } from './post-safety.service';

export class PublicationScheduler {
  /**
   * Tâche planifiée qui prend les posts 'approved' ou 'scheduled' dont l'heure est arrivée (en UTC).
   * Verrouillage anti-doublon et gestion d'échec sécurisée.
   */
  async runDuePublications(): Promise<{ executed: number; failed: number }> {
    if (postSafetyService.isPlatformSafetyPaused()) {
      console.warn('[PUBLICATION_SCHEDULER] Plateforme en pause de sécurité globale. Envois ignorés.');
      return { executed: 0, failed: 0 };
    }

    const nowUtc = new Date();

    const duePosts = await (prisma as any).post.findMany({
      where: {
        status: { in: ['approved', 'scheduled'] },
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: nowUtc } },
        ],
        restaurant: {
          isPaused: false,
          status: 'active',
        },
      },
      take: 10,
    });

    let executed = 0;
    let failed = 0;

    for (const post of duePosts) {
      try {
        // Priorité à Zernio si configuré, sinon Outstand
        const result = process.env.ZERNIO_API_KEY
          ? await zernioService.publishPost(post.id)
          : await outstandService.publishPost(post.id);

        if (result.success) {
          executed++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`[PUBLICATION_SCHEDULER] Erreur sur le post ${post.id}`, err);
        failed++;
      }
    }

    return { executed, failed };
  }
}

export const publicationScheduler = new PublicationScheduler();
