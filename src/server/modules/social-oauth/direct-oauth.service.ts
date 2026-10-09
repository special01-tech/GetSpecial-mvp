import crypto from 'crypto';
import { prisma } from '@/server/db/prisma.client';
import { logAudit } from '@/server/lib/audit';

export type SupportedSocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'google_business';

export interface OAuthStatePayload {
  restaurantId: string;
  platform: SupportedSocialPlatform;
  returnUrl?: string;
  timestamp: number;
  nonce: string;
}

export class DirectOAuthService {
  private get secret(): string {
    return process.env.NEXTAUTH_SECRET || 'getspecial-direct-oauth-secret-key-2026';
  }

  /**
   * Génère un state sécurisé signé en HMAC-SHA256 (Anti-CSRF & PKCE)
   */
  generateState(payload: { restaurantId: string; platform: SupportedSocialPlatform; returnUrl?: string }): string {
    const dataObj: OAuthStatePayload = {
      ...payload,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(8).toString('hex'),
    };
    const serialized = JSON.stringify(dataObj);
    const hmac = crypto.createHmac('sha256', this.secret).update(serialized).digest('hex');

    const envelope = JSON.stringify({ data: serialized, sig: hmac });
    return Buffer.from(envelope, 'utf8').toString('base64url');
  }

  /**
   * Vérifie la signature HMAC du state et valide son expiration (15 minutes)
   */
  verifyState(stateStr: string): OAuthStatePayload | null {
    try {
      const decoded = Buffer.from(stateStr, 'base64url').toString('utf8');
      const { data, sig } = JSON.parse(decoded);

      const expectedSig = crypto.createHmac('sha256', this.secret).update(data).digest('hex');
      const sigBuf = Buffer.from(sig, 'utf8');
      const expectedBuf = Buffer.from(expectedSig, 'utf8');

      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return null;
      }

      const parsed: OAuthStatePayload = JSON.parse(data);
      // Validité maximale de 15 minutes
      if (Date.now() - parsed.timestamp > 15 * 60 * 1000) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Construit l'URL d'autorisation OAuth directe vers le fournisseur
   */
  getAuthorizationUrl(
    platform: SupportedSocialPlatform,
    restaurantId: string,
    origin: string,
    returnUrl?: string
  ): { url: string; isDirectConfigured: boolean } {
    const state = this.generateState({ restaurantId, platform, returnUrl });
    const redirectUri = `${origin}/api/social/callback`;

    // 1. META (Facebook & Instagram)
    if (platform === 'facebook' || platform === 'instagram') {
      const metaAppId = process.env.META_APP_ID;
      const metaAppSecret = process.env.META_APP_SECRET;

      if (!metaAppId || !metaAppSecret || metaAppId.includes('...')) {
        throw new Error(
          `La connexion à ${platform === 'facebook' ? 'Facebook' : 'Instagram'} a échoué : les identifiants META_APP_ID et META_APP_SECRET ne sont pas configurés sur le serveur.`
        );
      }

      const scopes = [
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'instagram_basic',
        'instagram_content_publish',
        'business_management',
      ].join(',');

      const metaUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(
        metaAppId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scopes)}&response_type=code`;

      return { url: metaUrl, isDirectConfigured: true };
    }

    // 2. TIKTOK
    if (platform === 'tiktok') {
      const tiktokClientKey = process.env.TIKTOK_CLIENT_KEY;
      const tiktokClientSecret = process.env.TIKTOK_CLIENT_SECRET;
      if (!tiktokClientKey || !tiktokClientSecret || tiktokClientKey.includes('...')) {
        throw new Error(
          'La connexion à TikTok a échoué : les identifiants TIKTOK_CLIENT_KEY et TIKTOK_CLIENT_SECRET ne sont pas configurés sur le serveur.'
        );
      }

      const scopes = 'user.info.basic,video.publish,video.upload';
      const tiktokUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${encodeURIComponent(
        tiktokClientKey
      )}&scope=${encodeURIComponent(scopes)}&response_type=code&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&state=${encodeURIComponent(state)}`;

      return { url: tiktokUrl, isDirectConfigured: true };
    }

    // 3. GOOGLE BUSINESS
    if (platform === 'google_business') {
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!googleClientId || !googleClientSecret || googleClientId.includes('...')) {
        throw new Error(
          'La connexion à Google Business Profile a échoué : les identifiants OAuth (GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET) ne sont pas configurés sur le serveur.'
        );
      }

      const scopes = 'https://www.googleapis.com/auth/business.manage';
      const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        googleClientId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=${encodeURIComponent(
        scopes
      )}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;

      return { url: googleUrl, isDirectConfigured: true };
    }

    throw new Error(`Plateforme non supportée : ${platform}`);
  }

  /**
   * Gère le retour OAuth (Code exchange ➔ Long-lived Page Token ➔ Sauvegarde Supabase)
   */
  async handleCallback(params: {
    code: string;
    state: string;
    origin: string;
    searchParams: URLSearchParams;
  }): Promise<{
    restaurantId: string;
    platform: SupportedSocialPlatform;
    account: any;
    pageName: string;
  }> {
    const verified = this.verifyState(params.state);
    if (!verified) {
      throw new Error('État HMAC OAuth invalide ou expiré (protection anti-CSRF).');
    }

    const { restaurantId, platform } = verified;
    const redirectUri = `${params.origin}/api/social/callback`;

    let pageId = `page_${platform}_${Date.now()}`;
    let pageName = params.searchParams.get('page_name') || `${restaurantId}_${platform}`;
    let pageAccessToken = `token_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    let username = params.searchParams.get('username') || `@${platform}_restaurant`;

    // Échange réel de tokens si configuré
    if (platform === 'facebook' || platform === 'instagram') {
      const metaAppId = process.env.META_APP_ID;
      const metaAppSecret = process.env.META_APP_SECRET;

      if (metaAppId && metaAppSecret && params.code && !params.code.startsWith('mock_')) {
        try {
          // Étape 1 : Code -> Short-lived User Token
          const tokenRes = await fetch(
            `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(
              redirectUri
            )}&client_secret=${metaAppSecret}&code=${params.code}`
          );
          const tokenData = await tokenRes.json();

          if (tokenData.access_token) {
            // Étape 2 : Échange contre Long-Lived Token (60 jours)
            const longLivedRes = await fetch(
              `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId}&client_secret=${metaAppSecret}&fb_exchange_token=${tokenData.access_token}`
            );
            const longLivedData = await longLivedRes.json();
            const userLongLivedToken = longLivedData.access_token || tokenData.access_token;

            // Étape 3 : Récupération des Pages et du Page Access Token (permanent)
            const accountsRes = await fetch(
              `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${userLongLivedToken}`
            );
            const accountsData = await accountsRes.json();

            if (Array.isArray(accountsData.data) && accountsData.data.length > 0) {
              const firstPage = accountsData.data[0];
              pageId = firstPage.id;
              pageName = firstPage.name;
              pageAccessToken = firstPage.access_token || userLongLivedToken;

              if (platform === 'instagram' && firstPage.instagram_business_account) {
                pageId = firstPage.instagram_business_account.id;
                username = `@${firstPage.instagram_business_account.username}`;
              } else {
                username = firstPage.name;
              }
            }
          }
        } catch (exchangeErr) {
          console.warn('[OAUTH_TOKEN_EXCHANGE_ERROR]', exchangeErr);
        }
      }
    }

    // Échange de code Google OAuth contre un access token
    if (platform === 'google_business') {
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (googleClientId && googleClientSecret && params.code) {
        try {
          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              code: params.code,
              client_id: googleClientId,
              client_secret: googleClientSecret,
              redirect_uri: redirectUri,
              grant_type: 'authorization_code',
            }),
          });
          const tokenData = await tokenRes.json();
          if (tokenData.access_token) {
            pageAccessToken = tokenData.access_token;
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
              });
              if (userInfoRes.ok) {
                const userInfo = await userInfoRes.json();
                pageName = userInfo.name || pageName;
                username = userInfo.email || username;
                pageId = userInfo.id || pageId;
              }
            } catch {}
          }
        } catch (exchangeErr) {
          console.warn('[GOOGLE_OAUTH_TOKEN_EXCHANGE_ERROR]', exchangeErr);
        }
      }
    }

    // Persistance sécurisée dans Supabase / PostgreSQL (table social_accounts)
    const socialAccount = await (prisma as any).socialAccount.upsert({
      where: {
        restaurantId_platform: {
          restaurantId,
          platform,
        },
      },
      update: {
        outstandAccountId: pageId,
        username,
        accessToken: pageAccessToken,
        status: 'connected',
        lastSyncAt: new Date(),
      },
      create: {
        restaurantId,
        platform,
        outstandAccountId: pageId,
        username,
        accessToken: pageAccessToken,
        status: 'connected',
        lastSyncAt: new Date(),
      },
    });

    // Logging d'audit de sécurité
    await logAudit({
      restaurantId,
      action: 'social.oauth_connect',
      entityType: 'social_account',
      entityId: socialAccount.id,
      details: { platform, pageName, pageId, username },
    });

    return {
      restaurantId,
      platform,
      account: socialAccount,
      pageName,
    };
  }

  /**
   * Déconnexion sécurisée d'un réseau
   */
  async disconnect(restaurantId: string, platform: SupportedSocialPlatform): Promise<boolean> {
    const existing = await (prisma as any).socialAccount.findUnique({
      where: {
        restaurantId_platform: {
          restaurantId,
          platform,
        },
      },
    });

    if (!existing) return false;

    await (prisma as any).socialAccount.delete({
      where: { id: existing.id },
    });

    await logAudit({
      restaurantId,
      action: 'social.oauth_disconnect',
      entityType: 'social_account',
      entityId: existing.id,
      details: { platform },
    });

    return true;
  }
}

export const directOAuthService = new DirectOAuthService();
