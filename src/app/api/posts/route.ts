import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireRestaurantOwnership } from '@/server/lib/auth';
import { transformPost } from '@/server/transformers';
import { z } from 'zod';

/* =============================================================================
 * Posts API Route
 *
 * POST /api/posts : Crée un nouveau post et sa publication associée
 * GET /api/posts  : Liste les posts du restaurant
 * ============================================================================= */

const CreatePostSchema = z.object({
  restaurantId: z.string().min(1),
  text: z.string().min(3),
  imageUrl: z.string().optional().nullable(),
  platform: z.enum(['instagram', 'facebook', 'tiktok', 'google_business']).default('instagram'),
  status: z.enum(['draft', 'pending_approval', 'approved', 'scheduled', 'published']).default('scheduled'),
  scheduledAt: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = CreatePostSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Données invalides', 400);
    }

    const { restaurantId, text, imageUrl, platform, status, scheduledAt } = validated.data;
    await requireRestaurantOwnership(restaurantId);

    const scheduledDate = scheduledAt ? new Date(scheduledAt) : new Date();

    const post = await prisma.post.create({
      data: {
        restaurantId,
        text,
        imageUrl: imageUrl || null,
        platform,
        status,
        scheduledAt: scheduledDate,
        publications: {
          create: {
            restaurantId,
            platform,
            sendIdempotencyKey: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            status: status === 'published' ? 'published' : 'pending',
            publishedAt: status === 'published' ? new Date() : null,
          },
        },
      },
      include: {
        publications: {
          include: {
            feedbackEvents: true,
          },
        },
      },
    });

    return success(transformPost(post), 201);
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}

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
    });

    return success(posts.map(transformPost));
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
