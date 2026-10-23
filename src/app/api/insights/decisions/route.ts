import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    const restaurant = await (prisma as any).restaurant.findFirst({
      where: restaurantId ? { id: restaurantId } : { status: 'active' },
    });

    if (!restaurant) {
      return error('Restaurant non trouvé', 404);
    }

    const events = await (prisma as any).feedbackEvent.findMany({
      where: {
        restaurantId: restaurant.id,
        type: 'decision',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Construire une map des dernières décisions par offre
    const decisions: Record<string, string> = {};
    for (const ev of events) {
      if (ev.reason && ev.reason.includes(':')) {
        const [offerId, choice] = ev.reason.split(':');
        if (!decisions[offerId]) {
          decisions[offerId] = choice;
        }
      }
    }

    return success({ decisions });
  } catch (err: any) {
    return error(err.message || 'Erreur récupération décisions', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { offerId, choice, restaurantId } = body;

    if (!offerId || !choice) {
      return error('offerId et choice requis', 400);
    }

    const restaurant = await (prisma as any).restaurant.findFirst({
      where: restaurantId ? { id: restaurantId } : { status: 'active' },
    });

    if (!restaurant) {
      return error('Restaurant non trouvé', 404);
    }

    await (prisma as any).feedbackEvent.create({
      data: {
        restaurantId: restaurant.id,
        type: 'decision',
        reason: `${offerId}:${choice}`,
        value: 1,
        status: 'active',
      },
    });

    return success({ message: `Décision ${choice} enregistrée avec succès` });
  } catch (err: any) {
    return error(err.message || 'Erreur sauvegarde décision', 500);
  }
}
