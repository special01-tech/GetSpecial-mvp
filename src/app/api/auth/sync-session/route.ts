import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma.client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, email, name, avatarUrl } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email requis' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanId = id || `usr_${Date.now()}`;

    // Recherche de l'utilisateur existant par ID ou Email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { email: cleanEmail },
        ],
      },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          avatarUrl: avatarUrl || user.avatarUrl,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          id: cleanId,
          email: cleanEmail,
          name: name || cleanEmail.split('@')[0],
          avatarUrl: avatarUrl || null,
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

    // Poser les cookies de session
    response.cookies.set('getspecial_session', user.id, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      httpOnly: false,
    });

    if (restaurant) {
      response.cookies.set('getspecial_restaurant_id', restaurant.id, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
        httpOnly: false,
      });
    } else {
      response.cookies.set('getspecial_restaurant_id', '', {
        path: '/',
        maxAge: 0,
      });
    }

    return response;
  } catch (err: any) {
    console.error('[API /api/auth/sync-session Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
