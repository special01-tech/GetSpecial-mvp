import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireRestaurantOwnership } from '@/server/lib/auth';
import { logAudit } from '@/server/lib/audit';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const account = await prisma.socialAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return error('Compte introuvable', 404);
    }

    // Vérifier les droits du gérant sur le restaurant
    await requireRestaurantOwnership(account.restaurantId);

    await prisma.socialAccount.delete({
      where: { id },
    });

    await logAudit({
      restaurantId: account.restaurantId,
      action: 'social.disconnect',
      entityType: 'social_account',
      entityId: id,
      details: { platform: account.platform },
    });

    return success({ disconnected: true, id });
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
