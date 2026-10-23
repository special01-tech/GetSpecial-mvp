import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { contentGeneratorService } from '@/server/modules/content-generator/content-generator.service';
import { z } from 'zod';
import { checkRateLimit } from '@/server/lib/rate-limit';
import { verifyRestaurantOwnership } from '@/server/lib/auth-guard';

const GenerateImageSchema = z.object({
  postId: z.string().optional(),
  restaurantId: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional().default(''),
  discountValue: z.string().optional(),
  style: z.enum(['gourmet', 'festive', 'chic', 'deal']).default('gourmet'),
  platform: z.enum(['instagram', 'facebook', 'google_business']).default('instagram'),
});

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, 'posts:generate-image', 10, 60 * 1000);
    if (!rate.allowed) {
      return error(`Trop de régénérations d'images. Réessayez dans ${rate.retryAfterSec}s.`, 429);
    }
    const body = await req.json();
    const validated = GenerateImageSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Paramètres invalides', 400);
    }

    const { postId, restaurantId, title, description, discountValue, style, platform } = validated.data;
    const access = await verifyRestaurantOwnership(req, restaurantId, { allowFallbackInDev: true });
    if (!access.allowed) {
      return error(access.error || 'Accès refusé', access.status);
    }

    try {
      const offerText = discountValue ? `${title} - ${discountValue}` : title;
      const regen = await contentGeneratorService.generateOrRegeneratePost({
        restaurantId: restaurantId || '',
        mode: 'regenerate_different',
        postId,
        offer: offerText,
        details: description,
        style,
        platform,
        userFeedback: 'Nouvel angle de vue dynamique, nouvelle ambiance et nouvel éclairage naturel',
      });

      if (!regen.generatedData.imageUrl) {
        return error('Image non disponible, réessayez plus tard.', 503);
      }

      return success({
        imageUrl: regen.generatedData.imageUrl,
        visualPrompt: regen.generatedData.posterPrompt,
      });
    } catch (genErr: any) {
      console.warn('[GENERATE_IMAGE_AI_ERROR]', genErr.message);
      return error('Image non disponible, réessayez plus tard.', 503);
    }
  } catch (err: any) {
    return error(err.message || 'Erreur lors du traitement', 500);
  }
}
