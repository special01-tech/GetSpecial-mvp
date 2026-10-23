import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { sanitizeSocialAccount, verifyRestaurantOwnership } from '@/server/lib/auth-guard';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return error('restaurantId requis', 400);
    }

    const access = await verifyRestaurantOwnership(req, restaurantId, { allowFallbackInDev: true });
    if (!access.allowed) {
      return error(access.error || 'Accès refusé', access.status);
    }

    const accounts = await (prisma as any).socialAccount.findMany({
      where: { restaurantId },
    });

    return success(accounts.map(sanitizeSocialAccount));
  } catch (err: any) {
    return error(err.message, 500);
  }
}
