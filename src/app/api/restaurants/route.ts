import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { geocodeAddress } from '@/server/lib/geocoding';
import { logAudit } from '@/server/lib/audit';
import { z } from 'zod';

const CreateRestaurantApiSchema = z.object({
  name: z.string().min(2),
  type: z.string(),
  address: z.string().min(3),
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
  offPeakDays: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
  marketingGoal: z.string().optional(),
  logoUrl: z.string().optional(),
  photos: z.array(z.string()).optional(),
  brandColors: z.array(z.string()).optional(),
  menuUrl: z.string().optional(),
  currentOffer: z.string().optional(),
});

function deduceUsTimezone(lon: number): string {
  if (lon <= -114.5) return 'America/Los_Angeles';
  if (lon <= -102.0) return 'America/Denver';
  if (lon <= -85.5) return 'America/Chicago';
  return 'America/New_York';
}

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
      return error(validated.error.issues[0]?.message ?? 'Invalid restaurant payload', 400);
    }

    const {
      name,
      type,
      address,
      latitude,
      longitude,
      timezone,
      country,
      openingHours,
      specialties = [],
      tone = 'friendly',
      hasTerrace = true,
      hasDelivery = false,
      offPeakDays = [],
      constraints = [],
      targetAudience = [],
      marketingGoal = 'more_clients',
      logoUrl,
      photos = [],
      brandColors = [],
      menuUrl,
      currentOffer,
    } = validated.data;

    let targetUserId = validated.data.userId;

    // Assurer qu'un utilisateur valide est lié
    if (!targetUserId || targetUserId === 'demo') {
      const existingUser = await prisma.user.findFirst();
      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        const newUser = await (prisma.user as any).create({
          data: {
            email: 'owner@brasspelican.com',
            name: 'Restaurant Owner',
            passwordHash: '$2a$12$demo1234567890abcdefghijklm',
          },
        });
        targetUserId = newUser.id;
      }
    }

    // Coordonnées géographiques et pays
    let lat = latitude;
    let lon = longitude;
    let detectedCountry = country;

    if (lat === undefined || lon === undefined || !detectedCountry) {
      const geo = await geocodeAddress(address);
      if (lat === undefined) lat = geo.latitude;
      if (lon === undefined) lon = geo.longitude;
      if (!detectedCountry) detectedCountry = geo.countryCode;
    }

    const calculatedTimezone = timezone || deduceUsTimezone(lon);

    const restaurant = await (prisma as any).restaurant.create({
      data: {
        name,
        type,
        address,
        latitude: lat,
        longitude: lon,
        timezone: calculatedTimezone,
        country: (detectedCountry || 'US').toUpperCase(),
        openingHours: openingHours || null,
        specialties,
        userId: targetUserId,
        profile: {
          create: {
            tone,
            hasTerrace,
            offPeakDays,
            constraints,
            customRules: {
              hasDelivery,
              targetAudience,
              marketingGoal,
              logoUrl,
              photos,
              brandColors,
              menuUrl,
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
      },
      include: { profile: true, offers: true },
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

    return success(restaurant, 201);
  } catch (err: any) {
    return error(err.message, 500);
  }
}
