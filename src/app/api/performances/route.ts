import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireRestaurantOwnership } from '@/server/lib/auth';
import { transformPerformance } from '@/server/transformers';

/* =============================================================================
 * Performances API Route
 *
 * GET /api/performances?restaurantId=...
 * Calcule et renvoie les métriques agrégées (portée, interactions, top publications,
 * répartition des plateformes pour le Donut Chart SVG).
 * ============================================================================= */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return error('restaurantId requis', 400);
    }

    await requireRestaurantOwnership(restaurantId);

    // Récupérer les posts avec leurs publications et feedbacks
    const posts = await prisma.post.findMany({
      where: { restaurantId },
      include: {
        publications: {
          include: {
            feedbackEvents: true,
          },
        },
      },
    });

    // Récupérer tous les événements de feedback pour le restaurant
    const feedbackEvents = await prisma.feedbackEvent.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });

    const performanceData = transformPerformance(posts, feedbackEvents);
    return success(performanceData);
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
