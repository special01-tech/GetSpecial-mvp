import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireAuth, requireRestaurantOwnership } from '@/server/lib/auth';
import { contentGeneratorService } from '@/server/modules/content-generator/content-generator.service';
import { prisma } from '@/server/db/prisma.client';
import { z } from 'zod';

const GeneratePostSchema = z.object({
  restaurantId: z.string(),
  platform: z.enum(['instagram', 'facebook']).default('instagram'),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dbUser } = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const validated = GeneratePostSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Données invalides', 400);
    }

    // Protection IDOR : vérifier que l'opportunité appartient bien à ce gérant et à ce restaurant
    const opp = await prisma.opportunity.findUnique({
      where: { id },
      include: { restaurant: { select: { id: true, userId: true } } },
    });

    if (!opp || opp.restaurant.userId !== dbUser.id || opp.restaurantId !== validated.data.restaurantId) {
      return unauthorized();
    }

    const post = await contentGeneratorService.generatePostForOpportunity(
      id,
      validated.data.restaurantId,
      validated.data.platform
    );

    return success(post, 201);
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
