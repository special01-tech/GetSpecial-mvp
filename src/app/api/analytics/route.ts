import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    // 1. Tenter l'intégration API Zernio si configurée
    const apiKey = process.env.ZERNIO_API_KEY;
    const baseUrl = process.env.ZERNIO_API_BASE_URL || 'https://api.zernio.com/v1';

    if (apiKey && apiKey.startsWith('sk_')) {
      try {
        const res = await fetch(`${baseUrl}/analytics`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          next: { revalidate: 60 },
        });

        if (res.ok) {
          const data = await res.json();
          const posts = data.posts || [];
          const accounts = data.accounts || [];
          const primaryAccount = accounts[0] || null;

          let totalViews = 0;
          let totalReach = 0;
          let totalLikes = 0;
          let totalComments = 0;
          let totalShares = 0;

          const mappedPosts = posts.map((p: any) => {
            const a = p.analytics || {};
            const views = Number(a.views || 0);
            const reach = Number(a.reach || 0);
            const likes = Number(a.likes || 0);
            const comments = Number(a.comments || 0);
            const shares = Number(a.shares || 0);

            totalViews += views;
            totalReach += reach;
            totalLikes += likes;
            totalComments += comments;
            totalShares += shares;

            return {
              id: p._id,
              content: p.content,
              platform: p.platform || 'instagram',
              publishedAt: p.publishedAt,
              views,
              reach,
              likes,
              comments,
              shares,
              engagementRate: a.engagementRate || 0,
              url: p.platformPostUrl || null,
              thumbnailUrl: p.thumbnailUrl || null,
            };
          });

          const totalEngagements = totalLikes + totalComments + totalShares;
          const avgEngagementRate = totalViews > 0 ? Number(((totalEngagements / totalViews) * 100).toFixed(2)) : 0;

          return success({
            isReal: true,
            source: 'API Zernio',
            platform: primaryAccount?.platform || 'instagram',
            accountUsername: primaryAccount?.username || '',
            followersCount: primaryAccount?.followersCount || 0,
            overview: {
              totalViews,
              totalReach,
              totalLikes,
              totalComments,
              totalShares,
              engagementRate: avgEngagementRate,
              publishedPosts: posts.length,
              lastSync: data.overview?.lastSync || new Date().toISOString(),
            },
            posts: mappedPosts,
          });
        }
      } catch (err) {
        console.warn('[ANALYTICS_ZERNIO_WARNING] Failed to fetch external Zernio analytics:', err);
      }
    }

    // 2. Agrégation RÉELLE depuis la base de données locale (Zéro faux chiffres inventés)
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
