import { prisma } from '@/server/db/prisma.client';

export async function getRestaurantHistory(restaurantId: string) {
  const [publications, opportunities] = await Promise.all([
    (prisma.publication as any).findMany({
      where: { restaurantId },
      include: { post: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    (prisma.opportunity as any).findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return {
    publications,
    opportunities,
  };
}
