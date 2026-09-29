import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { logAudit } from '@/server/lib/audit';
import { z } from 'zod';

const OfferSchema = z.object({
  restaurantId: z.string(),
  title: z.string().min(2),
  description: z.string().min(3),
  discountValue: z.string().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
  recurrenceDays: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return error('restaurantId requis', 400);
    }

    const offers = await (prisma as any).offer.findMany({
      where: { restaurantId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    return success(offers);
  } catch (err: any) {
    return error(err.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = OfferSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Données d’offre invalides', 400);
    }

    const offer = await (prisma as any).offer.create({
      data: validated.data,
    });

    await logAudit({
      restaurantId: offer.restaurantId,
      action: 'offer.create',
      entityType: 'offer',
      entityId: offer.id,
      details: validated.data,
    });

    return success(offer, 201);
  } catch (err: any) {
    return error(err.message, 500);
  }
}
