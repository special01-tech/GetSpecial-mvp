import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const contact = (body.contact || '').trim();

    if (!contact || contact.length < 5) {
      return error('Veuillez renseigner une adresse email ou un numéro de téléphone valide.', 400);
    }

    // Validation simple email ou téléphone
    const isEmail = contact.includes('@') && contact.includes('.');
    const isPhone = /^[+0-9\s.-]{8,20}$/.test(contact);

    if (!isEmail && !isPhone) {
      return error('Format invalide : veuillez entrer un email (ex: vous@exemple.com) ou un téléphone.', 400);
    }

    const restaurant = await (prisma as any).restaurant.findFirst({
      where: {
        OR: [
          { id: slug },
          { name: { contains: slug, mode: 'insensitive' } },
        ],
      },
    });

    if (!restaurant) {
      return error('Établissement introuvable.', 404);
    }

    // Éviter les doublons récents (moins de 24h)
    const existing = await (prisma as any).feedbackEvent.findFirst({
      where: {
        restaurantId: restaurant.id,
        type: 'contact_optin',
        reason: contact,
      },
    });

    if (!existing) {
      await (prisma as any).feedbackEvent.create({
        data: {
          restaurantId: restaurant.id,
          type: 'contact_optin',
          reason: contact,
          value: 1,
          status: 'active',
        },
      });
    }

    return success({ message: 'Merci ! Votre contact a bien été enregistré.' });
  } catch (err: any) {
    console.error('[CONTACT_OPTIN_ERROR]', err);
    return error(err.message || 'Erreur lors de l\'enregistrement', 500);
  }
}
