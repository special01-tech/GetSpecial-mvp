import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return error('restaurantId requis', 400);
    }

    const accounts = await (prisma as any).socialAccount.findMany({
      where: { restaurantId },
    });

    return success(accounts);
  } catch (err: any) {
    return error(err.message, 500);
  }
}
