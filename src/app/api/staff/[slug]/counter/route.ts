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

      const deviceId = req.cookies.get('gs_device_id')?.value || 'staff_terminal';
      const redemption = await (prisma.redemption as any).create({
        data: {
          restaurantId: restaurant.id,
          offerId,
          deviceId,
          partySize: 1,
          source: 'passage',
          status: 'confirmed',
          confirmedBy: 'staff',
          confirmedAt: new Date(),
        },
      });

      return success({
        redemptionId: redemption.id,
        message: 'Utilisation comptabilisée (+1)',
      });
    }

    if (action === 'validate-code') {
      if (!codeWord) return error('Code mot manquant', 400);

      // Trouver l'offre correspondant au mot-code
      const offers = await (prisma.offer as any).findMany({
        where: { restaurantId: restaurant.id, status: 'active' },
      });

      const matchedOffer = offers.find(
        (o: any) => (o.codeWord || '').toUpperCase() === codeWord.trim().toUpperCase()
      );

      if (!matchedOffer) {
        return error(`Mot-code "${codeWord}" inconnu ou expiré`, 404);
      }

      const deviceId = req.cookies.get('gs_device_id')?.value || 'staff_terminal';
      const redemption = await (prisma.redemption as any).create({
        data: {
          restaurantId: restaurant.id,
          offerId: matchedOffer.id,
          deviceId,
          partySize: 1,
          source: 'qr',
          status: 'confirmed',
          confirmedBy: 'staff_code',
          confirmedAt: new Date(),
        },
      });

      return success({
        redemptionId: redemption.id,
        offerTitle: matchedOffer.title,
        message: `Offre "${matchedOffer.title}" validée avec succès`,
      });
    }

    if (action === 'cancel') {
      if (!redemptionId) return error('redemptionId manquant', 400);

      const redemption = await (prisma.redemption as any).findUnique({
        where: { id: redemptionId },
      });

      if (!redemption) {
        return error('Enregistrement non trouvé', 404);
      }

      if (!canCancelRedemption(new Date(redemption.createdAt))) {
        return error("Le délai d'annulation de 2 minutes est dépassé", 400);
      }

      const updated = await (prisma.redemption as any).update({
        where: { id: redemptionId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
      });

      return success({
        redemptionId: updated.id,
        message: 'Annulation effectuée avec succès',
      });
    }

    return error('Action non reconnue', 400);
  } catch (err: any) {
    console.error('Erreur staff counter:', err);
    return error(err.message || 'Erreur serveur', 500);
  }
}
