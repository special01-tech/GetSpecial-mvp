import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { contentGeneratorService } from '@/server/modules/content-generator/content-generator.service';
import { z } from 'zod';

import { prisma } from '@/server/db/prisma.client';

const UpdatePostSchema = z.object({
  restaurantId: z.string(),
  text: z.string().min(3),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let post = await (prisma as any).post.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!post && id.startsWith('opp_')) {
      // Rechercher si un post a déjà été généré pour cette opportunité
      post = await (prisma as any).post.findFirst({
        where: { opportunityId: id },
        include: { restaurant: true },
      });
    }

    if (!post) {
      return error('Post introuvable', 404);
    }

    return success(post);
  } catch (err: any) {
    return error(err.message, 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = UpdatePostSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Texte invalide', 400);
    }

    const updated = await contentGeneratorService.updatePost(
      id,
      validated.data.restaurantId,
      validated.data.text
    );

    return success(updated);
  } catch (err: any) {
    return error(err.message, 500);
  }
}
