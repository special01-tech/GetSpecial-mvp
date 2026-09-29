import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireRestaurantOwnership } from '@/server/lib/auth';
import { logAudit } from '@/server/lib/audit';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  tone: z.string().optional(),
  hasTerrace: z.boolean().optional(),
  offPeakDays: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  customRules: z.record(z.string(), z.any()).optional(),
});

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

    // Vérifier les droits du gérant sur le restaurant
    await requireRestaurantOwnership(id);

    const updated = await prisma.restaurantProfile.upsert({
      where: { restaurantId: id },
      update: validated.data,
      create: {
        restaurantId: id,
        ...validated.data,
      },
    });

    await logAudit({
      restaurantId: id,
      action: 'profile.update',
      entityType: 'restaurant_profile',
      entityId: updated.id,
      details: validated.data,
    });

    return success(updated);
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
