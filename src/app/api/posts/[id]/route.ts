import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { contentGeneratorService } from '@/server/modules/content-generator/content-generator.service';
import { prisma } from '@/server/db/prisma.client';
import { z } from 'zod';

const UpdatePostSchema = z.object({
  restaurantId: z.string(),
  text: z.string().min(1).optional(),
  imageUrl: z.string().optional(),
  platform: z.string().optional(),
  headline: z.string().optional(),
  instagramCaption: z.string().optional(),
  facebookCaption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  rating: z.number().min(1).max(5).optional(),
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
      return error(validated.error.issues[0]?.message ?? 'Paramètres invalides', 400);
    }

    const {
      restaurantId,
      text,
      imageUrl,
      platform,
      headline,
      instagramCaption,
      facebookCaption,
      hashtags,
      rating,
    } = validated.data;

    const updated = await contentGeneratorService.updatePost(
      id,
      restaurantId,
      text,
      imageUrl,
      platform,
      {
        headline,
        instagramCaption,
        facebookCaption,
        hashtags,
        rating,
      }
    );

    return success(updated);
  } catch (err: any) {
    return error(err.message, 500);
  }
}
