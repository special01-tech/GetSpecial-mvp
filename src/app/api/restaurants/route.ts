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
  capacityCovers: z.number().optional(),
  averageTicket: z.number().optional(),
  offPeakDays: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
  marketingGoal: z.string().optional(),
  logoUrl: z.string().optional(),
  photos: z.array(z.string()).optional(),
  brandColors: z.array(z.string()).optional(),
  menuUrl: z.string().optional(),
  currentOffer: z.string().optional(),
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
      capacityCovers = 40,
      averageTicket = 25,
      offPeakDays = [],
      constraints = [],
      targetAudience = [],
      marketingGoal = 'more_clients',
      logoUrl,
      photos = [],
      brandColors = [],
      menuUrl,
      currentOffer,
      dishes = [],
    } = validated.data;

    // Définition de plats initiaux si aucun plat n'est fourni explicitement
    const defaultDishesToCreate = dishes.length > 0 ? dishes : [
      {
        name: type.toLowerCase().includes('pizz') ? 'Pizza Reine & Champignons frais' : type.toLowerCase().includes('burg') ? 'Classic Bacon Cheeseburger' : 'Plat Signature du Chef',
        description: 'Préparé sur place avec des ingrédients frais de saison',
        priceText: '16.50 €',
      },
      {
        name: type.toLowerCase().includes('pizz') ? 'Pizza Margherita D.O.P' : type.toLowerCase().includes('burg') ? 'Crispy Chicken & Sauce Maison' : 'Entrée du Terroir',
        description: 'Recette signature appréciée par les habitués',
        priceText: '13.00 €',
      },
      {
        name: type.toLowerCase().includes('cafe') ? 'Pâtisserie & Café de Spécialité' : 'Dessert Gourmand Maison',
        description: 'Fait maison par notre brigade',
        priceText: '7.50 €',
      },
    ];

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
              email: 'owner@brasspelican.com',
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
              capacityCovers,
              averageTicket,
              country: (detectedCountry || 'US').toUpperCase(),
              hasDelivery,
              targetAudience,
              marketingGoal,
              logoUrl,
              photos,
              brandColors,
              menuUrl,
              dishes: defaultDishesToCreate,
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

    const res = success(restaurant, 201);
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
