import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { calculateCounterMetrics } from '@/server/modules/counter/domain';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug') || 'atelier-culinaire';

    const restaurant = await (prisma.restaurant as any).findFirst({
      where: { status: 'active' },
      include: {
        profile: true,
        offers: {
          where: { status: 'active' },
        },
      },
    });

    if (!restaurant) {
      return error('Restaurant non trouvé', 404);
    }

    const restId = restaurant.id;
    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [scans7, scans30, redemptions7, redemptions30, contacts7, contacts30] = await Promise.all([
      (prisma.scan as any).findMany({ where: { restaurantId: restId, createdAt: { gte: d7 } } }),
      (prisma.scan as any).findMany({ where: { restaurantId: restId, createdAt: { gte: d30 } } }),
      (prisma.redemption as any).findMany({ where: { restaurantId: restId, createdAt: { gte: d7 } } }),
      (prisma.redemption as any).findMany({ where: { restaurantId: restId, createdAt: { gte: d30 } } }),
      (prisma.customerContact as any).count({ where: { restaurantId: restId, createdAt: { gte: d7 } } }),
      (prisma.customerContact as any).count({ where: { restaurantId: restId, createdAt: { gte: d30 } } }),
    ]);

    const metrics7 = calculateCounterMetrics(redemptions7);
    const metrics30 = calculateCounterMetrics(redemptions30);

    return success({
      isCounterConnected: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: slug,
        brand_color: restaurant.profile?.brandColor || '#ff6600',
        timezone: restaurant.timezone || 'Europe/Paris',
        capacityCovers: restaurant.profile?.capacityCovers || 40,
        averageTicket: restaurant.profile?.averageTicket || 25,
        foodCostPct: restaurant.profile?.foodCostPct || 0.30,
      },
      stats7: {
        scans: scans7.length,
        claimed: metrics7.claimedCount,
        confirmed: metrics7.confirmedCount,
        totalUses: metrics7.totalUses,
        totalPersons: metrics7.totalPersons,
        contacts: contacts7,
      },
      stats30: {
        scans: scans30.length,
        claimed: metrics30.claimedCount,
        confirmed: metrics30.confirmedCount,
        totalUses: metrics30.totalUses,
        totalPersons: metrics30.totalPersons,
        contacts: contacts30,
      },
      offers: restaurant.offers.map((o: any) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        discount_value: o.discountValue,
        code_word: o.codeWord || 'DOUCEUR',
        target_uses: o.targetUses || 10,
        active: o.status === 'active' ? 1 : 0,
      })),
    });
  } catch (err: any) {
    console.error('Erreur API insights:', err);
    return error(err.message || 'Erreur interne insights', 500);
  }
}
