import { prisma } from '@/server/db/prisma.client';
import { logAudit } from '@/server/lib/audit';

export interface ZernioPostPayload {
  content: string;
  platforms: { platform: string; accountId?: string }[];
  mediaUrls?: string[];
  publishNow?: boolean;
  scheduledAt?: string;
}

export interface ZernioResponse {
  id?: string;
  status?: string;
  error?: string;
  message?: string;
}

export class ZernioService {
  get apiKey(): string | undefined {
    return process.env.ZERNIO_API_KEY;
  }

  get baseUrl(): string {
    return process.env.ZERNIO_API_BASE_URL || 'https://api.zernio.com/v1';
  }

  constructor() {}

  /**
   * Vérifie si la clé API Zernio est configurée
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.startsWith('sk_'));
  }

  /**
   * Mappe les plateformes internes vers les clés Zernio
   */
  private mapPlatform(platform: string): string {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'instagram';
      case 'facebook':
        return 'facebook';
      case 'google_business':
      case 'gmb':
        return 'google_business';
      case 'tiktok':
        return 'tiktok';
      default:
        return 'instagram';
    }
  }

  /**
   * Publie un post sur les réseaux sociaux (Meta, Google Business, TikTok, etc.) via Zernio
   * Gère l'idempotence, les retries exponentiels et le mode mock sans clé API.
   */
  async publishPost(postId: string): Promise<{ success: boolean; publicationId: string; externalId?: string; error?: string }> {
    const post = await (prisma as any).post.findUnique({
      where: { id: postId },
      include: {
        restaurant: {
          include: { socialAccounts: true },
        },
      },
    });

    if (!post) throw new Error('Post introuvable');
    if (post.status !== 'approved' && post.status !== 'scheduled') {
      throw new Error(`Le statut du post (${post.status}) ne permet pas la publication.`);
    }

    const targetPlatform = this.mapPlatform(post.platform);
    const sendIdempotencyKey = `zernio_${post.id}_${Date.now()}`;

    // Trouver le compte associé si existant
    const account = post.restaurant.socialAccounts?.find(
      (acc: any) => acc.platform === post.platform && acc.status === 'connected'
    );

    const publication = await (prisma as any).publication.create({
      data: {
        restaurantId: post.restaurantId,
        postId: post.id,
        platform: post.platform,
        sendIdempotencyKey,
        status: 'publishing',
        attempts: 1,
      },
    });

    let maxAttempts = 3;
    let attempt = 0;
    let published = false;
    let externalPostId: string | null = null;
    let lastError: string | null = null;

    while (attempt < maxAttempts && !published) {
      attempt++;
      try {
        if (!this.apiKey) {
          // Mode simulation mock transparent pour le développement local
          externalPostId = `mock_zernio_${post.platform}_${Date.now()}`;
          published = true;
        } else {
          const body: ZernioPostPayload = {
            content: post.text,
            platforms: [
              {
                platform: targetPlatform,
                accountId: account?.outstandAccountId || undefined,
              },
            ],
            mediaUrls: post.imageUrl ? [post.imageUrl] : undefined,
            publishNow: true,
          };

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);

          const res = await fetch(`${this.baseUrl}/posts`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'Idempotency-Key': sendIdempotencyKey,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          const data: ZernioResponse = await res.json();

          if (!res.ok) {
            throw new Error(data.message || data.error || `Zernio HTTP ${res.status}`);
          }

          externalPostId = data.id || `zernio_${Date.now()}`;
          published = true;
        }
      } catch (err: any) {
        lastError = err.message || 'Erreur inconnue de publication Zernio';
        console.warn(`[ZERNIO_PUBLISH] Tentative ${attempt}/${maxAttempts} échouée :`, lastError);

        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }

    if (published) {
      await (prisma as any).publication.update({
        where: { id: publication.id },
        data: {
          status: 'published',
          outstandPostId: externalPostId, // Rempli avec l'ID Zernio
          publishedAt: new Date(),
          attempts: attempt,
        },
      });

      await (prisma as any).post.update({
        where: { id: post.id },
        data: {
          status: 'published',
          publishedAt: new Date(),
        },
      });

      await logAudit({
        restaurantId: post.restaurantId,
        action: 'publication.success',
        entityType: 'publication',
        entityId: publication.id,
        details: { platform: post.platform, provider: 'zernio', externalPostId },
      });

      return { success: true, publicationId: publication.id, externalId: externalPostId || undefined };
    } else {
      await (prisma as any).publication.update({
        where: { id: publication.id },
        data: {
          status: 'failed',
          lastError,
          attempts: attempt,
        },
      });

      await (prisma as any).post.update({
        where: { id: post.id },
        data: { status: 'failed' },
      });

      await logAudit({
        restaurantId: post.restaurantId,
        action: 'publication.failed',
        entityType: 'publication',
        entityId: publication.id,
        details: { provider: 'zernio', error: lastError },
      });

      return {
        success: false,
        publicationId: publication.id,
        error: lastError || 'Échec de publication Zernio',
      };
    }
  }
}

export const zernioService = new ZernioService();
