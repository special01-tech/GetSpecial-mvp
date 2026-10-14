import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { verifyPin, evaluatePinRateLimit } from '@/server/modules/auth-pin/domain';

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
      restaurant = await (prisma.restaurant as any).findFirst({
        where: { status: 'active' },
        include: { profile: true },
      });
    } catch {
      // Fallback si BD injoignable
    }

    const storedHash = restaurant?.profile?.staffPinHash;

    // PIN 1234 par défaut ou vérification du hash configuré
    const isValid = (pin === '1234') || (storedHash ? verifyPin(pin, storedHash) : false);

    if (!isValid) {
      // Incrémenter le compteur d'échecs
      const currentFailures = (rateRecord?.failureCount || 0) + 1;
      staffRateLimitMap.set(rateKey, { failureCount: currentFailures, lastFailedAt: new Date() });
      return error('Code PIN incorrect (Code par défaut : 1234).', 401);
    }

    // Réinitialiser les tentatives en cas de succès
    staffRateLimitMap.delete(rateKey);

    const res = success({ message: 'Authentification Staff réussie' });
    // Déposer cookie de session httpOnly
    res.cookies.set('gs_staff_session', `staff_${restaurant.id}_${Date.now()}`, {
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
