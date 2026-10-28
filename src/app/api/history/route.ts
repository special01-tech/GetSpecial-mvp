import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { resolveActiveRestaurant } from '@/server/lib/resolve-restaurant';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedId = searchParams.get('restaurantId');

    const restaurant = await resolveActiveRestaurant(req, requestedId, { profile: false });

    if (!restaurant) {
      return success({
        proposals: [],
        publications: [],
      });
    }

    const [opportunities, feedbackEvents, publications, posts] = await Promise.all([
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
      (prisma.post as any).findMany({
        where: { restaurantId: restaurant.id },
        include: {
          opportunity: true,
          publications: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
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

    // Formater toutes les affiches et posts générés
    const formattedPosters = posts.map((post: any) => {
      const payload = post.generationPayload || {};
      return {
        id: post.id,
        title: post.headline || post.opportunity?.title || 'Affiche GetSpecial',
        headline: post.headline || '',
        text: post.text || post.instagramCaption || post.facebookCaption || '',
        instagramCaption: post.instagramCaption || post.text || '',
        facebookCaption: post.facebookCaption || post.text || '',
        hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
        imageUrl: post.imageUrl || (post.mediaUrls && post.mediaUrls[0]) || null,
        mediaUrls: post.mediaUrls || [],
        aspectRatio: post.aspectRatio || '4:5',
        platform: post.platform || 'instagram',
        status: post.status || 'ready',
        origin: post.origin || 'generated',
        campaignType: post.campaignType || 'promotion',
        createdAt: post.createdAt,
        daFamilyId: payload.da_family_id || null,
        daFamilyName: payload.da_family_name || payload.advertising_concept?.poster_family || null,
        servingTemperature: payload.serving_temperature || null,
        materials: Array.isArray(payload.materials) ? payload.materials : [],
        variety: payload.variety || null,
        opportunityTitle: post.opportunity?.title || null,
        isPublished: (post.publications && post.publications.length > 0) || post.status === 'published',
        publicationsCount: post.publications?.length || 0,
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
      posters: formattedPosters,
      proposals: formattedProposals,
      publications: formattedPublications,
    });
  } catch (err: any) {
    console.error('Erreur API history:', err);
    return error(err.message || 'Erreur interne lors de la récupération de l\'historique', 500);
  }
}
