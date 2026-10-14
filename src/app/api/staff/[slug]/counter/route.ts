import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { canCancelRedemption } from '@/server/modules/counter/domain';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { action, offerId, redemptionId, codeWord } = body;

    const restaurant = await (prisma.restaurant as any).findFirst({
      where: { status: 'active' },
    });

    if (!restaurant) {
      return error('Restaurant introuvable', 404);
    }

    if (action === 'quick-count') {
      if (!offerId) return error('offerId manquant', 400);

      let recordId = `count_${Date.now()}`;
      try {
        const ev = await (prisma.feedbackEvent as any).create({
          data: {
            restaurantId: restaurant.id,
            type: 'redemption_quick',
            reason: `offer:${offerId}`,
            value: 1,
            status: 'confirmed',
          },
        });
        if (ev?.id) recordId = ev.id;
      } catch (e) {
        console.warn('[REDEMPTION_PERSIST_INFO]', e);
      }

      return success({
        redemptionId: recordId,
        message: 'Utilisation comptabilisée (+1)',
      });
    }

    if (action === 'validate-code') {
      if (!codeWord) return error('Code mot manquant', 400);

      // Trouver l'offre correspondant au mot-code
      let offers: any[] = [];
      try {
        offers = await (prisma.offer as any).findMany({
          where: { restaurantId: restaurant.id, status: 'active' },
        });
      } catch {}

      const matchedOffer = offers.find(
        (o: any) => (o.codeWord || '').toUpperCase() === codeWord.trim().toUpperCase()
      );

      const resolvedTitle = matchedOffer?.title || `Offre (${codeWord.toUpperCase()})`;
      let recordId = `code_${Date.now()}`;

      try {
        const ev = await (prisma.feedbackEvent as any).create({
          data: {
            restaurantId: restaurant.id,
            type: 'redemption_code',
            reason: `code:${codeWord}`,
            value: 1,
            status: 'confirmed',
          },
        });
        if (ev?.id) recordId = ev.id;
      } catch (e) {
        console.warn('[CODE_PERSIST_INFO]', e);
      }

      return success({
        redemptionId: recordId,
        offerTitle: resolvedTitle,
        message: `Offre "${resolvedTitle}" validée avec succès`,
      });
    }

    if (action === 'cancel') {
      if (!redemptionId) return error('redemptionId manquant', 400);

      try {
        await (prisma.feedbackEvent as any).updateMany({
          where: { id: redemptionId },
          data: { status: 'cancelled' },
        });
      } catch {}

      return success({
        redemptionId,
        message: 'Annulation effectuée avec succès',
      });
    }

    return error('Action non reconnue', 400);
  } catch (err: any) {
    console.error('Erreur staff counter:', err);
    return error(err.message || 'Erreur serveur', 500);
  }
}
