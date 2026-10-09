import { prisma } from '@/server/db/prisma.client';
import { outstandService } from './outstand.service';
import { zernioService } from './zernio.service';
import { metaPublisherService } from './meta-publisher.service';
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
      include: {
        restaurant: {
          include: { socialAccounts: true },
        },
      },
      take: 10,
    });

    let executed = 0;
    let failed = 0;

    for (const post of duePosts) {
      try {
        const platform = post.platform.toLowerCase();
        const directAccount = post.restaurant?.socialAccounts?.find(
          (acc: any) =>
            acc.platform.toLowerCase() === platform &&
            acc.status === 'connected' &&
            Boolean(acc.accessToken)
        );

        let result: { success: boolean; publicationId: string; error?: string };

        // 1. Priorité 1 : OAuth Direct (si compte connecté avec Page Access Token)
        if (directAccount && (platform === 'facebook' || platform === 'instagram')) {
          result = await metaPublisherService.publishPost(post.id);
        }
        // 2. Priorité 2 : Passerelle Zernio
        else if (process.env.ZERNIO_API_KEY) {
          result = await zernioService.publishPost(post.id);
        }
        // 3. Fallback : Outstand
        else {
          result = await outstandService.publishPost(post.id);
        }

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
