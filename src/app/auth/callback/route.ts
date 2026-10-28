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

  // 1. FLUX PKCE (Code présent dans l'URL côté serveur)
  if (code) {
    try {
      const { user: authUser, session: authSession, error: exchangeError } = await exchangeSupabaseCode(
        supabaseUrl,
        supabaseAnonKey,
        code
      );

      if (!exchangeError && authUser) {
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

        // Upsert dans la table users (PostgreSQL ou Local Fallback)
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
      }
      // Si l'échange serveur échoue (ex: restrictions réseau serveur), on laisse le client s'en charger ci-dessous
      console.warn('[Supabase Auth Callback]: Échange serveur non concluant, bascule sur le client HTML.');
    } catch (err: any) {
      console.warn('[Supabase Auth Callback Exception]:', err?.message);
    }
  }

  // 2. FLUX CLIENT / IMPLICIT FALLBACK (Tokens dans le fragment hash #access_token ou query params)
  const clientHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GetSpecial — Connexion Google</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #090d16;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #f8fafc;
    }
    .card {
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 36px 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 3px solid rgba(255, 255, 255, 0.12);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 {
      margin: 0 0 8px 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: #f1f5f9;
    }
    p {
      margin: 0;
      font-size: 0.9rem;
      color: #94a3b8;
      line-height: 1.4;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>Authentification Google</h2>
    <p id="status-text">Finalisation de votre session GetSpecial...</p>
  </div>

  <script>
    (async function() {
      const statusText = document.getElementById('status-text');

      function updateStatus(msg) {
        if (statusText) statusText.textContent = msg;
      }

      function parseJwt(token) {
        try {
          var base64Url = token.split('.')[1];
          if (!base64Url) return null;
          var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          var jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join('')
          );
          return JSON.parse(jsonPayload);
        } catch (e) {
          return null;
        }
      }

      try {
        var rawHash = window.location.hash ? window.location.hash.replace(/^#/, '') : '';
        var rawSearch = window.location.search ? window.location.search.replace(/^\\?/, '') : '';
        var hashParams = new URLSearchParams(rawHash);
        var searchParams = new URLSearchParams(rawSearch);

        // 1. Détection d'erreur retournée par Google / Supabase
        var authError =
          hashParams.get('error_description') ||
          hashParams.get('error') ||
          searchParams.get('error_description') ||
          searchParams.get('error');

        if (authError) {
          console.error('[Google OAuth Error]:', authError);
          window.location.href = '/login?error=' + encodeURIComponent(authError);
          return;
        }

        // 2. Récupération des jetons et du code
        var accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        var refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        var code = searchParams.get('code') || hashParams.get('code');

        var user = null;

        // 3. Décodage immédiat si access_token présent (flux OAuth implicite)
        if (accessToken) {
          var payload = parseJwt(accessToken);
          if (payload && (payload.sub || payload.email)) {
            user = {
              id: payload.sub || payload.id,
              email: (payload.email || '').toLowerCase().trim(),
              name: (payload.user_metadata && (payload.user_metadata.full_name || payload.user_metadata.name || payload.user_metadata.given_name)) || (payload.email ? payload.email.split('@')[0] : 'Restaurateur'),
              avatarUrl: (payload.user_metadata && (payload.user_metadata.avatar_url || payload.user_metadata.picture)) || null
            };
          }
        }

        // 4. Initialisation Supabase Client pour échanger un éventuel code ou hydrater la session
        var supabaseUrl = "${supabaseUrl}";
        var supabaseAnonKey = "${supabaseAnonKey}";

        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
          try {
            var client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

            if (code && !accessToken) {
              updateStatus('Validation du code d’accès Google...');
              var exchangeRes = await client.auth.exchangeCodeForSession(code);
              if (exchangeRes.data && exchangeRes.data.session) {
                accessToken = exchangeRes.data.session.access_token;
                refreshToken = exchangeRes.data.session.refresh_token;
                var u = exchangeRes.data.session.user;
                if (u) {
                  user = {
                    id: u.id,
                    email: (u.email || '').toLowerCase().trim(),
                    name: (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || (u.email ? u.email.split('@')[0] : 'Restaurateur'),
                    avatarUrl: (u.user_metadata && (u.user_metadata.avatar_url || u.user_metadata.picture)) || null
                  };
                }
              }
            } else if (accessToken && refreshToken) {
              client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).catch(function() {});
            }

            if (!user) {
              var sessRes = await client.auth.getSession();
              if (sessRes.data && sessRes.data.session && sessRes.data.session.user) {
                var sess = sessRes.data.session;
                accessToken = sess.access_token;
                var su = sess.user;
                user = {
                  id: su.id,
                  email: (su.email || '').toLowerCase().trim(),
                  name: (su.user_metadata && (su.user_metadata.full_name || su.user_metadata.name)) || (su.email ? su.email.split('@')[0] : 'Restaurateur'),
                  avatarUrl: (su.user_metadata && (su.user_metadata.avatar_url || su.user_metadata.picture)) || null
                };
              }
            }
          } catch (supErr) {
            console.warn('[Supabase Client JS]:', supErr);
          }
        }

        // 5. Synchronisation de la session avec le backend GetSpecial
        if (user && (user.id || user.email)) {
          updateStatus('Connexion réussie ! Chargement de votre espace...');

          var syncRes = await fetch('/api/auth/sync-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(accessToken ? { 'Authorization': 'Bearer ' + accessToken } : {})
            },
            body: JSON.stringify({
              id: user.id,
              email: user.email,
              name: user.name,
              avatarUrl: user.avatarUrl,
              accessToken: accessToken || null
            })
          });

          var syncData = await syncRes.json();
          if (syncData.success && syncData.user) {
            localStorage.setItem('getspecial_auth_user', JSON.stringify(syncData.user));
            if (syncData.user.restaurantId) {
              localStorage.setItem('getspecial_restaurant_id', syncData.user.restaurantId);
              localStorage.setItem('getspecial_onboarding_completed', 'true');
              if (syncData.user.restaurantName) {
                localStorage.setItem(
                  'getspecial_selected_restaurant',
                  JSON.stringify({ id: syncData.user.restaurantId, name: syncData.user.restaurantName })
                );
              }
            }
            document.cookie = 'getspecial_session=' + syncData.user.id + '; path=/; max-age=2592000; SameSite=Lax';

            window.location.href = syncData.redirectUrl || '/dashboard';
            return;
          } else {
            window.location.href = '/login?error=' + encodeURIComponent(syncData.error || 'Erreur de synchronisation');
            return;
          }
        }

        // 6. Aucun token trouvé après vérification
        setTimeout(function() {
          window.location.href = '/login?error=no_session';
        }, 1000);

      } catch (err) {
        console.error('Erreur callback client:', err);
        window.location.href = '/login?error=' + encodeURIComponent(err?.message || 'sync_failed');
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
