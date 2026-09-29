import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireRestaurantOwnership } from '@/server/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return error('restaurantId requis', 400);
    }

    await requireRestaurantOwnership(restaurantId);

    const accounts = await prisma.socialAccount.findMany({
      where: { restaurantId },
    });

    return success(accounts);
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
