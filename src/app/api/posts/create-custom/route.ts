import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { logAudit } from '@/server/lib/audit';
import { z } from 'zod';

const CreateCustomPostSchema = z.object({
  restaurantId: z.string(),
  sourceType: z.enum(['offer', 'event', 'custom']).default('custom'),
  sourceId: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional().default(''),
  discountValue: z.string().optional(),
  platform: z.enum(['instagram', 'facebook', 'google_business', 'tiktok']).default('instagram'),
  style: z.enum(['gourmet', 'festive', 'chic', 'deal']).default('gourmet'),
  imageUrl: z.string().optional(),
  customText: z.string().optional(),
  scheduledAt: z.string().optional(),
});

// Bibliothèque d'affiches et visuels thématiques haute définition
const THEMED_POSTERS: Record<string, string[]> = {
  burger: [
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
  ],
  pizza: [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80',
  ],
  cocktail: [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80',
  ],
  wings: [
    'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1527477378393-27c92881a798?auto=format&fit=crop&w=1200&q=80',
  ],
  event_sport: [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
  ],
  event_music: [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
  ],
  terrace: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  ],
  general: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
  ],
};

function pickBestPoster(title: string, desc: string, style: string): { primary: string; alternatives: string[] } {
  const combined = `${title} ${desc} ${style}`.toLowerCase();

  let category = 'general';
  if (combined.includes('burger') || combined.includes('smash')) category = 'burger';
  else if (combined.includes('pizza') || combined.includes('calzone')) category = 'pizza';
  else if (combined.includes('cocktail') || combined.includes('bar') || combined.includes('happy hour') || combined.includes('bière')) category = 'cocktail';
  else if (combined.includes('wing') || combined.includes('poulet') || combined.includes('tapas')) category = 'wings';
  else if (combined.includes('match') || combined.includes('foot') || combined.includes('psg') || combined.includes('sport')) category = 'event_sport';
  else if (combined.includes('concert') || combined.includes('musique') || combined.includes('live') || combined.includes('dj')) category = 'event_music';
  else if (combined.includes('terrasse') || combined.includes('soleil') || combined.includes('patio')) category = 'terrace';

  const list = THEMED_POSTERS[category] || THEMED_POSTERS.general;
  return {
    primary: list[0],
    alternatives: [...list.slice(1), ...THEMED_POSTERS.general],
  };
}

function generateCopywriting(params: {
  restaurantName: string;
  address: string;
  sourceType: string;
  title: string;
  description: string;
  discountValue?: string;
  platform: string;
  style: string;
}): { caption: string; hook: string; cta: string; hashtags: string[] } {
  const { restaurantName, address, sourceType, title, description, discountValue, platform, style } = params;
  const cleanRestTag = '#' + restaurantName.replace(/[^a-zA-Z0-9]/g, '');

  let hook = '';
  let cta = `Rendez-vous chez ${restaurantName} (${address}).`;

  if (sourceType === 'offer') {
    const discountText = discountValue ? ` avec ${discountValue}` : '';
    hook = `OFFRE DU JOUR : ${title} !`;
    cta = `Offre valable aujourd'hui ! Réservez votre table ou venez directement au comptoir chez ${restaurantName}.`;
  } else if (sourceType === 'event') {
    hook = `ÉVÉNEMENT : ${title} !`;
    cta = `Les places partent vite ! Réservez votre table dès maintenant chez ${restaurantName} (${address}).`;
  } else {
    hook = `Coup de cœur du chef : ${title} !`;
    cta = `Venez déguster cette spécialité ce midi ou ce soir chez ${restaurantName}.`;
  }

  const details = description ? `\n\n${description}` : '';
  const discountLine = discountValue ? `\n\nFormule exclusive : ${discountValue}` : '';

  const hashtags = [
    cleanRestTag,
    '#restaurant',
    sourceType === 'event' ? '#evenement' : '#foodie',
    '#bonneadresse',
    style === 'festive' ? '#soiree' : '#faitmaison',
  ];

  const fullCaption = `${hook}${details}${discountLine}\n\nAdresse : ${address}\n${cta}\n\n${hashtags.join(' ')}`;

  return {
    caption: fullCaption,
    hook,
    cta,
    hashtags,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateCustomPostSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Paramètres de création invalides', 400);
    }

    const {
      restaurantId,
      sourceType,
      sourceId,
      title,
      description,
      discountValue,
      platform,
      style,
      imageUrl: customImageUrl,
      customText,
      scheduledAt,
    } = validated.data;

    // Récupérer le restaurant
    let restaurant = await (prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      include: { profile: true },
    });

    if (!restaurant) {
      restaurant = await (prisma as any).restaurant.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      });
    }

    const restaurantName = restaurant?.name || 'Le Bistrot';
    const address = restaurant?.address || 'Centre-ville';

    // Choix de l'affiche et de la légende
    const posterSelection = pickBestPoster(title, description, style);
    const finalImageUrl = customImageUrl || posterSelection.primary;

    const copyResult = generateCopywriting({
      restaurantName,
      address,
      sourceType,
      title,
      description,
      discountValue,
      platform,
      style,
    });

    const finalCaption = customText?.trim() ? customText.trim() : copyResult.caption;

    // Sauvegarde en base de données
    const post = await (prisma as any).post.create({
      data: {
        restaurantId: restaurant?.id || restaurantId,
        platform,
        text: finalCaption,
        imageUrl: finalImageUrl,
        status: scheduledAt ? 'scheduled' : 'pending_approval',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        verifiedFacts: [title, description, discountValue, restaurantName, address].filter(Boolean),
      },
    });

    await logAudit({
      restaurantId: restaurant?.id || restaurantId,
      action: 'post.custom_create',
      entityType: 'post',
      entityId: post.id,
      details: {
        sourceType,
        sourceId,
        title,
        platform,
        style,
      },
    });

    return success(
      {
        post,
        generatedData: {
          title,
          hook: copyResult.hook,
          caption: finalCaption,
          imageUrl: finalImageUrl,
          alternativeImages: posterSelection.alternatives,
          hashtags: copyResult.hashtags,
          discountValue: discountValue || null,
          platform,
        },
      },
      201
    );
  } catch (err: any) {
    return error(err.message, 500);
  }
}
