import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { logAudit } from '@/server/lib/audit';
import { resolveActiveRestaurant, deriveOffPeakDaysFromSlots } from '@/server/lib/resolve-restaurant';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  // Champs directs de l'établissement (Restaurant)
  name: z.string().min(1, 'Le nom de l’établissement est requis.').optional(),
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
  capacityCovers: z.number().int().min(0).nullable().optional(),
  averageTicket: z.number().min(0).nullable().optional(),
  currency: z.string().optional(),
  baselineCovers: z.number().int().min(0).nullable().optional(),
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
    const restaurant = await resolveActiveRestaurant(req, id, {
      profile: true,
      offers: { where: { status: 'active' } },
      socialAccounts: true,
    });

    if (!restaurant) {
      return error('Aucun établissement configuré.', 404);
    }

    return success(restaurant);
  } catch (err: any) {
    console.error('[RESTAURANT_PROFILE_GET_ERROR]', err);
    return error('Impossible de charger le profil du restaurant pour le moment.', 500);
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
      return error(validated.error.issues[0]?.message ?? 'Les informations saisies sont invalides.', 400);
    }

    const existing = await resolveActiveRestaurant(req, id, { profile: true });
    if (!existing) {
      return error('Établissement introuvable.', 404);
    }

    const effectiveRestaurantId = existing.id;

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

    // Fusion sans perte de customRules (préserve dishes, menuMetadata, eventPreferences, etc.)
    if (profileData.customRules !== undefined) {
      const existingCustomRules =
        (existing.profile?.customRules as Record<string, any> | undefined) || {};
      const mergedRules = {
        ...existingCustomRules,
        ...profileData.customRules,
      };
      profileData.customRules = mergedRules;

      // Synchronise automatiquement la colonne offPeakDays avec les créneaux configurés
      if (
        profileData.offPeakDays === undefined &&
        ('hasOffPeak' in profileData.customRules || 'offPeakSlots' in profileData.customRules)
      ) {
        profileData.offPeakDays = deriveOffPeakDaysFromSlots(
          mergedRules.hasOffPeak,
          mergedRules.offPeakSlots
        );
      }
    }

    if (Object.keys(profileData).length > 0) {
      await (prisma as any).restaurantProfile.upsert({
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
    console.error('[RESTAURANT_PROFILE_PATCH_ERROR]', err);
    return error('Impossible d’enregistrer vos modifications pour le moment. Veuillez réessayer.', 500);
  }
}
