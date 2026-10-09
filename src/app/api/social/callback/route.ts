import { NextRequest, NextResponse } from 'next/server';
import { directOAuthService } from '@/server/modules/social-oauth/direct-oauth.service';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const { searchParams } = new URL(req.url);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Si l'utilisateur a annulé sur la page d'autorisation
  if (error) {
    const errorMsg = errorDescription || error || 'Autorisation refusée par l’utilisateur';
    return NextResponse.redirect(
      new URL(`/dashboard/settings?connection=error&message=${encodeURIComponent(errorMsg)}`, origin)
    );
  }

  if (!state) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?connection=error&message=Paramètre+state+manquant', origin)
    );
  }

  try {
    const result = await directOAuthService.handleCallback({
      code: code || 'direct_oauth_authorized',
      state,
      origin,
      searchParams,
    });

    const redirectUrl = new URL('/dashboard/settings', origin);
    redirectUrl.searchParams.set('connection', 'success');
    redirectUrl.searchParams.set('platform', result.platform);
    if (result.account?.username) {
      redirectUrl.searchParams.set('username', result.account.username);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error('[OAUTH_CALLBACK_ERROR]', err);
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?connection=error&message=${encodeURIComponent(err.message || 'Échec de connexion')}`,
        origin
      )
    );
  }
}
