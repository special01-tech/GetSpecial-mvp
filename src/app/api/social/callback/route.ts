import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireRestaurantOwnership } from '@/server/lib/auth';
import { logAudit } from '@/server/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');
    const restaurantId = searchParams.get('state') || searchParams.get('restaurantId');
    const outstandAccountId = searchParams.get('account_id') || `outstand_acc_${platform}_${Date.now()}`;
    const username = searchParams.get('username') || `@${platform}_restaurant`;

    if (!platform || !restaurantId) {
      return error('platform et state (restaurantId) requis', 400);
    }

    // Vérifier les droits du gérant sur le restaurant
    await requireRestaurantOwnership(restaurantId);

    const socialAccount = await prisma.socialAccount.upsert({
      where: {
        restaurantId_platform: {
          restaurantId,
          platform,
        },
      },
      update: {
        outstandAccountId,
        username,
        status: 'connected',
        lastSyncAt: new Date(),
      },
      create: {
        restaurantId,
        platform,
        outstandAccountId,
        username,
        status: 'connected',
        lastSyncAt: new Date(),
      },
    });

    await logAudit({
      restaurantId,
      action: 'social.connect',
      entityType: 'social_account',
      entityId: socialAccount.id,
      details: { platform, username },
    });

    return success({
      connected: true,
      account: socialAccount,
      message: `Compte ${platform} connecté avec succès.`,
    });
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
