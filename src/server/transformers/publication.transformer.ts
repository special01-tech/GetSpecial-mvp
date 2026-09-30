/* =============================================================================
 * Publication Transformer
 *
 * Transforme les Posts et Publications Prisma en DTOs formatés pour le frontend.
 * ============================================================================= */

import type { PublicationDTO, SocialPlatform } from '@/types/dto';
import {
  formatDateShort,
  formatTimeShort,
  mapPostStatus,
  formatCompactNumber,
  DEFAULT_IMAGES,
} from './formatters';

interface PrismaPostWithRelations {
  id: string;
  text: string;
  imageUrl?: string | null;
  platform: string;
  status: string;
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
  createdAt: Date;
  publications?: {
    platform: string;
    status: string;
    publishedAt?: Date | null;
    feedbackEvents?: {
      type: string;
      value: number | null;
    }[];
  }[];
}

/** Transforme un Post Prisma en PublicationDTO */
export function transformPost(post: PrismaPostWithRelations): PublicationDTO {
  const targetDate = post.scheduledAt || post.publishedAt || post.createdAt;
  const dateFormatted = formatDateShort(targetDate);
  const timeFormatted = formatTimeShort(targetDate);
  const { status, label: statusLabel } = mapPostStatus(post.status);

  // Déduire les plateformes
  const platforms: SocialPlatform[] = [];
  if (post.platform) {
    platforms.push(post.platform as SocialPlatform);
  }
  if (post.publications) {
    for (const pub of post.publications) {
      if (pub.platform && !platforms.includes(pub.platform as SocialPlatform)) {
        platforms.push(pub.platform as SocialPlatform);
      }
    }
  }
  if (platforms.length === 0) {
    platforms.push('instagram');
  }

  // Calcul des métriques de feedback éventuelles
  let totalReach = 0;
  let totalInteractions = 0;
  if (post.publications) {
    for (const pub of post.publications) {
      if (pub.feedbackEvents) {
        for (const evt of pub.feedbackEvents) {
          if (evt.type === 'reach') totalReach += evt.value ?? 0;
          if (evt.type === 'engagement' || evt.type === 'click') totalInteractions += evt.value ?? 0;
        }
      }
    }
  }

  // Titre synthétique dérivé du premier segment du texte
  const title = post.text.split('\n')[0].replace(/[#*]/g, '').trim().slice(0, 50) || 'Publication';

  return {
    id: post.id,
    postId: post.id,
    title,
    text: post.text,
    date: dateFormatted,
    time: timeFormatted,
    fullDate: new Date(targetDate).toISOString(),
    status,
    statusLabel,
    image: post.imageUrl || DEFAULT_IMAGES.dish,
    platforms,
    reach: totalReach > 0 ? formatCompactNumber(totalReach) : undefined,
    interactions: totalInteractions > 0 ? formatCompactNumber(totalInteractions) : undefined,
  };
}
