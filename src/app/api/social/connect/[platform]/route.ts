import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { directOAuthService, SupportedSocialPlatform } from '@/server/modules/social-oauth/direct-oauth.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    const body = await req.json();
    const { restaurantId, returnUrl } = body;

    if (!restaurantId) {
      return error('restaurantId requis', 400);
    }

    if (!['facebook', 'instagram', 'tiktok', 'google_business'].includes(platform)) {
      return error('Plateforme non supportée (facebook, instagram, tiktok, google_business)', 400);
    }

    const origin = req.nextUrl.origin;
    const { url, isDirectConfigured } = directOAuthService.getAuthorizationUrl(
      platform as SupportedSocialPlatform,
      restaurantId,
      origin,
      returnUrl
    );

    return success({ url, isDirectConfigured, platform });
  } catch (err: any) {
    return error(err.message, 400);
  }
}
