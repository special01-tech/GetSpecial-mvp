import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { geocodeAddress } from '@/server/lib/geocoding';
import { logAudit } from '@/server/lib/audit';
import { z } from 'zod';

const CreateRestaurantApiSchema = z.object({
  name: z.string().min(2),
  type: z.string(),
  address: z.string().min(5),
  userId: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const restaurants = await (prisma as any).restaurant.findMany({
      where: userId ? { userId } : {},
      include: {
        profile: true,
        offers: true,
        socialAccounts: true,
      },
    });

    return success(restaurants);
  } catch (err: any) {
    return error(err.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateRestaurantApiSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Données invalides', 400);
    }

    const { name, type, address, userId } = validated.data;

    // Géocodage automatique de l'adresse
    const geo = await geocodeAddress(address);

    const restaurant = await (prisma as any).restaurant.create({
      data: {
        name,
        type,
        address,
        latitude: geo.latitude,
        longitude: geo.longitude,
        userId,
        profile: {
          create: {
            tone: 'chaleureux',
            hasTerrace: false,
          },
        },
      },
      include: { profile: true },
    });

    await logAudit({
      restaurantId: restaurant.id,
      userId,
      action: 'restaurant.create',
      entityType: 'restaurant',
      entityId: restaurant.id,
      details: { name, type, address, latitude: geo.latitude, longitude: geo.longitude },
    });

    return success(restaurant, 201);
  } catch (err: any) {
    return error(err.message, 500);
  }
}
