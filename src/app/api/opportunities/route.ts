import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireRestaurantOwnership } from '@/server/lib/auth';
import { opportunityEngineService } from '@/server/modules/opportunity-engine/opportunity-engine.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return error('restaurantId requis', 400);
    }

    // Vérifier que l'utilisateur possède ce restaurant
    await requireRestaurantOwnership(restaurantId);

    let opportunities = await prisma.opportunity.findMany({
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
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
