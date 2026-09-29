import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireAuth } from '@/server/lib/auth';
import { geocodeAddress } from '@/server/lib/geocoding';
import { logAudit } from '@/server/lib/audit';
import { z } from 'zod';

const CreateRestaurantApiSchema = z.object({
  name: z.string().min(2),
  type: z.string(),
  address: z.string().min(5),
});

export async function GET() {
  try {
    const { dbUser } = await requireAuth();

    const restaurants = await prisma.restaurant.findMany({
      where: { userId: dbUser.id },
      include: {
        profile: true,
        offers: true,
        socialAccounts: true,
      },
    });

    return success(restaurants);
  } catch (err: any) {
    if (err.message === 'Non autorisé') return unauthorized();
    return error(err.message, 500);
  }
}

export async function POST(req: Request) {
  try {
    const { dbUser } = await requireAuth();
    const body = await req.json();
    const validated = CreateRestaurantApiSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Données invalides', 400);
    }

    const { name, type, address } = validated.data;

    // Géocodage automatique de l'adresse
    const geo = await geocodeAddress(address);

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        type,
        address,
        latitude: geo.latitude,
        longitude: geo.longitude,
        userId: dbUser.id,
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
      userId: dbUser.id,
      action: 'restaurant.create',
      entityType: 'restaurant',
      entityId: restaurant.id,
      details: { name, type, address, latitude: geo.latitude, longitude: geo.longitude },
    });

    return success(restaurant, 201);
  } catch (err: any) {
    if (err.message === 'Non autorisé') return unauthorized();
    return error(err.message, 500);
  }
}
