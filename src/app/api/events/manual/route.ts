import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
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

    // Normalisation dans le format de signal unifié
    const signal = await (prisma as any).signal.create({
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
    return error(err.message, 500);
  }
}
