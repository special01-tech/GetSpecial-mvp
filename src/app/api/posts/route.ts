import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { resolveActiveRestaurant } from '@/server/lib/resolve-restaurant';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedId = searchParams.get('restaurantId');

    const restaurant = await resolveActiveRestaurant(req, requestedId, { profile: false });
    if (!restaurant) {
      return error('Restaurant non trouvé ou non autorisé', 404);
    }

    const posts = await (prisma as any).post.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' },
    });

    return success(posts);
  } catch (err: any) {
    return error(err.message, 500);
  }
}

