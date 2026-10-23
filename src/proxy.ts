import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Proxy (Next.js 16 Convention) — Protection des routes de l'application
 *
 * 1. Protège l'espace /dashboard/:path* en vérifiant la session (Supabase / Cookie signé).
 * 2. Ajoute les en-têtes de sécurité HTTP standards.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Routes protégées sous /dashboard
  if (pathname.startsWith('/dashboard')) {
    const signedSession = request.cookies.get('getspecial_session_sig')?.value;
    const legacySession = request.cookies.get('getspecial_session')?.value;
    const sbToken = request.cookies.get('sb_access_token')?.value;
    const authHeader = request.headers.get('authorization');

    const isProd = process.env.NODE_ENV === 'production';
    const hasAuth = isProd
      ? Boolean(signedSession || sbToken || authHeader)
      : Boolean(signedSession || legacySession || sbToken || authHeader);

    if (!hasAuth && isProd) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
