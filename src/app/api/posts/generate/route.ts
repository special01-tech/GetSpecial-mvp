import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { contentGeneratorService } from '@/server/modules/content-generator/content-generator.service';
import { z } from 'zod';
import { checkRateLimit } from '@/server/lib/rate-limit';
import { verifyRestaurantOwnership } from '@/server/lib/auth-guard';

const GeneratePostSchema = z.object({
  restaurantId: z.string(),
  mode: z.enum(['generate', 'regenerate_different']).default('generate'),
  postId: z.string().optional(),
  offer: z.string().min(2, 'Le texte de l’offre est requis'),
  details: z.string().optional().default(''),
  campaignType: z.enum(['promotion', 'new_dish', 'drink', 'event', 'daily_menu', 'custom']).default('promotion'),
  aspectRatio: z.enum(['4:5', '9:16', '1:1', '16:9']).default('4:5'),
  referenceImages: z.array(z.string()).optional().default([]),
  userFeedback: z.string().optional(),
  opportunityId: z.string().optional(),
  codeWord: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, 'posts:generate', 12, 60 * 1000);
    if (!rate.allowed) {
      return error(`Trop de générations simultanées. Réessayez dans ${rate.retryAfterSec}s.`, 429);
    }
    const body = await req.json();
    const validated = GeneratePostSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Paramètres invalides', 400);
    }

    const access = await verifyRestaurantOwnership(req, validated.data.restaurantId, { allowFallbackInDev: true });
    if (!access.allowed) {
      return error(access.error || 'Accès refusé', access.status);
    }
    const result = await contentGeneratorService.generateOrRegeneratePost(validated.data);

    return success(result, 201);
  } catch (err: any) {
    console.error('[API_POSTS_GENERATE_ERROR]', err);
    return error(err.message || 'Erreur lors de la génération', 500);
  }
}
