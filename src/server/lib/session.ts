import crypto from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uiijdktqnulkipwspxjh.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SESSION_SECRET = process.env.NEXTAUTH_SECRET || process.env.CRON_SECRET || 'getspecial-session-hmac-secret-2026';

export interface SessionPayload {
  userId: string;
  email: string;
  exp: number;
}

/**
 * Signe un jeton de session HMAC-SHA256 (compatible Node.js)
 */
export function signSessionToken(payload: { userId: string; email: string; maxAgeSec?: number }): string {
  const exp = Math.floor(Date.now() / 1000) + (payload.maxAgeSec || 30 * 24 * 60 * 60);
  const data: SessionPayload = {
    userId: payload.userId,
    email: payload.email.toLowerCase().trim(),
    exp,
  };
  const encodedPayload = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

/**
 * Vérifie un jeton de session signé en temps constant
 */
export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(encodedPayload)
      .digest('base64url');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionPayload;
    if (!decoded.userId || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Vérifie un access_token JWT directement auprès de Supabase Auth (/auth/v1/user)
 */
export async function verifySupabaseAccessToken(accessToken: string): Promise<{
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string | null;
} | null> {
  if (!accessToken || typeof accessToken !== 'string') return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken.replace(/^Bearer\s+/i, '').trim()}`,
        apikey: SUPABASE_ANON_KEY,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const authUser = await res.json();
    if (!authUser || !authUser.id || !authUser.email) return null;

    const cleanEmail = String(authUser.email).toLowerCase().trim();
    const rawName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.user_metadata?.given_name ||
      cleanEmail.split('@')[0];
    const avatarUrl =
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      null;

    return {
      id: authUser.id,
      email: cleanEmail,
      name: rawName,
      avatarUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Pose les cookies de session sécurisés sur une NextResponse :
 * - getspecial_session_sig : jeton signé HMAC httpOnly (infalsifiable côté client)
 * - getspecial_session : conservé pour la compatibilité UI front-end existante
 * - getspecial_Access_token : jeton Supabase éventuel en httpOnly
 */
export function setAuthCookies(
  response: NextResponse,
  user: { id: string; email: string },
  options: {
    restaurantId?: string | null;
    supabaseAccessToken?: string | null;
  } = {}
): void {
  const maxAge = 30 * 24 * 60 * 60;
  const isProd = process.env.NODE_ENV === 'production';

  const signedToken = signSessionToken({
    userId: user.id,
    email: user.email,
    maxAgeSec: maxAge,
  });

  response.cookies.set('getspecial_session_sig', signedToken, {
    path: '/',
    maxAge,
    sameSite: 'lax',
    httpOnly: true,
    secure: isProd,
  });

  response.cookies.set('getspecial_session', user.id, {
    path: '/',
    maxAge,
    sameSite: 'lax',
    httpOnly: false,
    secure: isProd,
  });

  if (options.supabaseAccessToken) {
    response.cookies.set('sb_access_token', options.supabaseAccessToken, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
      httpOnly: true,
      secure: isProd,
    });
  }

  if (options.restaurantId !== undefined) {
    if (options.restaurantId) {
      response.cookies.set('getspecial_restaurant_id', options.restaurantId, {
        path: '/',
        maxAge,
        sameSite: 'lax',
        httpOnly: false,
        secure: isProd,
      });
    } else {
      response.cookies.set('getspecial_restaurant_id', '', {
        path: '/',
        maxAge: 0,
      });
    }
  }
}

/**
 * Extrait l'identité vérifiée de la requête entrante (Cookie signé HMAC, JWT Supabase ou fallback local dev)
 */
export async function resolveRequestUser(req: NextRequest): Promise<{
  userId: string;
  email?: string;
  isVerified: boolean;
} | null> {
  // 1. Priorité 1 : Cookie signé HMAC-SHA256
  const sigCookie = req.cookies.get('getspecial_session_sig')?.value;
  if (sigCookie) {
    const verified = verifySessionToken(sigCookie);
    if (verified) {
      return { userId: verified.userId, email: verified.email, isVerified: true };
    }
  }

  // 2. Priorité 2 : Bearer JWT Supabase ou cookie sb_access_token
  const authHeader = req.headers.get('authorization');
  const sbCookie = req.cookies.get('sb_access_token')?.value;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : sbCookie;
  if (bearerToken) {
    const sbUser = await verifySupabaseAccessToken(bearerToken);
    if (sbUser) {
      return { userId: sbUser.id, email: sbUser.email, isVerified: true };
    }
  }

  // 3. Priorité 3 : Tolérance en développement local (USE_LOCAL_DB=true ou NODE_ENV !== 'production')
  if (process.env.NODE_ENV !== 'production' || process.env.USE_LOCAL_DB === 'true') {
    const legacyCookie = req.cookies.get('getspecial_session')?.value;
    if (legacyCookie) {
      return { userId: legacyCookie, isVerified: false };
    }
  }

  return null;
}
