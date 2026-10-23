import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { contentGeneratorService } from '@/server/modules/content-generator/content-generator.service';
import { z } from 'zod';
import { checkRateLimit } from '@/server/lib/rate-limit';
import { verifyRestaurantOwnership } from '@/server/lib/auth-guard';

const GenerateCaptionSchema = z.object({
  restaurantId: z.string().optional(),
  postId: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional().default(''),
  discountValue: z.string().optional(),
  platform: z.enum(['instagram', 'facebook', 'google_business']).default('instagram'),
  style: z.enum(['gourmet', 'festive', 'chic', 'deal']).default('gourmet'),
  sourceType: z.enum(['offer', 'event', 'custom']).default('custom'),
  angleIndex: z.number().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, 'posts:generate-caption', 20, 60 * 1000);
    if (!rate.allowed) {
      return error(`Trop de demandes de réécriture. Réessayez dans ${rate.retryAfterSec}s.`, 429);
    }
    const body = await req.json();
    const validated = GenerateCaptionSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Paramètres invalides', 400);
    }

    const {
      restaurantId,
      postId,
      title,
      description,
      discountValue,
      platform,
      style,
      sourceType,
      angleIndex,
    } = validated.data;

    let restaurant = null;
    if (restaurantId) {
      restaurant = await (prisma as any).restaurant.findUnique({
        where: { id: restaurantId },
        include: { profile: true },
      });
    }

    if (!restaurant) {
      restaurant = await (prisma as any).restaurant.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      });
    }

    const restaurantName = restaurant?.name || 'Le Bistrot';
    const address = restaurant?.address || 'Centre-ville';
    const city = restaurant?.city || undefined;
    const tone = restaurant?.profile?.tone || 'Chaleureux et gourmand';

    const result = await contentGeneratorService.generateCopywriting({
      restaurantId: restaurant?.id || restaurantId,
      restaurantName,
      address,
      city,
      sourceType,
      title,
      description,
      discountValue,
      platform,
      style,
      tone,
      angleIndex,
    });

    // Si un postId est passé, synchroniser en base de données
    if (postId && restaurant?.id) {
      await contentGeneratorService.updatePost(
        postId,
        restaurant.id,
        result.caption,
        undefined,
        platform
      ).catch(() => {});
    }

    return success({
      caption: result.caption,
      hook: result.hook,
      cta: result.cta,
      hashtags: result.hashtags,
      isAiGenerated: result.isAiGenerated,
      modelUsed: result.modelUsed,
      platform,
    });
  } catch (err: any) {
    return error(err.message, 500);
  }
}
