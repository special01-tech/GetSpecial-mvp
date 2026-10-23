import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { checkRateLimit } from '@/server/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const rate = checkRateLimit(req, 'public:claim', 20, 60 * 1000);
    if (!rate.allowed) {
      return error(`Trop de tentatives. Réessayez dans ${rate.retryAfterSec}s.`, 429);
    }

    const { slug } = await params;
    const body = await req.json();
    const { offerId, partySize = 1, source = 'qr' } = body;

    if (!offerId) {
      return error('offerId manquant', 400);
    }

    let restaurant = await (prisma.restaurant as any).findUnique({
      where: { id: slug },
    });
    if (!restaurant) {
      restaurant = await (prisma.restaurant as any).findFirst({
        where: { status: 'active' },
      });
    }

    if (!restaurant) {
      return error('Restaurant non trouvé', 404);
    }

    // Générer un claim_token aléatoire court de 4 caractères
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let claimToken = '';
    for (let i = 0; i < 4; i++) {
      claimToken += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Récupérer ou générer un deviceId anonyme
    const deviceId = req.cookies.get('gs_device_id')?.value || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const normalizedPartySize = Math.max(1, parseInt(String(partySize), 10) || 1);

    // Enregistrer la réclamation dans feedbackEvent (compatible Prisma & fallbackStore)
    const redemption = await (prisma.feedbackEvent as any).create({
      data: {
        restaurantId: restaurant.id,
        type: 'qr_claim',
        reason: `offer:${offerId}|token:${claimToken}|device:${deviceId}|source:${source}`,
        value: normalizedPartySize,
        status: 'claimed',
      },
    });

    const res = success({
      redemptionId: redemption.id,
      claimToken,
      partySize: normalizedPartySize,
      expiresInMinutes: 10,
    });

    // Assurer la présence du cookie device_id
    res.cookies.set('gs_device_id', deviceId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    console.error('Erreur claim:', err);
    return error(err.message || 'Erreur serveur', 500);
  }
}
