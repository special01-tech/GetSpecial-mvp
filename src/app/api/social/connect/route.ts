import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { directOAuthService, SupportedSocialPlatform } from '@/server/modules/social-oauth/direct-oauth.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform') as SupportedSocialPlatform;
    const restaurantId = searchParams.get('restaurantId');
    const returnUrl = searchParams.get('returnUrl') || '/dashboard/settings';

    if (!platform || !['facebook', 'instagram', 'tiktok', 'google_business'].includes(platform)) {
      return error('Plateforme invalide ou non supportée (facebook, instagram, tiktok, google_business)', 400);
    }

    if (!restaurantId) {
      return error('restaurantId requis', 400);
    }

    const origin = req.nextUrl.origin;
    const { url, isDirectConfigured } = directOAuthService.getAuthorizationUrl(
      platform,
      restaurantId,
      origin,
      returnUrl
    );

    return success({ url, isDirectConfigured, platform });
  } catch (err: any) {
    return error(err.message || 'Erreur lors de la génération de l’autorisation OAuth', 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, restaurantId, returnUrl } = body;

    if (!platform || !['facebook', 'instagram', 'tiktok', 'google_business'].includes(platform)) {
      return error('Plateforme invalide ou non supportée', 400);
    }

    if (!restaurantId) {
      return error('restaurantId requis', 400);
    }

    const origin = req.nextUrl.origin;
    const { url, isDirectConfigured } = directOAuthService.getAuthorizationUrl(
      platform,
      restaurantId,
      origin,
      returnUrl
    );

    return success({ url, isDirectConfigured, platform });
  } catch (err: any) {
    return error(err.message || 'Erreur lors de la génération de l’autorisation OAuth', 400);
  }
}
