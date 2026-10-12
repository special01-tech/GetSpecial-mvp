import { prisma } from '@/server/db/prisma.client';

export interface RecordPublicationParams {
  restaurantId: string;
  postId: string;
  platform: string;
  outstandPostId?: string;
  sendIdempotencyKey: string;
  status: 'pending' | 'published' | 'failed';
  lastError?: string;
}

export async function recordPublication(params: RecordPublicationParams) {
  return (prisma.publication as any).create({
    data: {
      restaurantId: params.restaurantId,
      postId: params.postId,
      platform: params.platform,
      outstandPostId: params.outstandPostId || null,
      sendIdempotencyKey: params.sendIdempotencyKey,
      status: params.status,
      lastError: params.lastError || null,
      publishedAt: params.status === 'published' ? new Date() : null,
    },
  });
}
