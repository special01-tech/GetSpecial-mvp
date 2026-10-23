import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { setAuthCookies, verifySupabaseAccessToken } from '@/server/lib/session';
import { checkRateLimit } from '@/server/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, 'auth:sync-session', 15, 5 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: `Trop de tentatives. Réessayez dans ${rate.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { id, email, name, avatarUrl, accessToken } = body;
    const authHeader = req.headers.get('authorization');
    const tokenToVerify = accessToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null);

    const isProd = process.env.NODE_ENV === 'production';

    // Vérification du token JWT Supabase si fourni (obligatoire en production)
    let verifiedSupabaseUser = null;
    if (tokenToVerify) {
      verifiedSupabaseUser = await verifySupabaseAccessToken(tokenToVerify);
      if (!verifiedSupabaseUser && isProd) {
        return NextResponse.json(
          { success: false, error: 'Jeton de session Supabase invalide ou expiré.' },
          { status: 401 }
        );
      }
    } else if (isProd) {
      return NextResponse.json(
        { success: false, error: 'Jeton d’authentification Supabase requis.' },
        { status: 401 }
      );
    }

    const resolvedEmail = verifiedSupabaseUser?.email || (email ? String(email).toLowerCase().trim() : '');
    if (!resolvedEmail) {
      return NextResponse.json({ success: false, error: 'Email requis' }, { status: 400 });
    }

    const cleanId = verifiedSupabaseUser?.id || id || `usr_${Date.now()}`;
    const resolvedName = verifiedSupabaseUser?.name || name || resolvedEmail.split('@')[0];
    const resolvedAvatar = verifiedSupabaseUser?.avatarUrl ?? avatarUrl ?? null;

    // Recherche de l'utilisateur existant par ID ou Email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { email: resolvedEmail },
        ],
      },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: resolvedName || user.name,
          avatarUrl: resolvedAvatar || user.avatarUrl,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          id: cleanId,
          email: resolvedEmail,
          name: resolvedName,
          avatarUrl: resolvedAvatar,
        },
      });
    }

    // Vérifier si un restaurant existe pour cet utilisateur
    const restaurant = await prisma.restaurant.findFirst({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
    });

    const redirectUrl = restaurant ? '/dashboard' : '/onboarding';

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        restaurantId: restaurant?.id || null,
        restaurantName: restaurant?.name || null,
      },
      hasRestaurant: Boolean(restaurant),
      redirectUrl,
    });

    // Poser les cookies de session signés HMAC + Supabase
    setAuthCookies(
      response,
      { id: user.id, email: user.email },
      {
        restaurantId: restaurant?.id || null,
        supabaseAccessToken: tokenToVerify || null,
      }
    );

    return response;
  } catch (err: any) {
    console.error('[API /api/auth/sync-session Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
