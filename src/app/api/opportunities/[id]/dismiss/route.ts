import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { opportunityEngineService } from '@/server/modules/opportunity-engine/opportunity-engine.service';
import { z } from 'zod';

const DismissSchema = z.object({
  restaurantId: z.string(),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = DismissSchema.safeParse(body);

    if (!validated.success) {
      return error('restaurantId requis', 400);
    }

    await opportunityEngineService.dismissOpportunity(id, validated.data.restaurantId, validated.data.reason);

    return success({ dismissed: true, id });
  } catch (err: any) {
    return error(err.message, 500);
  }
}
