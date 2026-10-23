import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { resolveActiveRestaurant } from '@/server/lib/resolve-restaurant';
import { z } from 'zod';

const DishSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Le nom du plat est requis.'),
  category: z.string().optional().default('Plats'),
  price: z.string().optional().default(''),
  priceText: z.string().optional().default(''),
  description: z.string().optional().default(''),
  isSignature: z.boolean().optional().default(false),
  photoUrl: z.string().nullable().optional(),
});

const MenuMetadataSchema = z
  .object({
    sourceType: z.enum(['pdf', 'image']),
    name: z.string(),
    fileSize: z.string().optional(),
    uploadedAt: z.string(),
    detectedCategories: z.array(z.string()).optional(),
    extractedCount: z.number().optional(),
  })
  .nullable()
  .optional();

const PatchDishesSchema = z.object({
  dishes: z.array(DishSchema).optional(),
  rawSummary: z.string().nullable().optional(),
  menuMetadata: MenuMetadataSchema,
});

export const dynamic = 'force-dynamic';

/**
 * GET /api/restaurants/[id]/dishes
 * Récupère les plats extraits, le résumé culinaire et les métadonnées du menu actif.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    const restaurant = await resolveActiveRestaurant(req, restaurantId, { profile: true });

    if (!restaurant) {
      return error('Établissement introuvable.', 404);
    }

    const customRules = (restaurant.profile?.customRules as Record<string, any>) || {};
    const rawDishes = Array.isArray(customRules.dishes) ? customRules.dishes : [];

    // Normalisation rétrocompatible (price / priceText)
    const dishes = rawDishes.map((d: any, idx: number) => {
      const resolvedPrice = d.price || d.priceText || '';
      return {
        id: d.id || `dish_${idx + 1}`,
        name: d.name || '',
        category: d.category || 'Plats',
        price: resolvedPrice,
        priceText: resolvedPrice,
        description: d.description || '',
        isSignature: Boolean(d.isSignature),
        photoUrl: d.photoUrl || null,
      };
    });

    return success({
      restaurantId: restaurant.id,
      dishes,
      rawSummary: customRules.rawSummary || '',
      menuMetadata: customRules.menuMetadata || null,
    });
  } catch (err: any) {
    console.error('[RESTAURANT_DISHES_GET_ERROR]', err);
    return error('Impossible de récupérer la carte du restaurant.', 500);
  }
}

/**
 * PATCH /api/restaurants/[id]/dishes
 * Sauvegarde les plats extraits, le résumé culinaire et les métadonnées du menu
 * dans profile.customRules sans écraser les autres réglages.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    const body = await req.json();
    const validated = PatchDishesSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Données de carte invalides.', 400);
    }

    const restaurant = await resolveActiveRestaurant(req, restaurantId, { profile: true });
    if (!restaurant) {
      return error('Établissement introuvable.', 404);
    }

    const targetRestaurantId = restaurant.id;
    const existingRules = (restaurant.profile?.customRules as Record<string, any>) || {};
    const updatedRules: Record<string, any> = { ...existingRules };

    if (validated.data.dishes !== undefined) {
      updatedRules.dishes = validated.data.dishes.map((d, idx) => {
        const resolvedPrice = d.price || d.priceText || '';
        return {
          id: d.id || `dish_${Date.now()}_${idx + 1}`,
          name: d.name.trim(),
          category: (d.category || 'Plats').trim(),
          price: resolvedPrice,
          priceText: resolvedPrice,
          description: d.description || '',
          isSignature: Boolean(d.isSignature),
          photoUrl: d.photoUrl || null,
        };
      });
    }

    if (validated.data.rawSummary !== undefined) {
      updatedRules.rawSummary = validated.data.rawSummary || '';
    }

    if (validated.data.menuMetadata !== undefined) {
      updatedRules.menuMetadata = validated.data.menuMetadata;
    }

    await (prisma as any).restaurantProfile.upsert({
      where: { restaurantId: targetRestaurantId },
      update: { customRules: updatedRules },
      create: {
        restaurantId: targetRestaurantId,
        customRules: updatedRules,
      },
    });

    const savedCount = Array.isArray(updatedRules.dishes) ? updatedRules.dishes.length : 0;
    return success({
      restaurantId: targetRestaurantId,
      dishesCount: savedCount,
      dishes: updatedRules.dishes || [],
      rawSummary: updatedRules.rawSummary || '',
      menuMetadata: updatedRules.menuMetadata || null,
    });
  } catch (err: any) {
    console.error('[RESTAURANT_DISHES_PATCH_ERROR]', err);
    return error('Impossible de sauvegarder votre carte pour le moment.', 500);
  }
}
