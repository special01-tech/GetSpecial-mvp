import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireRestaurantOwnership } from '@/server/lib/auth';
import { postSafetyService } from '@/server/modules/publisher/post-safety.service';
import { z } from 'zod';

const PauseSchema = z.object({
  restaurantId: z.string(),
  isPaused: z.boolean(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = PauseSchema.safeParse(body);

    if (!validated.success) {
      return error('Paramètres invalides', 400);
    }

    await requireRestaurantOwnership(validated.data.restaurantId);

    const res = await postSafetyService.toggleRestaurantPause(
      validated.data.restaurantId,
      validated.data.isPaused
    );

    return success({ isPaused: res.isPaused });
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
