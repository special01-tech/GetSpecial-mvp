import { prisma } from '@/server/db/prisma.client';

export async function getRestaurantHistory(restaurantId: string) {
  const [posts, publications, opportunities] = await Promise.all([
    (prisma.post as any).findMany({
      where: { restaurantId },
      include: { opportunity: true, publications: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
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
    posts,
    publications,
    opportunities,
  };
}
