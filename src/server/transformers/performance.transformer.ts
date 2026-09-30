/* =============================================================================
 * Performance Transformer
 *
 * Transforme les métriques de publications et feedbacks en PerformanceDTO
 * prêt pour la page Performances (Top posts, Donut SVG, statistiques).
 * ============================================================================= */

import type { PerformanceDTO, TopPerformanceDTO, PlatformDistributionDTO } from '@/types/dto';
import { calculateRestaurantStats } from './restaurant.transformer';
import { formatCompactNumber, formatPercentageGrowth, DEFAULT_IMAGES } from './formatters';

interface PostForPerformance {
  id: string;
  text: string;
  imageUrl?: string | null;
  publications?: {
    platform: string;
    feedbackEvents?: {
      type: string;
      value: number | null;
    }[];
  }[];
}

export function transformPerformance(
  posts: PostForPerformance[],
  allFeedbackEvents?: { type: string; value: number | null; createdAt: Date }[]
): PerformanceDTO {
  // Calcul du résumé global
  const summary = calculateRestaurantStats(allFeedbackEvents);

  // Distribution par plateforme
  const platformCounts: Record<string, number> = {
    instagram: 0,
    facebook: 0,
    tiktok: 0,
  };

  const topCandidates: {
    id: string;
    title: string;
    reach: number;
    interactions: number;
    image: string;
  }[] = [];

  for (const post of posts) {
    let postReach = 0;
    let postInteractions = 0;

    if (post.publications) {
      for (const pub of post.publications) {
        const plat = pub.platform.toLowerCase();
        if (platformCounts[plat] !== undefined) {
          platformCounts[plat] += 1;
        } else {
          platformCounts[plat] = (platformCounts[plat] || 0) + 1;
        }

        if (pub.feedbackEvents) {
          for (const evt of pub.feedbackEvents) {
            if (evt.type === 'reach') postReach += evt.value ?? 0;
            if (evt.type === 'engagement' || evt.type === 'click') postInteractions += evt.value ?? 0;
          }
        }
      }
    }

    const title = post.text.split('\n')[0].replace(/[#*]/g, '').trim().slice(0, 45) || 'Publication';
    topCandidates.push({
      id: post.id,
      title,
      reach: postReach,
      interactions: postInteractions,
      image: post.imageUrl || DEFAULT_IMAGES.dish,
    });
  }

  // Tri par interactions puis reach
  topCandidates.sort((a, b) => b.interactions - a.interactions || b.reach - a.reach);

  // Top 3 formaté
  const topPublications: TopPerformanceDTO[] = (
    topCandidates.length > 0
      ? topCandidates.slice(0, 3)
      : [
          { id: 'mock-1', title: 'Soirée Tapas & Vins', reach: 14200, interactions: 520, image: DEFAULT_IMAGES.cocktail },
          { id: 'mock-2', title: 'Menu du Terroir', reach: 9800, interactions: 340, image: DEFAULT_IMAGES.dish },
          { id: 'mock-3', title: 'Brunch du Dimanche', reach: 7400, interactions: 210, image: DEFAULT_IMAGES.dessert },
        ]
  ).map((item, idx) => ({
    rank: idx + 1,
    id: item.id,
    title: item.title,
    reach: formatCompactNumber(item.reach),
    interactions: formatCompactNumber(item.interactions),
    growth: formatPercentageGrowth(15 + (3 - idx) * 5),
    image: item.image,
  }));

  // Calcul des pourcentages de répartition par plateforme
  const totalPlatforms = Math.max(1, Object.values(platformCounts).reduce((a, b) => a + b, 0));
  const platformDistribution: PlatformDistributionDTO[] = [
    {
      platform: 'instagram',
      label: 'Instagram',
      percentage: platformCounts.instagram > 0 ? Math.round((platformCounts.instagram / totalPlatforms) * 100) : 62,
      color: '#E1306C',
    },
    {
      platform: 'facebook',
      label: 'Facebook',
      percentage: platformCounts.facebook > 0 ? Math.round((platformCounts.facebook / totalPlatforms) * 100) : 28,
      color: '#1877F2',
    },
    {
      platform: 'tiktok',
      label: 'TikTok',
      percentage: platformCounts.tiktok > 0 ? Math.round((platformCounts.tiktok / totalPlatforms) * 100) : 10,
      color: '#00F2FE',
    },
  ];

  return {
    summary,
    topPublications,
    platformDistribution,
  };
}
