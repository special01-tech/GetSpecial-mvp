import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { resolveRequestUser } from '@/server/lib/session';
import { sanitizeRestaurant } from '@/server/lib/auth-guard';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await resolveRequestUser(req);
    const { searchParams } = new URL(req.url);
    const isLocalDev = process.env.NODE_ENV !== 'production' || process.env.USE_LOCAL_DB === 'true';

    const queryUserId = isLocalDev ? searchParams.get('userId') : null;
    const email = isLocalDev ? searchParams.get('email') : null;

    const targetUserId = sessionUser?.userId || queryUserId;
    const targetEmail = sessionUser?.email || email;

    if (!targetUserId && !targetEmail) {
      return unauthorized('Utilisateur non authentifié');
    }

    const user = await prisma.user.findUnique({
      where: targetUserId ? { id: targetUserId } : { email: targetEmail! },
    });

    if (!user) {
      return error('Utilisateur non trouvé', 404);
    }

    const restaurants = await prisma.restaurant.findMany({
      where: { userId: user.id },
      include: {
        profile: true,
        offers: true,
        socialAccounts: true,
      },
    });

    const safeRestaurants = restaurants.map(sanitizeRestaurant);

    return success({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      restaurants: safeRestaurants,
      hasRestaurant: safeRestaurants.length > 0,
      activeRestaurant: safeRestaurants[0] || null,
    });
  } catch (err: any) {
    return error(err.message, 500);
  }
}
