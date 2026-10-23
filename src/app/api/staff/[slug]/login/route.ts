import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { verifyPin, evaluatePinRateLimit } from '@/server/modules/auth-pin/domain';
import { signSessionToken } from '@/server/lib/session';

export const dynamic = 'force-dynamic';

const staffRateLimitMap = new Map<string, { failureCount: number; lastFailedAt: Date }>();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const { pin } = body;

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateKey = `pin:staff:${slug}:${ip}`;

    // Vérification limitation des essais
    const rateRecord = staffRateLimitMap.get(rateKey);

    const rateCheck = evaluatePinRateLimit(
      rateRecord?.failureCount || 0,
      rateRecord?.lastFailedAt || null
    );

    if (rateCheck.isBlocked) {
      return error(`Trop de tentatives incorrectes. Bloqué pendant encore ${rateCheck.minutesRemaining} minute(s).`, 429);
    }

    let restaurant: any = null;
    try {
      restaurant = await (prisma.restaurant as any).findUnique({
        where: { id: slug },
        include: { profile: true },
      });
      if (!restaurant) {
        restaurant = await (prisma.restaurant as any).findFirst({
          where: { status: 'active' },
          include: { profile: true },
        });
      }
    } catch {
      // Fallback si BD injoignable
    }

    if (!restaurant) {
      return error('Restaurant introuvable.', 404);
    }

    const storedHash = restaurant?.profile?.staffPinHash;

    // Si un hash PIN a été configuré, on l'exige strictement ; sinon PIN 1234 par défaut
    const isValid = storedHash ? verifyPin(pin, storedHash) : pin === '1234';

    if (!isValid) {
      const currentFailures = (rateRecord?.failureCount || 0) + 1;
      staffRateLimitMap.set(rateKey, { failureCount: currentFailures, lastFailedAt: new Date() });
      return error('Code PIN incorrect.', 401);
    }

    // Réinitialiser les tentatives en cas de succès
    staffRateLimitMap.delete(rateKey);

    const res = success({ message: 'Authentification Staff réussie' });
    const staffToken = signSessionToken({
      userId: `staff_${restaurant.id}`,
      email: `staff@${restaurant.id}.local`,
      maxAgeSec: 12 * 60 * 60,
    });

    res.cookies.set('gs_staff_session', staffToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60, // 12 heures
    });

    return res;
  } catch (err: any) {
    return error(err.message || 'Erreur authentification', 500);
  }
}
