import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireAuth } from '@/server/lib/auth';
import { contentGeneratorService } from '@/server/modules/content-generator/content-generator.service';
import { prisma } from '@/server/db/prisma.client';
import { z } from 'zod';

const UpdatePostSchema = z.object({
  text: z.string().min(3),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dbUser } = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const validated = UpdatePostSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Texte invalide', 400);
    }

    // Vérifier que le post appartient à un restaurant du gérant
    const post = await prisma.post.findUnique({
      where: { id },
      include: { restaurant: { select: { userId: true } } },
    });

    if (!post || post.restaurant.userId !== dbUser.id) {
      return unauthorized();
    }

    const updated = await contentGeneratorService.updatePost(
      id,
      post.restaurantId,
      validated.data.text
    );

    return success(updated);
  } catch (err: any) {
    if (err.message === 'Non autorisé') return unauthorized();
    return error(err.message, 500);
  }
}
