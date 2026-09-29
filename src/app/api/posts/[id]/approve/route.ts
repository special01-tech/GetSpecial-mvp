import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { postSafetyService } from '@/server/modules/publisher/post-safety.service';
import { z } from 'zod';

const ApprovePostSchema = z.object({
  restaurantId: z.string(),
  scheduledAt: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = ApprovePostSchema.safeParse(body);

    if (!validated.success) {
      return error('restaurantId requis', 400);
    }

    const scheduledDate = validated.data.scheduledAt ? new Date(validated.data.scheduledAt) : undefined;
    const approved = await postSafetyService.approvePost(
      id,
      validated.data.restaurantId,
      scheduledDate
    );

    return success(approved);
  } catch (err: any) {
    return error(err.message, 400);
  }
}
