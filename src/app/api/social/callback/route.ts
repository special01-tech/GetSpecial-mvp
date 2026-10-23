import { NextRequest, NextResponse } from 'next/server';
import { directOAuthService } from '@/server/modules/social-oauth/direct-oauth.service';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const { searchParams } = new URL(req.url);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  let targetReturnUrl = '/dashboard/settings';
  if (state) {
    const verified = directOAuthService.verifyState(state);
    if (verified?.returnUrl) {
      targetReturnUrl = verified.returnUrl;
    }
  }

  // Si l'utilisateur a annulé sur la page d'autorisation
  if (error) {
    const errorMsg = errorDescription || error || 'Autorisation refusée par l’utilisateur';
    const redirectUrl = new URL(targetReturnUrl, origin);
    redirectUrl.searchParams.set('connection', 'error');
    redirectUrl.searchParams.set('message', errorMsg);
    return NextResponse.redirect(redirectUrl);
  }

  if (!state) {
    const redirectUrl = new URL(targetReturnUrl, origin);
    redirectUrl.searchParams.set('connection', 'error');
    redirectUrl.searchParams.set('message', 'Paramètre state manquant');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const result = await directOAuthService.handleCallback({
      code: code || 'direct_oauth_authorized',
      state,
      origin,
      searchParams,
    });

    const destination = result.returnUrl || targetReturnUrl;
    const redirectUrl = new URL(destination, origin);
    redirectUrl.searchParams.set('connection', 'success');
    redirectUrl.searchParams.set('platform', result.platform);
    if (result.account?.username) {
      redirectUrl.searchParams.set('username', result.account.username);
    }
    if (result.account?.outstandAccountId) {
      redirectUrl.searchParams.set('accountId', result.account.outstandAccountId);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error('[OAUTH_CALLBACK_ERROR]', err);
    const redirectUrl = new URL(targetReturnUrl, origin);
    redirectUrl.searchParams.set('connection', 'error');
    redirectUrl.searchParams.set('message', err.message || 'Échec de connexion');
    return NextResponse.redirect(redirectUrl);
  }
}
