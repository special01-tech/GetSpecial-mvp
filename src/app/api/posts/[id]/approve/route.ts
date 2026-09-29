import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireAuth } from '@/server/lib/auth';
import { postSafetyService } from '@/server/modules/publisher/post-safety.service';
import { prisma } from '@/server/db/prisma.client';
import { z } from 'zod';

const ApprovePostSchema = z.object({
  restaurantId: z.string(),
  scheduledAt: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dbUser } = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const validated = ApprovePostSchema.safeParse(body);

    if (!validated.success) {
      return error('restaurantId requis', 400);
    }

    // Protection IDOR : vérifier que le post existe et appartient au restaurant du gérant connecté
    const post = await prisma.post.findUnique({
      where: { id },
      include: { restaurant: { select: { id: true, userId: true } } },
    });

    if (!post || post.restaurant.userId !== dbUser.id || post.restaurantId !== validated.data.restaurantId) {
      return unauthorized();
    }

    const scheduledDate = validated.data.scheduledAt ? new Date(validated.data.scheduledAt) : undefined;
    const approved = await postSafetyService.approvePost(
      id,
      validated.data.restaurantId,
      scheduledDate
    );

    return success(approved);
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 400);
  }
}
