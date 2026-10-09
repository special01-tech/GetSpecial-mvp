import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { directOAuthService, SupportedSocialPlatform } from '@/server/modules/social-oauth/direct-oauth.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId') || 'rest_demo_austin_1';

    const accounts = await (prisma as any).socialAccount.findMany({
      where: { restaurantId },
      select: {
        id: true,
        restaurantId: true,
        platform: true,
        username: true,
        status: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });

    return success(accounts);
  } catch (err: any) {
    return error(err.message, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, platform } = body;

    if (!restaurantId || !platform) {
      return error('restaurantId et platform requis', 400);
    }

    const disconnected = await directOAuthService.disconnect(
      restaurantId,
      platform as SupportedSocialPlatform
    );

    return success({ disconnected, platform });
  } catch (err: any) {
    return error(err.message, 500);
  }
}
