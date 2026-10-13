import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get('userId');
    const email = searchParams.get('email');
    const cookieUserId = req.cookies.get('getspecial_session')?.value;

    const targetUserId = queryUserId || cookieUserId;

    if (!targetUserId && !email) {
      return unauthorized('Utilisateur non authentifié');
    }

    const user = await prisma.user.findUnique({
      where: targetUserId ? { id: targetUserId } : { email: email! },
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

    return success({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      restaurants,
      hasRestaurant: restaurants.length > 0,
      activeRestaurant: restaurants[0] || null,
    });
  } catch (err: any) {
    return error(err.message, 500);
  }
}
