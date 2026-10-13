import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    // Agrégation RÉELLE depuis la base de données locale (Zéro faux chiffres inventés)
    const restaurantWhere = restaurantId ? { restaurantId } : {};

    const [allPosts, allPublications] = await Promise.all([
      (prisma as any).post.findMany({
        where: restaurantWhere,
        orderBy: { createdAt: 'desc' },
      }),
      (prisma as any).publication.findMany({
        where: restaurantWhere,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPosts = allPosts.length;
    const publishedPosts = allPosts.filter((p: any) => p.status === 'published').length;
    const scheduledPosts = allPosts.filter((p: any) => p.status === 'scheduled').length;
    const pendingPosts = allPosts.filter((p: any) => p.status === 'pending_approval' || p.status === 'pending').length;

    // Calcul des posts de cette semaine
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekPosts = allPosts.filter((p: any) => new Date(p.createdAt) >= oneWeekAgo).length;

    return success({
      isReal: true,
      source: 'Base de données locale',
      overview: {
        totalPosts,
        publishedPosts,
        scheduledPosts,
        pendingPosts,
        thisWeek: thisWeekPosts,
        totalViews: 0,
        totalReach: 0,
        totalLikes: 0,
        engagementRate: 0,
        followersCount: 0,
        lastSync: new Date().toISOString(),
      },
      posts: allPosts.map((p: any) => ({
        id: p.id,
        content: p.text || p.content || '',
        platform: p.platform || 'instagram',
        status: p.status,
        createdAt: p.createdAt,
        scheduledAt: p.scheduledAt || null,
      })),
      publications: allPublications,
    });
  } catch (err: any) {
    return error(`Erreur analytics: ${err.message}`, 500);
  }
}
