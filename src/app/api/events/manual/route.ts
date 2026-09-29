import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireRestaurantOwnership } from '@/server/lib/auth';
import { logAudit } from '@/server/lib/audit';
import { z } from 'zod';

const ManualEventSchema = z.object({
  restaurantId: z.string(),
  title: z.string().min(2),
  description: z.string().min(5),
  dateTime: z.string(),
  intensity: z.number().min(0).max(1).default(1.0),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = ManualEventSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Données invalides', 400);
    }

    const { restaurantId, title, description, dateTime, intensity } = validated.data;

    // Vérifier les droits du gérant sur le restaurant
    await requireRestaurantOwnership(restaurantId);

    // Normalisation dans le format de signal unifié
    const signal = await prisma.signal.create({
      data: {
        restaurantId,
        type: 'event',
        source: 'manual',
        intensity,
        detectedAt: new Date(),
        data: {
          title,
          summary: description,
          timestamp: dateTime,
          raw: { manual: true },
        },
      },
    });

    await logAudit({
      restaurantId,
      action: 'event.manual_create',
      entityType: 'signal',
      entityId: signal.id,
      details: { title, dateTime },
    });

    return success(signal, 201);
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
