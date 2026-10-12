import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const restaurant = await (prisma.restaurant as any).findFirst({
      where: { status: 'active' },
    });

    if (!restaurant) {
      return success({
        proposals: [],
        publications: [],
      });
    }

    const [opportunities, feedbackEvents, publications] = await Promise.all([
      (prisma.opportunity as any).findMany({
        where: { restaurantId: restaurant.id },
        include: {
          posts: true,
          signal: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma.feedbackEvent as any).findMany({
        where: { restaurantId: restaurant.id },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma.publication as any).findMany({
        where: { restaurantId: restaurant.id },
        include: {
          post: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Map des feedback pour chaque proposition
    const feedbackMap = new Map<string, any>();
    feedbackEvents.forEach((fb: any) => {
      if (fb.opportunityId) {
        feedbackMap.set(fb.opportunityId, fb);
      }
    });

    // Formater les propositions avec leur statut (confirmé / infirmé / en attente)
    const formattedProposals = opportunities.map((opp: any) => {
      const fb = feedbackMap.get(opp.id);
      let status: 'confirmed' | 'rejected' | 'pending' = 'pending';
      let rejectionReason = null;

      if (opp.status === 'dismissed' || (fb && fb.type === 'dismiss_opportunity')) {
        status = 'rejected';
        rejectionReason = fb?.reason || 'Non retenue par le gérant';
      } else if (opp.status === 'approved' || (opp.posts && opp.posts.some((p: any) => p.status === 'approved' || p.status === 'published'))) {
        status = 'confirmed';
      }

      return {
        id: opp.id,
        title: opp.title,
        description: opp.description,
        urgency: opp.urgency,
        createdAt: opp.createdAt,
        status,
        rejectionReason,
        postsCount: opp.posts?.length || 0,
      };
    });

    // Formater les publications avec plateformes et canaux
    const formattedPublications = publications.map((pub: any) => ({
      id: pub.id,
      platform: pub.platform, // instagram, facebook, google_business, etc.
      status: pub.status,     // published, pending, failed
      publishedAt: pub.publishedAt || pub.createdAt,
      postTitle: pub.post?.title || 'Publication GetSpecial',
      postText: pub.post?.text || '',
      imageUrl: pub.post?.imageUrl || null,
      lastError: pub.lastError || null,
    }));

    return success({
      proposals: formattedProposals,
      publications: formattedPublications,
    });
  } catch (err: any) {
    console.error('Erreur API history:', err);
    return error(err.message || 'Erreur interne lors de la récupération de l\'historique', 500);
  }
}
