import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { geocodeAddress } from '@/server/lib/geocoding';
import { resolveRequestUser } from '@/server/lib/session';
import { sanitizeRestaurant } from '@/server/lib/auth-guard';
import { logAudit } from '@/server/lib/audit';
import { z } from 'zod';

const CreateRestaurantApiSchema = z.object({
  name: z.string().min(2),
  type: z.string(),
  address: z.string().min(3),
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
        name: z.string(),
        description: z.string().optional(),
        priceText: z.string().optional(),
        photoUrl: z.string().optional(),
      })
    )
    .optional(),
});

function deduceUsTimezone(lon: number): string {
  if (lon <= -114.5) return 'America/Los_Angeles';
  if (lon <= -102.0) return 'America/Denver';
  if (lon <= -85.5) return 'America/Chicago';
  return 'America/New_York';
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await resolveRequestUser(req);
    const { searchParams } = new URL(req.url);
    const isLocalDev = process.env.NODE_ENV !== 'production' || process.env.USE_LOCAL_DB === 'true';

    if (!sessionUser && !isLocalDev) {
      return unauthorized('Authentification requise');
    }

    const queryUserId = searchParams.get('userId');
    const effectiveUserId = !isLocalDev ? sessionUser?.userId : (queryUserId || undefined);

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
      return error(validated.error.issues[0]?.message ?? 'Invalid restaurant payload', 400);
    }

    const {
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
      country,
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
      socialAccounts = [],
      dishes = [],
    } = validated.data;

    let targetUserId = validated.data.userId;

    // Assurer qu'un utilisateur valide est lié
    if (!targetUserId || targetUserId === 'demo') {
      const cookieUserId = req.cookies.get('getspecial_session')?.value;
      if (cookieUserId) {
        const userInDb = await prisma.user.findUnique({ where: { id: cookieUserId } });
        if (userInDb) {
          targetUserId = userInDb.id;
        }
      }

      if (!targetUserId || targetUserId === 'demo') {
        const existingUser = await prisma.user.findFirst({ orderBy: { createdAt: 'desc' } });
        if (existingUser) {
          targetUserId = existingUser.id;
        } else {
          const newUser = await prisma.user.create({
            data: {
              email: 'owner@getspecial.dev',
              name: 'Restaurant Owner',
            },
          });
          targetUserId = newUser.id;
        }
      }
    }

    // Coordonnées géographiques et pays
    let lat = latitude;
    let lon = longitude;
    let detectedCountry = country;
    let detectedCity = city;

    if (lat === undefined || lon === undefined || !detectedCountry) {
      const geo = await geocodeAddress(address);
      if (lat === undefined) lat = geo.latitude;
      if (lon === undefined) lon = geo.longitude;
      if (!detectedCountry) detectedCountry = geo.countryCode;
      if (!detectedCity && geo.city) detectedCity = geo.city;
    }

    const calculatedTimezone = timezone || deduceUsTimezone(lon || 2.35);

    const restaurant = await (prisma as any).restaurant.create({
      data: {
        name,
        type,
        address,
        city: detectedCity || null,
        postalCode: postalCode || null,
        country: (detectedCountry || 'FR').toUpperCase(),
        phone: phone || null,
        website: website || null,
        googlePlaceId: googlePlaceId || null,
        latitude: lat || 48.8566,
        longitude: lon || 2.3522,
        timezone: calculatedTimezone,
        openingHours: openingHours || null,
        specialties, // Pas de spécialités factices injectées
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
            offPeakDays,
            constraints,
            targetAudience,
            marketingGoal,
            logoUrl: logoUrl || null,
            photos,
            brandColors,
            menuUrl: menuUrl || null,
            maxPostsPerDay,
            autoApprove,
            customRules: {
              dishes,
            },
          },
        },
        ...(currentOffer ? {
          offers: {
            create: {
              title: currentOffer,
              description: `Offre active : ${currentOffer}`,
              status: 'active',
            },
          },
        } : {}),
        ...(socialAccounts.length > 0 ? {
          socialAccounts: {
            create: socialAccounts.map((sa) => ({
              platform: sa.platform,
              username: sa.username || `@${sa.platform}_restaurant`,
              outstandAccountId: sa.outstandAccountId || `acc_${sa.platform}_${Date.now()}`,
              status: sa.status || 'connected',
              lastSyncAt: new Date(),
            })),
          },
        } : {}),
      },
      include: { profile: true, offers: true, socialAccounts: true },
    });

    await logAudit({
      restaurantId: restaurant.id,
      userId: targetUserId,
      action: 'restaurant.create',
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
    return error(err.message, 500);
  }
}
