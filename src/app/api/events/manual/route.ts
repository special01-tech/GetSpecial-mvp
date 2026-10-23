import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { logAudit } from '@/server/lib/audit';
import { z } from 'zod';

const ManualEventSchema = z.object({
  restaurantId: z.string().min(1, 'restaurantId est requis'),
  title: z.string().min(2, 'Le titre doit comporter au moins 2 caractères'),
  description: z.string().min(5, 'La description doit comporter au moins 5 caractères'),
  dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Format de date invalide (ISO attendu)'),
  intensity: z.number().min(0).max(1).default(1.0),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return error('restaurantId est requis pour consulter les événements', 400);
    }

    const events = await (prisma as any).signal.findMany({
      where: {
        type: 'event',
        restaurantId,
      },
      orderBy: { detectedAt: 'desc' },
      take: 50,
    });

    return success(events);
  } catch (err: any) {
    return error(err.message, 500);
  }
}

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
