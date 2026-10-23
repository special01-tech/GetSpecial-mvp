import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { setAuthCookies } from '@/server/lib/session';

async function exchangeSupabaseCode(supabaseUrl: string, anonKey: string, code: string) {
  try {
    // 1. Tentative PKCE
    const pkceRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ auth_code: code }),
    });

    const pkceData = await pkceRes.json();
    if (pkceRes.ok && pkceData.user) {
      return { user: pkceData.user, session: pkceData, error: null };
    }

    // 2. Tentative Authorization Code standard
    const authCodeRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=authorization_code`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const authCodeData = await authCodeRes.json();
    if (authCodeRes.ok && authCodeData.user) {
      return { user: authCodeData.user, session: authCodeData, error: null };
    }

    return {
      user: null,
      session: null,
      error: pkceData.error_description || pkceData.msg || authCodeData.error_description || 'Échec de récupération de la session Supabase',
    };
  } catch (err: any) {
    return { user: null, session: null, error: err.message };
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const errorParam = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (errorParam) {
    console.error('[Supabase Auth Callback Error]:', errorParam, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || errorParam)}`, request.url)
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uiijdktqnulkipwspxjh.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // 1. FLUX PKCE (Code présent dans l'URL)
  if (code) {
    try {
      const { user: authUser, session: authSession, error: exchangeError } = await exchangeSupabaseCode(
        supabaseUrl,
        supabaseAnonKey,
        code
      );

      if (exchangeError || !authUser) {
        console.error('[Supabase Exchange Code Error]:', exchangeError);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError || 'Session exchange failed')}`, request.url)
        );
      }

      const cleanEmail = (authUser.email || '').toLowerCase().trim();
      const rawName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.user_metadata?.given_name ||
        cleanEmail.split('@')[0] ||
        'Restaurateur';
      const avatarUrl =
        authUser.user_metadata?.avatar_url ||
        authUser.user_metadata?.picture ||
        null;

      // Upsert dans la vraie table `users` de Supabase PostgreSQL via Prisma
      let dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: authUser.id },
            { email: cleanEmail },
          ],
        },
      });

      if (dbUser) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            name: rawName,
            avatarUrl: avatarUrl || dbUser.avatarUrl,
          },
        });
      } else {
        dbUser = await prisma.user.create({
          data: {
            id: authUser.id,
            email: cleanEmail,
            name: rawName,
            avatarUrl,
          },
        });
      }

      // Vérifier si l'utilisateur possède déjà un restaurant actif
      const existingRestaurant = await prisma.restaurant.findFirst({
        where: { userId: dbUser.id },
        select: { id: true, name: true },
        orderBy: { createdAt: 'desc' },
      });

      const destination = existingRestaurant ? '/dashboard' : '/onboarding';
      const response = NextResponse.redirect(new URL(destination, request.url));

      // Cookies de session signés HMAC + Supabase
      setAuthCookies(
        response,
        { id: dbUser.id, email: dbUser.email },
        {
          restaurantId: existingRestaurant?.id || null,
          supabaseAccessToken: authSession?.access_token || null,
        }
      );

      return response;
    } catch (err: any) {
      console.error('[Supabase Auth Callback Exception]:', err);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(err.message || 'Authentication error')}`, request.url)
      );
    }
  }

  // 2. FLUX CLIENT / IMPLICIT FALLBACK (Pour les tokens renvoyés dans le hash fragment #access_token)
  // Les fragments hash ne sont pas visibles côté serveur HTTP, on retourne une page client légère pour les capturer
  const clientHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GetSpecial — Connexion en cours...</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #f8fafc;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255, 255, 255, 0.15);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 24px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 {
      margin: 0 0 8px 0;
      font-size: 1.25rem;
      font-weight: 600;
    }
    p {
      margin: 0;
      font-size: 0.95rem;
      color: #94a3b8;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <div class="spinner"></div>
  <h2>Connexion avec Google réussie</h2>
  <p>Finalisation de votre espace GetSpecial...</p>

  <script>
    (async function() {
      try {
        const supabaseUrl = "${supabaseUrl}";
        const supabaseAnonKey = "${supabaseAnonKey}";
        const client = supabase.createClient(supabaseUrl, supabaseAnonKey);

        const { data: { session }, error } = await client.auth.getSession();
        const user = session?.user;

        if (user) {
          const res = await fetch('/api/auth/sync-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
              avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              accessToken: session?.access_token || null
            })
          });

          const syncData = await res.json();
          if (syncData.success && syncData.user) {
            localStorage.setItem('getspecial_auth_user', JSON.stringify(syncData.user));
            if (syncData.user.restaurantId) {
              localStorage.setItem('getspecial_restaurant_id', syncData.user.restaurantId);
              localStorage.setItem('getspecial_onboarding_completed', 'true');
            }
            window.location.href = syncData.redirectUrl || '/dashboard';
            return;
          }
        }

        // Si aucun token trouvé après vérification
        setTimeout(() => {
          window.location.href = '/login?error=no_session';
        }, 1500);
      } catch (err) {
        console.error('Erreur callback client:', err);
        window.location.href = '/login?error=sync_failed';
      }
    })();
  </script>
</body>
</html>`;

  return new Response(clientHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
