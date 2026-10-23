import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { geocodeAddress, deduceTimezone } from '@/server/lib/geocoding';
import { resolveRequestUser } from '@/server/lib/session';
import { sanitizeRestaurant } from '@/server/lib/auth-guard';
import { logAudit } from '@/server/lib/audit';
import { z } from 'zod';

const ORDERED_DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/**
 * Normalise des horaires quelconques vers le format standard 7 jours de GetSpecial
 */
function normalizeOpeningHoursToSchedule(raw: any) {
  if (Array.isArray(raw) && raw.length === 7 && raw[0]?.day) {
    return raw;
  }

  // Format objet hérité { week: "...", weekend: "..." }
  if (raw && typeof raw === 'object' && (raw.week || raw.weekend)) {
    const weekSlot = raw.week || '11:30 - 14:30 • 18:30 - 22:30';
    const weekendSlot = raw.weekend || '12:00 - 23:00';
    return ORDERED_DAYS_FR.map((day) => {
      const isWeekend = day === 'Samedi' || day === 'Dimanche';
      const slot = isWeekend ? weekendSlot : weekSlot;
      return {
        day,
        isOpen: true,
        lunch: slot.includes('•') ? slot.split('•')[0].trim() : slot,
        dinner: slot.includes('•') ? slot.split('•')[1].trim() : '',
      };
    });
  }

  // Tableau simple extrait d'Apify [{ day: "Lundi", hours: "12:00–14:30, 19:00–22:30" }]
  if (Array.isArray(raw) && raw.length > 0) {
    return ORDERED_DAYS_FR.map((dayName) => {
      const match = raw.find((item: any) =>
        String(item.day || '').toLowerCase().startsWith(dayName.toLowerCase().slice(0, 3))
      );
      if (!match) {
        return { day: dayName, isOpen: true, lunch: '12:00 - 14:30', dinner: '19:00 - 22:30' };
      }
      const text = String(match.hours || '').toLowerCase();
      if (text.includes('ferm') || text.includes('close')) {
        return { day: dayName, isOpen: false, lunch: '', dinner: '' };
      }
      const slots = match.hours.split(/[,•;]/);
      return {
        day: dayName,
        isOpen: true,
        lunch: slots[0]?.trim() || '12:00 - 14:30',
        dinner: slots[1]?.trim() || '',
      };
    });
  }

  // Horaires par défaut standards
  return ORDERED_DAYS_FR.map((day) => ({
    day,
    isOpen: day !== 'Lundi',
    lunch: day === 'Lundi' ? '' : '12:00 - 14:30',
    dinner: day === 'Lundi' ? '' : '19:00 - 22:30',
  }));
}

const CreateRestaurantApiSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Le nom de l’établissement est requis.'),
  type: z.string(),
  address: z.string().min(2, 'L’adresse est requise.'),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  googlePlaceId: z.string().optional(),
  userId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().optional(),
  country: z.string().optional(),
  openingHours: z.any().optional(),
  specialties: z.array(z.string()).optional(),
  tone: z.string().optional(),
  hasTerrace: z.boolean().optional(),
  hasDelivery: z.boolean().optional(),
  capacityCovers: z.number().optional(),
  averageTicket: z.number().optional(),
  currency: z.string().optional(),
  baselineCovers: z.number().optional(),
  foodCostPct: z.number().optional(),
  drinkCostPct: z.number().optional(),
  maxDiscountPct: z.number().optional(),
  offPeakDays: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
  marketingGoal: z.string().optional(),
  logoUrl: z.string().optional(),
  photos: z.array(z.string()).optional(),
  brandColors: z.array(z.string()).optional(),
  menuUrl: z.string().optional(),
  maxPostsPerDay: z.number().optional(),
  autoApprove: z.boolean().optional(),
  currentOffer: z.string().optional(),
  rawSummary: z.string().nullable().optional(),
  menuMetadata: z.any().optional(),
  socialAccounts: z
    .array(
      z.object({
        platform: z.string(),
        username: z.string().optional(),
        outstandAccountId: z.string().optional(),
        accessToken: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .optional(),
  dishes: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        category: z.string().optional(),
        price: z.string().optional(),
        priceText: z.string().optional(),
        description: z.string().optional(),
        isSignature: z.boolean().optional(),
        photoUrl: z.string().nullable().optional(),
      })
    )
    .optional(),
  extractedOffers: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        discount: z.string().optional(),
        period: z.string().optional(),
        platforms: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await resolveRequestUser(req);
    const { searchParams } = new URL(req.url);
    const isLocalDev = process.env.NODE_ENV !== 'production' || process.env.USE_LOCAL_DB === 'true';

    if (!sessionUser && !isLocalDev) {
      return unauthorized('Authentification requise');
    }

    const queryUserId = searchParams.get('userId');
    const effectiveUserId = !isLocalDev ? sessionUser?.userId : (queryUserId || sessionUser?.userId || undefined);

    const restaurants = await (prisma as any).restaurant.findMany({
      where: effectiveUserId ? { userId: effectiveUserId } : {},
      include: {
        profile: true,
        offers: true,
        socialAccounts: true,
      },
    });

    return success(restaurants.map(sanitizeRestaurant));
  } catch (err: any) {
    return error(err.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateRestaurantApiSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Informations établissement invalides', 400);
    }

    const sessionUser = await resolveRequestUser(req);
    const isLocalDev = process.env.NODE_ENV !== 'production' || process.env.USE_LOCAL_DB === 'true';

    // Résolution stricte de l'utilisateur : session d'abord, puis cookie/userId explicite en dev
    let targetUserId = sessionUser?.userId || validated.data.userId;

    if (!targetUserId) {
      const cookieUserId = req.cookies.get('getspecial_session')?.value;
      if (cookieUserId) {
        const userInDb = await prisma.user.findUnique({ where: { id: cookieUserId } });
        if (userInDb) {
          targetUserId = userInDb.id;
        }
      }
    }

    if (!targetUserId && !isLocalDev) {
      return unauthorized('Vous devez être connecté pour configurer un établissement.');
    }

    // En local dev pur sans utilisateur en base, créer l'utilisateur de dev
    if (!targetUserId && isLocalDev) {
      const existing = await prisma.user.findFirst({ orderBy: { createdAt: 'desc' } });
      if (existing) {
        targetUserId = existing.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: 'dev@getspecial.local',
            name: 'Gérant GetSpecial',
          },
        });
        targetUserId = newUser.id;
      }
    }

    const {
      id: explicitId,
      name,
      type,
      address,
      city,
      postalCode,
      phone,
      website,
      googlePlaceId,
      latitude,
      longitude,
      timezone,
      country = 'FR',
      openingHours,
      specialties = [],
      tone = 'chaleureux',
      hasTerrace = false,
      hasDelivery = false,
      capacityCovers,
      averageTicket,
      currency = 'EUR',
      baselineCovers = 15,
      foodCostPct,
      drinkCostPct,
      maxDiscountPct,
      offPeakDays = [],
      constraints = [],
      targetAudience = [],
      marketingGoal = 'more_clients',
      logoUrl,
      photos = [],
      brandColors = [],
      menuUrl,
      maxPostsPerDay = 1,
      autoApprove = false,
      currentOffer,
      rawSummary,
      menuMetadata,
      socialAccounts = [],
      dishes = [],
      extractedOffers = [],
    } = validated.data;

    // Normalisation du pays et de la géolocalisation
    const cleanCountry = country.toUpperCase().trim();
    let lat = latitude;
    let lon = longitude;
    let detectedCity = city?.trim();
    let detectedPostal = postalCode?.trim();

    if (lat === undefined || lon === undefined || !detectedCity) {
      try {
        const geo = await geocodeAddress(`${address}, ${city || ''}`, cleanCountry);
        if (lat === undefined) lat = geo.latitude;
        if (lon === undefined) lon = geo.longitude;
        if (!detectedCity && geo.city) detectedCity = geo.city;
        if (!detectedPostal && geo.postalCode) detectedPostal = geo.postalCode;
      } catch (err) {
        console.warn('[RESTAURANTS_POST_GEOCODE_FALLBACK]', err);
      }
    }

    // Fuseau horaire déduit intelligemment du pays si non fourni
    const calculatedTimezone = timezone?.trim() || deduceTimezone(cleanCountry, lon ?? 2.35);

    // Normalisation des horaires au standard 7 jours de GetSpecial
    const structuredOpeningHours = normalizeOpeningHoursToSchedule(openingHours);

    // Normalisation des jours creux (minuscules) + configuration pour Mon Resto
    const normalizedOffPeakDays = (offPeakDays || []).map((d) => d.toLowerCase().trim());
    const offPeakSlotsConfig =
      normalizedOffPeakDays.length > 0
        ? [
            {
              id: 'slot_onboarding',
              label: 'Jours calmes habituels',
              days: normalizedOffPeakDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', '),
              startTime: '15:00',
              endTime: '19:00',
            },
          ]
        : [];

    // Normalisation complète des plats de la carte
    const formattedDishes = dishes.map((d, idx) => {
      const priceVal = d.price || d.priceText || '';
      return {
        id: d.id || `dish_${Date.now()}_${idx + 1}`,
        name: d.name.trim(),
        category: (d.category || 'Plats').trim(),
        price: priceVal,
        priceText: priceVal,
        description: d.description || '',
        isSignature: Boolean(d.isSignature),
        photoUrl: d.photoUrl || null,
      };
    });

    // Recherche d'un restaurant existant appartenant à cet utilisateur (pour éviter les doublons lors de l'onboarding)
    let existingRestaurant: any = null;
    if (explicitId && explicitId !== 'current' && explicitId !== 'default') {
      existingRestaurant = await (prisma as any).restaurant.findUnique({
        where: { id: explicitId },
        include: { profile: true },
      });
    }

    if (!existingRestaurant && targetUserId) {
      existingRestaurant = await (prisma as any).restaurant.findFirst({
        where: { userId: targetUserId, status: 'active' },
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      });
    }

    let restaurant: any = null;

    if (existingRestaurant) {
      // 1. MISE À JOUR ATOMIQUE DU RESTAURANT EXISTANT
      const existingCustomRules = (existingRestaurant.profile?.customRules as Record<string, any>) || {};
      const mergedCustomRules = {
        ...existingCustomRules,
        dishes: formattedDishes.length > 0 ? formattedDishes : existingCustomRules.dishes || [],
        rawSummary: rawSummary !== undefined ? rawSummary : existingCustomRules.rawSummary || null,
        menuMetadata: menuMetadata !== undefined ? menuMetadata : existingCustomRules.menuMetadata || null,
        hasOffPeak: normalizedOffPeakDays.length > 0 || Boolean(existingCustomRules.hasOffPeak),
        offPeakSlots: offPeakSlotsConfig.length > 0 ? offPeakSlotsConfig : existingCustomRules.offPeakSlots || [],
      };

      await (prisma as any).restaurant.update({
        where: { id: existingRestaurant.id },
        data: {
          name,
          type,
          address,
          city: detectedCity || null,
          postalCode: detectedPostal || null,
          country: cleanCountry,
          phone: phone || null,
          website: website || null,
          googlePlaceId: googlePlaceId || null,
          latitude: lat ?? 48.8566,
          longitude: lon ?? 2.3522,
          timezone: calculatedTimezone,
          openingHours: structuredOpeningHours,
          specialties,
        },
      });

      await (prisma as any).restaurantProfile.upsert({
        where: { restaurantId: existingRestaurant.id },
        update: {
          tone,
          hasTerrace,
          hasDelivery,
          capacityCovers: capacityCovers || null,
          averageTicket: averageTicket || null,
          currency,
          baselineCovers: baselineCovers || 15,
          foodCostPct: foodCostPct || null,
          drinkCostPct: drinkCostPct || null,
          maxDiscountPct: maxDiscountPct || null,
          offPeakDays: normalizedOffPeakDays,
          constraints,
          targetAudience,
          marketingGoal,
          logoUrl: logoUrl || null,
          photos,
          brandColors,
          menuUrl: menuUrl || null,
          maxPostsPerDay,
          autoApprove,
          customRules: mergedCustomRules,
        },
        create: {
          restaurantId: existingRestaurant.id,
          tone,
          hasTerrace,
          hasDelivery,
          capacityCovers: capacityCovers || null,
          averageTicket: averageTicket || null,
          currency,
          baselineCovers: baselineCovers || 15,
          offPeakDays: normalizedOffPeakDays,
          constraints,
          targetAudience,
          marketingGoal,
          logoUrl: logoUrl || null,
          photos,
          brandColors,
          menuUrl: menuUrl || null,
          maxPostsPerDay,
          autoApprove,
          customRules: mergedCustomRules,
        },
      });

      restaurant = await (prisma as any).restaurant.findUnique({
        where: { id: existingRestaurant.id },
        include: { profile: true, offers: true, socialAccounts: true },
      });
    } else {
      // 2. CRÉATION D'UN NOUVEAU RESTAURANT
      const customRulesData = {
        dishes: formattedDishes,
        rawSummary: rawSummary || null,
        menuMetadata: menuMetadata || null,
        hasOffPeak: normalizedOffPeakDays.length > 0,
        offPeakSlots: offPeakSlotsConfig,
      };

      restaurant = await (prisma as any).restaurant.create({
        data: {
          name,
          type,
          address,
          city: detectedCity || null,
          postalCode: detectedPostal || null,
          country: cleanCountry,
          phone: phone || null,
          website: website || null,
          googlePlaceId: googlePlaceId || null,
          latitude: lat ?? 48.8566,
          longitude: lon ?? 2.3522,
          timezone: calculatedTimezone,
          openingHours: structuredOpeningHours,
          specialties,
          userId: targetUserId,
          profile: {
            create: {
              tone,
              hasTerrace,
              hasDelivery,
              capacityCovers: capacityCovers || null,
              averageTicket: averageTicket || null,
              currency,
              baselineCovers: baselineCovers || 15,
              foodCostPct: foodCostPct || null,
              drinkCostPct: drinkCostPct || null,
              maxDiscountPct: maxDiscountPct || null,
              offPeakDays: normalizedOffPeakDays,
              constraints,
              targetAudience,
              marketingGoal,
              logoUrl: logoUrl || null,
              photos,
              brandColors,
              menuUrl: menuUrl || null,
              maxPostsPerDay,
              autoApprove,
              customRules: customRulesData,
            },
          },
          ...(currentOffer
            ? {
                offers: {
                  create: {
                    title: currentOffer,
                    description: `Offre active : ${currentOffer}`,
                    status: 'active',
                  },
                },
              }
            : {}),
          ...(socialAccounts.length > 0
            ? {
                socialAccounts: {
                  create: socialAccounts.map((sa) => ({
                    platform: sa.platform,
                    username: sa.username || `@${sa.platform}_restaurant`,
                    outstandAccountId: sa.outstandAccountId || `acc_${sa.platform}_${Date.now()}`,
                    accessToken: sa.accessToken || null,
                    status: sa.status || 'connected',
                    lastSyncAt: new Date(),
                  })),
                },
              }
            : {}),
        },
        include: { profile: true, offers: true, socialAccounts: true },
      });
    }

    // Création réelle en base des offres détectées par l'IA lors de l'onboarding
    if (Array.isArray(extractedOffers) && extractedOffers.length > 0 && restaurant) {
      for (const off of extractedOffers) {
        if (!off.name) continue;
        const encodedDays = (off.platforms || ['instagram', 'facebook']).map((p) => `platform:${p}`);
        await (prisma as any).offer.create({
          data: {
            restaurantId: restaurant.id,
            title: off.name,
            description: off.description || `Offre du menu : ${off.name}`,
            discountValue: off.discount || null,
            recurrence: off.period || 'Toute la semaine',
            recurrenceDays: encodedDays,
            status: 'active',
          },
        }).catch((e: any) => console.warn('[ONBOARDING_OFFER_CREATE_ERR]', e));
      }
    }

    await logAudit({
      restaurantId: restaurant.id,
      userId: targetUserId,
      action: existingRestaurant ? 'restaurant.update_onboarding' : 'restaurant.create',
      entityType: 'restaurant',
      entityId: restaurant.id,
      details: {
        name,
        type,
        address,
        latitude: lat,
        longitude: lon,
        timezone: calculatedTimezone,
      },
    });

    const res = success(sanitizeRestaurant(restaurant), 201);
    res.cookies.set('getspecial_restaurant_id', restaurant.id, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });
    return res;
  } catch (err: any) {
    console.error('[RESTAURANTS_POST_ERROR]', err);
    return error(err.message || 'Impossible de sauvegarder l’établissement', 500);
  }
}
