import { prisma } from '@/server/db/prisma.client';
import { SaveContactParams, validateContact } from './domain';

export async function saveCustomerContact(params: SaveContactParams) {
  const check = validateContact(params);
  if (!check.isValid) {
    throw new Error(check.error);
  }

  return ((prisma as any).customerContact).create({
    data: {
      restaurantId: params.restaurantId,
      offerId: params.offerId || null,
      type: params.type,
      value: params.value.trim(),
      consentText: params.consentText,
      source: params.source || 'qr_page',
    },
  });
}

export async function exportContactsCsv(restaurantId: string): Promise<string> {
  const contacts = await ((prisma as any).customerContact).findMany({
    where: { restaurantId, unsubscribed: false },
    orderBy: { createdAt: 'desc' },
  });

  const header = 'id,type,value,consent_text,created_at\n';
  const rows = contacts.map((c: any) => 
    `"${c.id}","${c.type}","${c.value}","${(c.consentText || '').replace(/"/g, '""')}","${c.createdAt.toISOString()}"`
  ).join('\n');

  return header + rows;
}
