import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireAuth, requireRestaurantOwnership } from '@/server/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    let whereClause: any = {};

    if (restaurantId) {
      await requireRestaurantOwnership(restaurantId);
      whereClause = { restaurantId };
    } else {
      const { dbUser } = await requireAuth();
      const userRestaurants = await prisma.restaurant.findMany({
        where: { userId: dbUser.id },
        select: { id: true },
      });
      const ids = userRestaurants.map((r) => r.id);
      whereClause = { restaurantId: { in: ids } };
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return success(logs);
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
