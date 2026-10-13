import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { contentGeneratorService } from '@/server/modules/content-generator/content-generator.service';
import { z } from 'zod';

const GeneratePostSchema = z.object({
  restaurantId: z.string().optional().default(''),
  platform: z.enum(['instagram', 'facebook', 'google_business']).default('instagram'),
  opportunityData: z.any().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const validated = GeneratePostSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Données invalides', 400);
    }

    const post = await contentGeneratorService.generatePostForOpportunity(
      id,
      validated.data.restaurantId,
      validated.data.platform,
      validated.data.opportunityData
    );

    return success(post, 201);
  } catch (err: any) {
    console.error('[GENERATE_POST_ROUTE_ERROR]', err);
    return error(err.message, 500);
  }
}
