import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { opportunityEngineService } from '@/server/modules/opportunity-engine/opportunity-engine.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return error('restaurantId requis', 400);
    }

    let opportunities = await (prisma as any).opportunity.findMany({
      where: { restaurantId, status: 'pending' },
      orderBy: { suggestedAt: 'desc' },
      take: 10,
    });

    // Si aucune opportunité en attente, tenter une génération
    if (opportunities.length === 0) {
      opportunities = await opportunityEngineService.generateOpportunities(restaurantId);
    }

    return success(opportunities);
  } catch (err: any) {
    return error(err.stack || err.message || 'Erreur interne', 500);
  }
}
