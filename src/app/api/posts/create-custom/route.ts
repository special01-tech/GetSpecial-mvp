import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { contentGeneratorService } from '@/server/modules/content-generator/content-generator.service';
import { z } from 'zod';
import { checkRateLimit } from '@/server/lib/rate-limit';
import { verifyRestaurantOwnership } from '@/server/lib/auth-guard';

const CreateCustomPostSchema = z.object({
  restaurantId: z.string(),
  sourceType: z.enum(['offer', 'event', 'custom']).default('custom'),
  sourceId: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional().default(''),
  discountValue: z.string().optional(),
  platform: z.enum(['instagram', 'facebook', 'google_business']).default('instagram'),
  style: z.enum(['gourmet', 'festive', 'chic', 'deal']).default('gourmet'),
  aspectRatio: z.enum(['4:5', '9:16', '1:1', '16:9']).default('4:5'),
  referenceImages: z.array(z.string()).optional().default([]),
  scheduledAt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, 'posts:create-custom', 12, 60 * 1000);
    if (!rate.allowed) {
      return error(`Trop de générations simultanées. Réessayez dans ${rate.retryAfterSec}s.`, 429);
    }
    const body = await req.json();
    const validated = CreateCustomPostSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Paramètres de création invalides', 400);
    }

    const {
      restaurantId,
      sourceType,
      title,
      description,
      discountValue,
      platform,
      style,
      aspectRatio,
      referenceImages,
      scheduledAt,
    } = validated.data;

    let offerText = title;
    if (discountValue) {
      offerText += ` - ${discountValue}`;
    }

    const access = await verifyRestaurantOwnership(req, restaurantId, { allowFallbackInDev: true });
    if (!access.allowed) {
      return error(access.error || 'Accès refusé', access.status);
    }
    const campaignType = sourceType === 'event' ? 'event' : 'promotion';

    const result = await contentGeneratorService.generateOrRegeneratePost({
      restaurantId,
      mode: 'generate',
      offer: offerText,
      details: description,
      campaignType,
      aspectRatio,
      style,
      platform,
      referenceImages,
    });

    if (scheduledAt) {
      await (contentGeneratorService as any).updatePost(result.post.id, restaurantId, undefined, undefined, platform);
    }

    return success(
      {
        post: result.post,
        generatedData: {
          id: result.post.id,
          title,
          headline: result.generatedData.headline,
          instagramCaption: result.generatedData.instagramCaption,
          facebookCaption: result.generatedData.facebookCaption,
          caption: result.generatedData.instagramCaption,
          imageUrl: result.generatedData.imageUrl,
          alternativeImages: result.generatedData.imageUrl ? [result.generatedData.imageUrl] : [],
          hashtags: result.generatedData.hashtags,
          discountValue: discountValue || null,
          platform,
          aspectRatio,
        },
      },
      201
    );
  } catch (err: any) {
    console.error('[CREATE_CUSTOM_ERROR]', err);
    return error(err.message, 500);
  }
}
