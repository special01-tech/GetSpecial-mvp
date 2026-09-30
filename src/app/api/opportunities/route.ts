import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireRestaurantOwnership } from '@/server/lib/auth';
import { opportunityEngineService } from '@/server/modules/opportunity-engine/opportunity-engine.service';
import { transformOpportunity, transformIdeaItem } from '@/server/transformers';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');
    const view = searchParams.get('view'); // 'ideas' ou 'opportunities' (par défaut)

    if (!restaurantId) {
      return error('restaurantId requis', 400);
    }

    // Vérifier que l'utilisateur possède ce restaurant
    await requireRestaurantOwnership(restaurantId);

    let opportunities = await prisma.opportunity.findMany({
      where: { restaurantId, status: 'pending' },
      include: { signal: true },
      orderBy: { suggestedAt: 'desc' },
      take: 20,
    });

    // Si aucune opportunité en attente, tenter une génération automatique
    if (opportunities.length === 0) {
      await opportunityEngineService.generateOpportunities(restaurantId);
      opportunities = await prisma.opportunity.findMany({
        where: { restaurantId, status: 'pending' },
        include: { signal: true },
        orderBy: { suggestedAt: 'desc' },
        take: 20,
      });
    }

    if (view === 'ideas') {
      return success(opportunities.map(transformIdeaItem));
    }

    return success(opportunities.map(transformOpportunity));
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
