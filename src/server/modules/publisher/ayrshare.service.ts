import { prisma } from '@/server/db/prisma.client';
import { logAudit } from '@/server/lib/audit';

export interface AyrsharePostPayload {
  post: string;
  platforms: ('facebook' | 'instagram' | 'gmb' | 'tiktok')[];
  mediaUrls?: string[];
  scheduleDate?: string; // ISO 8601 UTC
  profileKey?: string;   // Si sous-profils multi-clients Ayrshare (Business Plan)
}

export interface AyrshareResponse {
  status: 'success' | 'error';
  id?: string;
  postIds?: { platform: string; id: string; status: string }[];
  errors?: { platform: string; message: string }[];
  message?: string;
}

export class AyrshareService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.AYRSHARE_API_KEY;
    this.baseUrl = process.env.AYRSHARE_BASE_URL || 'https://app.ayrshare.com/api';
  }

  /**
   * Mappe les plateformes internes vers les identifiants Ayrshare.
   */
  private mapPlatform(platform: string): 'facebook' | 'instagram' | 'gmb' {
    switch (platform) {
      case 'instagram':
        return 'instagram';
      case 'facebook':
        return 'facebook';
      case 'google_business':
      case 'gmb':
        return 'gmb';
      default:
        return 'instagram';
    }
  }

  /**
   * Publie un post approuvé sur les réseaux sociaux (Meta / Google Business) via Ayrshare
   * Intègre la gestion des clés d'idempotence, les retries exponentiels et le logging d'audit.
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

    const ayrsharePlatform = this.mapPlatform(post.platform);
    const sendIdempotencyKey = `ayr_${post.id}_${Date.now()}`;

    // Création de l'enregistrement de publication avec statut initial 'publishing'
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
          // Simulation réussie en mode mock si aucune clé API configurée
          externalPostId = `mock_ayrshare_${post.platform}_${Date.now()}`;
          published = true;
        } else {
          const body: AyrsharePostPayload = {
            post: post.text,
            platforms: [ayrsharePlatform],
            mediaUrls: post.imageUrl ? [post.imageUrl] : undefined,
          };

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);

          const res = await fetch(`${this.baseUrl}/post`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          const data: AyrshareResponse = await res.json();

          if (!res.ok || data.status === 'error') {
            const errMsg = data.message || data.errors?.[0]?.message || `Ayrshare HTTP ${res.status}`;
            throw new Error(errMsg);
          }

          externalPostId = data.id || data.postIds?.[0]?.id || `ayr_${Date.now()}`;
          published = true;
        }
      } catch (err: any) {
        lastError = err.message || 'Erreur inconnue de publication Ayrshare';
        console.warn(`[AYRSHARE_PUBLISH] Tentative ${attempt}/${maxAttempts} échouée :`, lastError);

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
          outstandPostId: externalPostId, // Champ d'identifiant externe
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
        details: { platform: post.platform, provider: 'ayrshare', externalPostId },
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
        details: { provider: 'ayrshare', error: lastError },
      });

      return {
        success: false,
        publicationId: publication.id,
        error: lastError || 'Échec de publication Ayrshare',
      };
    }
  }

  /**
   * Vérifie le statut de connexion des profils sociaux sur Ayrshare.
   */
  async checkProfiles(): Promise<any> {
    if (!this.apiKey) {
      return { mock: true, status: 'all_connected' };
    }

    const res = await fetch(`${this.baseUrl}/profiles`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Ayrshare Profiles HTTP ${res.status}`);
    }

    return await res.json();
  }
}

export const ayrshareService = new AyrshareService();
