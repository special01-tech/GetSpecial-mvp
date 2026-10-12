import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { verifyPin, evaluatePinRateLimit } from '@/server/modules/auth-pin/domain';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { pin } = body;

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateKey = `pin:staff:${slug}:${ip}`;

    // Vérification limitation des essais en base
    const rateRecord = await (prisma.rateLimitEntry as any).findUnique({
      where: { key: rateKey },
    });

    const rateCheck = evaluatePinRateLimit(
      rateRecord?.failureCount || 0,
      rateRecord?.lastFailedAt || null
    );

    if (rateCheck.isBlocked) {
      return error(`Trop de tentatives incorrectes. Bloqué pendant encore ${rateCheck.minutesRemaining} minute(s).`, 429);
    }

    const restaurant = await (prisma.restaurant as any).findFirst({
      where: { status: 'active' },
      include: { profile: true },
    });

    if (!restaurant) {
      return error('Restaurant non trouvé', 404);
    }

    const storedHash = restaurant.profile?.staffPinHash;

    // Si aucun PIN configuré, autoriser pour configuration initiale ou rejeter
    if (!storedHash) {
      return error('Aucun PIN Staff configuré. Veuillez contacter le gérant.', 403);
    }

    const isValid = verifyPin(pin, storedHash);

    if (!isValid) {
      // Incrémenter le compteur d'échecs
      await (prisma.rateLimitEntry as any).upsert({
        where: { key: rateKey },
        create: { key: rateKey, failureCount: 1, lastFailedAt: new Date() },
        update: { failureCount: { increment: 1 }, lastFailedAt: new Date() },
      });
      return error('Code PIN incorrect.', 401);
    }

    // Réinitialiser les tentatives en cas de succès
    await (prisma.rateLimitEntry as any).deleteMany({ where: { key: rateKey } });

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
