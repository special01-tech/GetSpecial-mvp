import { prisma } from '@/server/db/prisma.client';

export interface UpdateProfileParams {
  restaurantId: string;
  capacityCovers?: number;
  averageTicket?: number;
  foodCostPct?: number;
  drinkCostPct?: number;
  offPeakDays?: string[];
  constraints?: string[];
}

export async function getRestaurantBySlug(slug: string) {
  return (prisma.restaurant as any).findFirst({
    where: { status: 'active' },
    include: {
      profile: true,
      offers: true,
    },
  });
}

export async function updateRestaurantProfile(params: UpdateProfileParams) {
  const { restaurantId, ...data } = params;
  return (prisma.restaurantProfile as any).update({
    where: { restaurantId },
    data,
  });
}
