import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { contentGeneratorService } from '@/server/modules/content-generator/content-generator.service';
import { z } from 'zod';

const GeneratePostSchema = z.object({
  restaurantId: z.string(),
  platform: z.enum(['instagram', 'facebook']).default('instagram'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = GeneratePostSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Données invalides', 400);
    }

    const post = await contentGeneratorService.generatePostForOpportunity(
      id,
      validated.data.restaurantId,
      validated.data.platform
    );

    return success(post, 201);
  } catch (err: any) {
    return error(err.message, 500);
  }
}
