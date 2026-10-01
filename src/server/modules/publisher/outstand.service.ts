import { prisma } from '@/server/db/prisma.client';
import { logAudit } from '@/server/lib/audit';

export class OutstandService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly redirectUri: string;

  constructor() {
    this.apiKey = process.env.OUTSTAND_API_KEY;
    this.baseUrl = process.env.OUTSTAND_API_BASE_URL || 'https://api.outstand.so/v1';
    this.redirectUri = process.env.OUTSTAND_REDIRECT_URI || 'http://localhost:3000/api/social/callback';
  }

  /**
   * Obtient l'URL d'autorisation OAuth d'Outstand pour rediriger le gérant
   */
  async getConnectUrl(platform: 'facebook' | 'instagram', restaurantId: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Clé API Outstand non configurée dans .env.');
    }

    const res = await fetch(`${this.baseUrl}/oauth/connect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform,
        redirect_uri: this.redirectUri,
        state: restaurantId,
      }),
    });

    if (!res.ok) {
      throw new Error(`Outstand OAuth Connect Error: ${res.status}`);
    }

    const data = await res.json();
    return data.url;
  }

  /**
   * Publie un post approuvé sur Facebook ou Instagram avec idempotence et verrouillage
   */
  async publishPost(postId: string): Promise<{ success: boolean; publicationId: string; error?: string }> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { restaurant: { include: { socialAccounts: true } } },
    });

    if (!post) throw new Error('Post introuvable');
    if (post.status !== 'approved' && post.status !== 'scheduled') {
      throw new Error(`Le statut du post (${post.status}) ne permet pas la publication.`);
    }

    const account = post.restaurant?.socialAccounts?.find(
      (acc: any) => acc.platform === post.platform && acc.status === 'connected'
    );

    // Clé d'idempotence unique par envoi
    const sendIdempotencyKey = `pub_${post.id}_${Date.now()}`;

    // Créer la ligne publication avec verrou initial
    const publication = await prisma.publication.create({
      data: {
        restaurantId: post.restaurantId,
        postId: post.id,
        platform: post.platform,
        sendIdempotencyKey,
        status: 'publishing',
        attempts: 1,
      },
    });

    if (!this.apiKey) {
      const errNotice = 'Clé API Outstand non configurée dans .env. Publication externe suspendue.';
      await prisma.publication.update({
        where: { id: publication.id },
        data: {
          status: 'failed',
          lastError: errNotice,
        },
      });
      return { success: false, publicationId: publication.id, error: errNotice };
    }

    let maxAttempts = 3;
    let attempt = 0;
    let published = false;
    let outstandPostId: string | null = null;
    let lastError: string | null = null;

    while (attempt < maxAttempts && !published) {
      attempt++;
      try {
        const res = await fetch(`${this.baseUrl}/posts`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': sendIdempotencyKey,
          },
          body: JSON.stringify({
            account_id: account?.outstandAccountId || undefined,
            text: post.text,
            media_urls: post.imageUrl ? [post.imageUrl] : [],
          }),
        });

        if (!res.ok) {
          const errData = await res.text();
          throw new Error(`HTTP ${res.status}: ${errData}`);
        }

        const resData = await res.json();
        outstandPostId = resData.id;
        published = true;
      } catch (err: any) {
        lastError = err.message || 'Erreur inconnue lors de la publication';
        console.warn(`[OUTSTAND_PUBLISH] Tentative ${attempt}/${maxAttempts} échouée :`, lastError);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }

    if (published) {
      await prisma.publication.update({
        where: { id: publication.id },
        data: {
          status: 'published',
          outstandPostId,
          publishedAt: new Date(),
          attempts: attempt,
        },
      });

      await prisma.post.update({
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
        details: { platform: post.platform, outstandPostId },
      });

      return { success: true, publicationId: publication.id };
    } else {
      await prisma.publication.update({
        where: { id: publication.id },
        data: {
          status: 'failed',
          lastError,
          attempts: attempt,
        },
      });

      await prisma.post.update({
        where: { id: post.id },
        data: { status: 'failed' },
      });

      await logAudit({
        restaurantId: post.restaurantId,
        action: 'publication.failed',
        entityType: 'publication',
        entityId: publication.id,
        details: { error: lastError },
      });

      return { success: false, publicationId: publication.id, error: lastError || 'Échec de publication' };
    }
  }
}

export const outstandService = new OutstandService();
