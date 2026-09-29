import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireAuth } from '@/server/lib/auth';
import { opportunityEngineService } from '@/server/modules/opportunity-engine/opportunity-engine.service';
import { prisma } from '@/server/db/prisma.client';
import { z } from 'zod';

const DismissSchema = z.object({
  restaurantId: z.string(),
  reason: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dbUser } = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const validated = DismissSchema.safeParse(body);

    if (!validated.success) {
      return error('restaurantId requis', 400);
    }

    // Protection IDOR : vérifier que l'opportunité appartient bien à ce gérant et à ce restaurant
    const opp = await prisma.opportunity.findUnique({
      where: { id },
      include: { restaurant: { select: { id: true, userId: true } } },
    });

    if (!opp || opp.restaurant.userId !== dbUser.id || opp.restaurantId !== validated.data.restaurantId) {
      return unauthorized();
    }

    await opportunityEngineService.dismissOpportunity(id, validated.data.restaurantId, validated.data.reason);

    return success({ dismissed: true, id });
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
