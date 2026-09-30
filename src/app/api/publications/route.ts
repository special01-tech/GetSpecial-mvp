import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireRestaurantOwnership } from '@/server/lib/auth';
import { transformPost } from '@/server/transformers';

/* =============================================================================
 * Publications API Route
 *
 * GET /api/publications?restaurantId=...
 * Récupère la liste ordonnée des publications formatées pour le calendrier et la liste.
 * ============================================================================= */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return error('restaurantId requis', 400);
    }

    await requireRestaurantOwnership(restaurantId);

    const posts = await prisma.post.findMany({
      where: { restaurantId },
      include: {
        publications: {
          include: {
            feedbackEvents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const transformed = posts.map(transformPost);
    return success(transformed);
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
