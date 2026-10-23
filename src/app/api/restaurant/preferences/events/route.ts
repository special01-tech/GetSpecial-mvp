import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import {
  RestaurantEventPreferences,
  DEFAULT_EVENT_PREFERENCES,
} from '@/services/restaurant/event-preferences.types';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const EventPreferencesSchema = z.object({
  restaurantId: z.string().optional(),
  categories: z
    .object({
      sport: z.boolean().optional(),
      concert: z.boolean().optional(),
      arts: z.boolean().optional(),
      holiday: z.boolean().optional(),
      internal: z.boolean().optional(),
    })
    .optional(),
  radiusKm: z.number().min(1).max(50).optional(),
  excludedKeywords: z.array(z.string()).optional(),
});

/**
 * GET /api/restaurant/preferences/events
 * Récupère les préférences de captation d'événements du restaurant
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedRestId = searchParams.get('restaurantId') || req.headers.get('x-restaurant-id');

    let restaurant: any = null;
    if (requestedRestId) {
      try {
        restaurant = await (prisma as any).restaurant.findUnique({
          where: { id: requestedRestId },
          include: { profile: true },
        });
      } catch (err) {
        console.warn('[PREFERENCES_EVENTS] Erreur recherche restaurant par ID :', err);
      }
    }

    if (!restaurant) {
      restaurant = await (prisma as any).restaurant.findFirst({
        where: { status: 'active' },
        include: { profile: true },
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (!restaurant) {
      restaurant = await (prisma as any).restaurant.findFirst({
        include: { profile: true },
      });
    }

    if (!restaurant) {
      return error('Aucun restaurant trouvé', 404);
    }

    const customRules = (restaurant.profile?.customRules as Record<string, any>) || {};
    const storedPrefs = customRules.eventPreferences as Partial<RestaurantEventPreferences> | undefined;

    const effectivePrefs: RestaurantEventPreferences = {
      categories: {
        sport: storedPrefs?.categories?.sport ?? DEFAULT_EVENT_PREFERENCES.categories.sport,
        concert: storedPrefs?.categories?.concert ?? DEFAULT_EVENT_PREFERENCES.categories.concert,
        arts: storedPrefs?.categories?.arts ?? DEFAULT_EVENT_PREFERENCES.categories.arts,
        holiday: storedPrefs?.categories?.holiday ?? DEFAULT_EVENT_PREFERENCES.categories.holiday,
        internal: storedPrefs?.categories?.internal ?? DEFAULT_EVENT_PREFERENCES.categories.internal,
      },
      radiusKm: storedPrefs?.radiusKm ?? customRules.eventRadiusKm ?? DEFAULT_EVENT_PREFERENCES.radiusKm,
      excludedKeywords: storedPrefs?.excludedKeywords ?? DEFAULT_EVENT_PREFERENCES.excludedKeywords,
    };

    return success({
      restaurantId: restaurant.id,
      preferences: effectivePrefs,
    });
  } catch (err: any) {
    console.error('[PREFERENCES_EVENTS_GET_ERROR]:', err);
    return error(err.message || 'Erreur lors de la récupération des préférences', 500);
  }
}

/**
 * POST /api/restaurant/preferences/events
 * Met à jour les préférences de captation d'événements du restaurant
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = EventPreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues[0]?.message || 'Données invalides', 400);
    }

    const { restaurantId: requestedRestId, categories, radiusKm, excludedKeywords } = parsed.data;

    let restaurant: any = null;
    if (requestedRestId) {
      restaurant = await (prisma as any).restaurant.findUnique({
        where: { id: requestedRestId },
        include: { profile: true },
      });
    }

    if (!restaurant) {
      restaurant = await (prisma as any).restaurant.findFirst({
        where: { status: 'active' },
        include: { profile: true },
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (!restaurant) {
      restaurant = await (prisma as any).restaurant.findFirst({
        include: { profile: true },
      });
    }

    if (!restaurant) {
      return error('Aucun établissement trouvé pour appliquer les préférences', 404);
    }

    const currentProfile = restaurant.profile;
    const currentCustomRules = (currentProfile?.customRules as Record<string, any>) || {};
    const currentEventPrefs = (currentCustomRules.eventPreferences as Partial<RestaurantEventPreferences>) || {};

    const updatedPreferences: RestaurantEventPreferences = {
      categories: {
        sport: categories?.sport !== undefined ? categories.sport : (currentEventPrefs.categories?.sport ?? DEFAULT_EVENT_PREFERENCES.categories.sport),
        concert: categories?.concert !== undefined ? categories.concert : (currentEventPrefs.categories?.concert ?? DEFAULT_EVENT_PREFERENCES.categories.concert),
        arts: categories?.arts !== undefined ? categories.arts : (currentEventPrefs.categories?.arts ?? DEFAULT_EVENT_PREFERENCES.categories.arts),
        holiday: categories?.holiday !== undefined ? categories.holiday : (currentEventPrefs.categories?.holiday ?? DEFAULT_EVENT_PREFERENCES.categories.holiday),
        internal: categories?.internal !== undefined ? categories.internal : (currentEventPrefs.categories?.internal ?? DEFAULT_EVENT_PREFERENCES.categories.internal),
      },
      radiusKm: radiusKm !== undefined ? radiusKm : (currentEventPrefs.radiusKm ?? currentCustomRules.eventRadiusKm ?? DEFAULT_EVENT_PREFERENCES.radiusKm),
      excludedKeywords: excludedKeywords !== undefined ? excludedKeywords : (currentEventPrefs.excludedKeywords ?? DEFAULT_EVENT_PREFERENCES.excludedKeywords),
    };

    const newCustomRules = {
      ...currentCustomRules,
      eventPreferences: updatedPreferences,
      eventRadiusKm: updatedPreferences.radiusKm,
    };

    // Mise à jour ou création du profil
    await (prisma as any).restaurantProfile.upsert({
      where: { restaurantId: restaurant.id },
      update: {
        customRules: newCustomRules,
        updatedAt: new Date(),
      },
      create: {
        restaurantId: restaurant.id,
        customRules: newCustomRules,
      },
    });

    return success({
      restaurantId: restaurant.id,
      preferences: updatedPreferences,
      message: 'Préférences d’événements mises à jour avec succès',
    });
  } catch (err: any) {
    console.error('[PREFERENCES_EVENTS_POST_ERROR]:', err);
    return error(err.message || 'Erreur lors de la mise à jour des préférences', 500);
  }
}
