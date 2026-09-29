import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { logAudit } from '@/server/lib/audit';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const account = await (prisma as any).socialAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return error('Compte introuvable', 404);
    }

    await (prisma as any).socialAccount.delete({
      where: { id },
    });

    await logAudit({
      restaurantId: account.restaurantId,
      action: 'social.disconnect',
      entityType: 'social_account',
      entityId: id,
      details: { platform: account.platform },
    });

    return success({ disconnected: true, id });
  } catch (err: any) {
    return error(err.message, 500);
  }
}
