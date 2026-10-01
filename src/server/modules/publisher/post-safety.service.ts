import { prisma } from '@/server/db/prisma.client';
import { logAudit } from '@/server/lib/audit';
import { preflightService } from './preflight.service';

export type PostStatus = 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'failed';

export class PostSafetyService {
  /**
   * Vérifie si la sécurité globale de la plateforme est activée
   */
  isPlatformSafetyPaused(): boolean {
    return process.env.NEXT_PUBLIC_GLOBAL_SAFETY_PAUSE === 'true';
  }

  /**
   * Valide les prérequis de sécurité avant passage en approbation ou publication :
   * 1. Pause globale désactivée
   * 2. Pause restaurant désactivée
   * 3. Compte réseau social connecté
   */
  async validateSafetyChecks(postId: string, restaurantId: string): Promise<{ valid: boolean; reason?: string; requiresAccountConnection?: boolean }> {
    if (this.isPlatformSafetyPaused()) {
      return { valid: false, reason: 'Pause globale de sécurité de la plateforme active.' };
    }

    const restaurant = await (prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      include: { socialAccounts: true },
    });

    if (!restaurant) {
      return { valid: false, reason: 'Restaurant introuvable.' };
    }

    if (restaurant.isPaused) {
      return { valid: false, reason: 'La communication du restaurant est actuellement en pause.' };
    }

    const post = await (prisma as any).post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return { valid: false, reason: 'Post introuvable.' };
    }

    // La validation du compte est une alerte informative lors de l'approbation,
    // mais sera strictement requise lors de la publication effective.
    const hasAccount = (restaurant.socialAccounts || []).some(
      (acc: any) => acc.platform === post.platform && acc.status === 'connected'
    );

    return {
      valid: true,
      requiresAccountConnection: !hasAccount,
    };
  }

  /**
   * Seule l'action explicite du gérant fait passer un post de pending_approval à approved
   */
  async approvePost(postId: string, restaurantId: string, scheduledAt?: Date) {
    const safety = await this.validateSafetyChecks(postId, restaurantId);
    if (!safety.valid) {
      throw new Error(`Contrôle de sécurité échoué : ${safety.reason}`);
    }

    const preflight = await preflightService.runPreflight(postId, restaurantId);
    if (!preflight.canPublish) {
      throw new Error(`Preflight bloqué : ${preflight.blockReason}`);
    }

    const status: PostStatus = scheduledAt ? 'scheduled' : 'approved';

    const updated = await (prisma as any).post.update({
      where: { id: postId, restaurantId },
      data: {
        status,
        approvedAt: new Date(),
        scheduledAt: scheduledAt || new Date(),
      },
    });

    await logAudit({
      restaurantId,
      action: 'post.approve',
      entityType: 'post',
      entityId: postId,
      details: { status, scheduledAt },
    });

    return updated;
  }

  /**
   * Bascule le bouton de pause du restaurant
   */
  async toggleRestaurantPause(restaurantId: string, isPaused: boolean) {
    const updated = await (prisma as any).restaurant.update({
      where: { id: restaurantId },
      data: { isPaused },
    });

    await logAudit({
      restaurantId,
      action: isPaused ? 'restaurant.pause' : 'restaurant.resume',
      entityType: 'restaurant',
      entityId: restaurantId,
    });

    return updated;
  }
}

export const postSafetyService = new PostSafetyService();
