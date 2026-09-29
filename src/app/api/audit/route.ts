import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    const logs = await (prisma as any).auditLog.findMany({
      where: restaurantId ? { restaurantId } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return success(logs);
  } catch (err: any) {
    return error(err.message, 500);
  }
}
