import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { logAudit } from '@/server/lib/audit';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  // Champs directs de l'établissement (Restaurant)
  name: z.string().optional(),
  type: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  openingHours: z.any().optional(),
  specialties: z.array(z.string()).optional(),
  isPaused: z.boolean().optional(),

  // Données de configuration & profil (RestaurantProfile)
  tone: z.string().optional(),
  hasTerrace: z.boolean().optional(),
  hasDelivery: z.boolean().optional(),
  capacityCovers: z.number().nullable().optional(),
  averageTicket: z.number().nullable().optional(),
  currency: z.string().optional(),
  baselineCovers: z.number().optional(),
  foodCostPct: z.number().nullable().optional(),
  drinkCostPct: z.number().nullable().optional(),
  maxDiscountPct: z.number().nullable().optional(),
  offPeakDays: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
  marketingGoal: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  photos: z.array(z.string()).optional(),
  brandColors: z.array(z.string()).optional(),
  menuUrl: z.string().nullable().optional(),
  maxPostsPerDay: z.number().optional(),
  autoApprove: z.boolean().optional(),
  customRules: z.record(z.string(), z.any()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let restaurant = null;

    if (id && id !== 'current' && id !== 'default') {
      restaurant = await (prisma as any).restaurant.findUnique({
        where: { id },
        include: {
          profile: true,
          offers: { where: { status: 'active' } },
          socialAccounts: true,
        },
      });
    }

    if (!restaurant) {
      restaurant = await (prisma as any).restaurant.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          offers: { where: { status: 'active' } },
          socialAccounts: true,
        },
      });
    }

    if (!restaurant) {
      return error('Restaurant introuvable', 404);
    }

    return success(restaurant);
  } catch (err: any) {
    return error(err.message, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = UpdateProfileSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Données de profil invalides', 400);
    }

    // Résolution de l'ID effectif du restaurant
    let effectiveRestaurantId = id;
    let existing = null;
    if (id && id !== 'current' && id !== 'default') {
      existing = await (prisma as any).restaurant.findUnique({ where: { id } });
    }
    if (!existing) {
      existing = await (prisma as any).restaurant.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) {
        effectiveRestaurantId = existing.id;
      }
    }

    if (!existing) {
      return error('Restaurant introuvable pour la mise à jour', 404);
    }

    // Séparation des champs Restaurant et RestaurantProfile
    const {
      name,
      type,
      address,
      city,
      postalCode,
      phone,
      website,
      openingHours,
      specialties,
      isPaused,
      ...profileData
    } = validated.data;

    const restaurantUpdates: Record<string, any> = {};
    if (name !== undefined) restaurantUpdates.name = name;
    if (type !== undefined) restaurantUpdates.type = type;
    if (address !== undefined) restaurantUpdates.address = address;
    if (city !== undefined) restaurantUpdates.city = city;
    if (postalCode !== undefined) restaurantUpdates.postalCode = postalCode;
    if (phone !== undefined) restaurantUpdates.phone = phone;
    if (website !== undefined) restaurantUpdates.website = website;
    if (openingHours !== undefined) restaurantUpdates.openingHours = openingHours;
    if (specialties !== undefined) restaurantUpdates.specialties = specialties;
    if (isPaused !== undefined) restaurantUpdates.isPaused = isPaused;

    if (Object.keys(restaurantUpdates).length > 0) {
      await (prisma as any).restaurant.update({
        where: { id: effectiveRestaurantId },
        data: restaurantUpdates,
      });
    }

    let updatedProfile = null;
    if (Object.keys(profileData).length > 0) {
      updatedProfile = await (prisma as any).restaurantProfile.upsert({
        where: { restaurantId: effectiveRestaurantId },
        update: profileData,
        create: {
          restaurantId: effectiveRestaurantId,
          ...profileData,
        },
      });
    }

    await logAudit({
      restaurantId: effectiveRestaurantId,
      action: 'profile.update',
      entityType: 'restaurant_profile',
      entityId: effectiveRestaurantId,
      details: validated.data,
    });

    // Retourner le restaurant complet actualisé
    const fullRestaurant = await (prisma as any).restaurant.findUnique({
      where: { id: effectiveRestaurantId },
      include: {
        profile: true,
        offers: { where: { status: 'active' } },
        socialAccounts: true,
      },
    });

    return success(fullRestaurant);
  } catch (err: any) {
    return error(err.message, 500);
  }
}
