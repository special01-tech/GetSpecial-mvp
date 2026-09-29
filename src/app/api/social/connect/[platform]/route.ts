import { NextRequest } from 'next/server';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireRestaurantOwnership } from '@/server/lib/auth';
import { outstandService } from '@/server/modules/publisher/outstand.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    const body = await req.json();
    const { restaurantId } = body;

    if (!restaurantId) {
      return error('restaurantId requis', 400);
    }

    // Vérifier les droits du gérant sur le restaurant
    await requireRestaurantOwnership(restaurantId);

    if (platform !== 'facebook' && platform !== 'instagram') {
      return error('Plateforme non supportée actuellement (Facebook et Instagram uniquement)', 400);
    }

    const authUrl = await outstandService.getConnectUrl(platform, restaurantId);

    return success({ url: authUrl });
  } catch (err: any) {
    if (err.message === 'Non autorisé' || err.message?.includes('accès refusé')) return unauthorized();
    return error(err.message, 500);
  }
}
