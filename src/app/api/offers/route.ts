import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireRestaurantOwnership } from '@/server/lib/auth';
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return error('restaurantId requis', 400);
    }

    await requireRestaurantOwnership(restaurantId);

    const offers = await prisma.offer.findMany({
      where: { restaurantId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    return success(offers);
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = OfferSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? "Données d'offre invalides", 400);
    }

    await requireRestaurantOwnership(validated.data.restaurantId);

    const offer = await prisma.offer.create({
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
    if (err.message === 'Non autorisé' || err.message.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
