import { prisma } from '@/server/db/prisma.client';
import { logAudit } from '@/server/lib/audit';

export class MetaPublisherService {
  /**
   * Publie directement un post sur la Page Facebook ou le compte Instagram Professionnel
   * en utilisant le Page Access Token permanent stocké dans Supabase.
   */
  async publishPost(postId: string): Promise<{
    success: boolean;
    publicationId: string;
    externalId?: string;
    error?: string;
  }> {
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

    // Récupérer le compte social relié
    const platform = post.platform.toLowerCase();
    const account = post.restaurant.socialAccounts?.find(
      (acc: any) => acc.platform.toLowerCase() === platform && acc.status === 'connected'
    );

    if (!account) {
      throw new Error(`Compte ${post.platform} non connecté pour cet établissement.`);
    }

    const pageId = account.outstandAccountId;
    const accessToken = account.accessToken;

    if (!pageId || !accessToken) {
      throw new Error(`Identifiant ou jeton d’accès de page manquant pour ${post.platform}.`);
    }

    // Clé d'idempotence unique par envoi
    const sendIdempotencyKey = `direct_meta_${post.id}_${Date.now()}`;

    // Enregistrement initial de la publication avec statut 'publishing'
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

    // Détection du mode développement / mock
    const isMockToken = accessToken.startsWith('token_') || accessToken.startsWith('mock_');

    while (attempt < maxAttempts && !published) {
      attempt++;
      try {
        if (isMockToken) {
          // Simulation réussie en environnement de développement local
          externalPostId = `direct_meta_${platform}_${Date.now()}`;
          published = true;
        } else {
          // Appel réel à l'API Meta Graph v19.0
          if (platform === 'facebook') {
            externalPostId = await this.publishToFacebook(pageId, accessToken, post.text, post.imageUrl);
            published = true;
          } else if (platform === 'instagram') {
            externalPostId = await this.publishToInstagram(pageId, accessToken, post.text, post.imageUrl);
            published = true;
          } else {
            throw new Error(`Plateforme ${platform} non prise en charge par le driver Meta.`);
          }
        }
      } catch (err: any) {
        lastError = err.message || 'Erreur inconnue lors de l’envoi Meta Graph API';
        console.warn(`[META_DIRECT_PUBLISH] Tentative ${attempt}/${maxAttempts} échouée :`, lastError);

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
          outstandPostId: externalPostId,
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
        action: 'publication.direct_meta_success',
        entityType: 'publication',
        entityId: publication.id,
        details: { platform: post.platform, externalPostId, provider: 'meta_direct' },
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
        action: 'publication.direct_meta_failed',
        entityType: 'publication',
        entityId: publication.id,
        details: { provider: 'meta_direct', error: lastError },
      });

      return {
        success: false,
        publicationId: publication.id,
        error: lastError || 'Échec de publication Meta Direct',
      };
    }
  }

  /**
   * Publication sur une Page Facebook via Graph API
   */
  private async publishToFacebook(
    pageId: string,
    accessToken: string,
    text: string,
    imageUrl?: string | null
  ): Promise<string> {
    const endpoint = imageUrl
      ? `https://graph.facebook.com/v19.0/${pageId}/photos`
      : `https://graph.facebook.com/v19.0/${pageId}/feed`;

    const bodyParams = imageUrl
      ? { url: imageUrl, caption: text, access_token: accessToken }
      : { message: text, access_token: accessToken };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyParams),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `Facebook Graph API Error HTTP ${res.status}`);
    }

    return data.id || data.post_id;
  }

  /**
   * Publication sur Instagram Professionnel (Processus en 2 étapes obligatoire chez Meta)
   */
  private async publishToInstagram(
    igUserId: string,
    accessToken: string,
    caption: string,
    imageUrl?: string | null
  ): Promise<string> {
    if (!imageUrl) {
      throw new Error('Une URL d’image publique est obligatoire pour publier sur Instagram.');
    }

    // Étape 1 : Créer le Media Container
    const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    });

    const containerData = await containerRes.json();
    if (!containerRes.ok || containerData.error || !containerData.id) {
      throw new Error(containerData.error?.message || 'Échec de création du conteneur média Instagram');
    }

    const containerId = containerData.id;

    // Étape 2 : Publier le Media Container
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    });

    const publishData = await publishRes.json();
    if (!publishRes.ok || publishData.error || !publishData.id) {
      throw new Error(publishData.error?.message || 'Échec de publication finale sur Instagram');
    }

    return publishData.id;
  }
}

export const metaPublisherService = new MetaPublisherService();
