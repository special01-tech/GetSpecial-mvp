import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { z } from 'zod';

const DishSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  priceText: z.string().optional().default(''),
  photoUrl: z.string().optional(),
});

const PatchDishesSchema = z.object({
  dishes: z.array(DishSchema).min(1),
});

export const dynamic = 'force-dynamic';

/**
 * GET /api/restaurants/[id]/dishes
 * Récupère les plats extraits ou configurés du restaurant.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    if (!restaurantId) {
      return error('ID restaurant manquant.', 400);
    }

    let restaurant = null;
    if (restaurantId && restaurantId !== 'current' && restaurantId !== 'default') {
      restaurant = await (prisma as any).restaurant.findUnique({
        where: { id: restaurantId },
        include: { profile: true },
      });
    }

    if (!restaurant) {
      restaurant = await (prisma as any).restaurant.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      });
    }

    if (!restaurant) {
      return error('Restaurant introuvable.', 404);
    }

    const customRules = (restaurant.profile?.customRules as any) || {};
    const dishes = Array.isArray(customRules.dishes) ? customRules.dishes : [];

    return success({
      restaurantId: restaurant.id,
      dishes,
    });
  } catch (err: any) {
    return error(err.message, 500);
  }
}

/**
 * PATCH /api/restaurants/[id]/dishes
 * Sauvegarde les plats extraits du menu IA dans le profil du restaurant.
 * Les dishes sont stockés dans profile.customRules.dishes (JSON).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    if (!restaurantId) {
      return error('ID restaurant manquant.', 400);
    }

    const body = await req.json();
    const validated = PatchDishesSchema.safeParse(body);
    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Payload invalide', 400);
    }

    const { dishes } = validated.data;

    // Vérifier que le restaurant existe (avec support pour 'current' et fallback vers le restaurant actif)
    let restaurant = null;
    if (restaurantId && restaurantId !== 'current' && restaurantId !== 'default') {
      restaurant = await (prisma as any).restaurant.findUnique({
        where: { id: restaurantId },
        include: { profile: true },
      });
    }

    if (!restaurant) {
      restaurant = await (prisma as any).restaurant.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      });
    }

    if (!restaurant) {
      return error(`Restaurant introuvable (id: ${restaurantId}).`, 404);
    }

    const targetRestaurantId = restaurant.id;

    // Mettre à jour ou créer le profil avec les dishes dans customRules
    const existingRules = (restaurant.profile?.customRules as any) || {};
    const updatedRules = {
      ...existingRules,
      dishes: dishes.map((d) => ({
        name: d.name,
        description: d.description || '',
        priceText: d.priceText || '',
        photoUrl: d.photoUrl || null,
      })),
    };

    if (restaurant.profile) {
      await (prisma as any).restaurantProfile.update({
        where: { restaurantId: targetRestaurantId },
        data: { customRules: updatedRules },
      });
    } else {
      await (prisma as any).restaurantProfile.create({
        data: {
          restaurantId: targetRestaurantId,
          customRules: updatedRules,
        },
      });
    }

    return success({
      restaurantId: targetRestaurantId,
      dishesCount: dishes.length,
      message: `${dishes.length} plat(s) sauvegardé(s) avec succès.`,
    });
  } catch (err: any) {
    console.error('[RESTAURANT_DISHES_PATCH_ERROR]', err);
    return error(`Erreur lors de la sauvegarde des plats : ${err.message}`, 500);
  }
}
