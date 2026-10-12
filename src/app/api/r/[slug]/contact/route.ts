import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { saveCustomerContact } from '@/server/modules/contacts/service';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { offerId, type, value, consentText, source } = body;

    const restaurant = await (prisma.restaurant as any).findFirst({
      where: { status: 'active' },
    });

    if (!restaurant) {
      return error('Restaurant non trouvé', 404);
    }

    const contact = await saveCustomerContact({
      restaurantId: restaurant.id,
      offerId,
      type: type || 'email',
      value,
      consentText,
      source: source || 'qr_page',
    });

    return success({
      contactId: contact.id,
      message: 'Coordonnée enregistrée avec consentement.',
    });
  } catch (err: any) {
    console.error('Erreur enregistrement contact:', err);
    return error(err.message || 'Erreur lors du recueil du contact', 400);
  }
}
