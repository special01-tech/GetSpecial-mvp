import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { postSafetyService } from '@/server/modules/publisher/post-safety.service';
import { z } from 'zod';

const PauseSchema = z.object({
  restaurantId: z.string(),
  isPaused: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = PauseSchema.safeParse(body);

    if (!validated.success) {
      return error('Paramètres invalides', 400);
    }

    const res = await postSafetyService.toggleRestaurantPause(
      validated.data.restaurantId,
      validated.data.isPaused
    );

    return success({ isPaused: res.isPaused });
  } catch (err: any) {
    return error(err.message, 500);
  }
}
