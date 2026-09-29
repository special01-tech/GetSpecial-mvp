import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { contentGeneratorService } from '@/server/modules/content-generator/content-generator.service';
import { z } from 'zod';

const UpdatePostSchema = z.object({
  restaurantId: z.string(),
  text: z.string().min(3),
});

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
