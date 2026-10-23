import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { logAudit } from '@/server/lib/audit';
import { resolveActiveRestaurant } from '@/server/lib/resolve-restaurant';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const VALID_PLATFORMS = ['instagram', 'facebook', 'google_business'] as const;
type PlatformId = (typeof VALID_PLATFORMS)[number];

const CreateOfferSchema = z.object({
  restaurantId: z.string().optional(),
  title: z.string().min(2, 'Le nom de l’offre doit comporter au moins 2 caractères.').optional(),
  name: z.string().min(2, 'Le nom de l’offre doit comporter au moins 2 caractères.').optional(),
  description: z.string().min(3, 'La description doit comporter au moins 3 caractères.'),
  discountValue: z.string().optional(),
  discount: z.string().optional(),
  period: z.string().optional(),
  recurrence: z.string().optional(),
  recurrenceDays: z.array(z.string()).optional(),
  status: z.enum(['active', 'scheduled', 'draft', 'archived']).optional().default('active'),
  image: z.string().optional(),
  platforms: z.array(z.enum(VALID_PLATFORMS)).optional(),
});

const UpdateOfferSchema = z.object({
  id: z.string().min(1, 'Identifiant de l’offre manquant.'),
  title: z.string().min(2, 'Le nom de l’offre doit comporter au moins 2 caractères.').optional(),
  name: z.string().min(2, 'Le nom de l’offre doit comporter au moins 2 caractères.').optional(),
  description: z.string().min(3, 'La description doit comporter au moins 3 caractères.').optional(),
  discountValue: z.string().optional(),
  discount: z.string().optional(),
  period: z.string().optional(),
  status: z.enum(['active', 'scheduled', 'draft', 'archived']).optional(),
  image: z.string().nullable().optional(),
  platforms: z.array(z.enum(VALID_PLATFORMS)).optional(),
});

/**
 * Encode les métadonnées UI (plateformes & image) dans recurrenceDays (TEXT[])
 * pour éviter toute migration de colonne tout en restant 100% atomique en base.
 */
function encodeOfferMeta(
  platforms?: PlatformId[],
  image?: string | null,
  rawDays?: string[]
): string[] {
  const encoded: string[] = [];
  const effectivePlatforms =
    platforms && platforms.length > 0 ? platforms : (['instagram', 'facebook'] as PlatformId[]);

  for (const p of effectivePlatforms) {
    encoded.push(`platform:${p}`);
  }
  if (image && image.trim().length > 0) {
    encoded.push(`image:${image.trim()}`);
  }
  if (Array.isArray(rawDays)) {
    for (const d of rawDays) {
      if (!d.startsWith('platform:') && !d.startsWith('image:')) {
        encoded.push(d);
      }
    }
  }
  return encoded;
}

/**
 * Transforme un enregistrement Prisma Offer en objet unifié prêt pour le frontend.
 */
function serializeOffer(dbOffer: any) {
  const days: string[] = Array.isArray(dbOffer.recurrenceDays) ? dbOffer.recurrenceDays : [];

  const platforms = days
    .filter((d) => typeof d === 'string' && d.startsWith('platform:'))
    .map((d) => d.slice('platform:'.length))
    .filter((p): p is PlatformId => (VALID_PLATFORMS as readonly string[]).includes(p));

  const imageEntry = days.find((d) => typeof d === 'string' && d.startsWith('image:'));
  const image = imageEntry ? imageEntry.slice('image:'.length) : undefined;

  let period = dbOffer.recurrence || 'Toute la semaine';
  if (period === 'none') period = 'Toute la semaine';
  else if (period === 'daily') period = 'Tous les jours';
  else if (period === 'weekly') period = 'Chaque semaine';
  else if (period === 'monthly') period = 'Chaque mois';

  return {
    id: dbOffer.id,
    restaurantId: dbOffer.restaurantId,
    name: dbOffer.title,
    title: dbOffer.title,
    description: dbOffer.description || '',
    discount: dbOffer.discountValue || '',
    discountValue: dbOffer.discountValue || '',
    period,
    status: (dbOffer.status || 'active') as 'active' | 'scheduled' | 'draft' | 'archived',
    image,
    platforms: platforms.length > 0 ? platforms : (['instagram', 'facebook'] as PlatformId[]),
    createdAt: dbOffer.createdAt,
    updatedAt: dbOffer.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedRestId = searchParams.get('restaurantId');
    const restaurant = await resolveActiveRestaurant(req, requestedRestId, { profile: false });

    if (!restaurant) {
      return success([]);
    }

    const offers = await (prisma as any).offer.findMany({
      where: {
        restaurantId: restaurant.id,
        status: { not: 'archived' },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(offers.map(serializeOffer));
  } catch (err: any) {
    console.error('[OFFERS_GET_ERROR]', err);
    return error('Impossible de charger vos offres pour le moment.', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateOfferSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Les données de l’offre sont invalides.', 400);
    }

    const data = validated.data;
    const finalTitle = (data.title || data.name || '').trim();
    if (finalTitle.length < 2) {
      return error('Veuillez saisir un nom pour votre offre (minimum 2 caractères).', 400);
    }

    const restaurant = await resolveActiveRestaurant(req, data.restaurantId, { profile: false });
    if (!restaurant) {
      return error('Aucun établissement actif trouvé.', 404);
    }

    const created = await (prisma as any).offer.create({
      data: {
        restaurantId: restaurant.id,
        title: finalTitle,
        description: data.description.trim(),
        discountValue: (data.discountValue ?? data.discount ?? '').trim() || null,
        recurrence: (data.period || data.recurrence || 'Toute la semaine').trim(),
        recurrenceDays: encodeOfferMeta(data.platforms, data.image, data.recurrenceDays),
        status: data.status || 'active',
      },
    });

    await logAudit({
      restaurantId: restaurant.id,
      action: 'offer.create',
      entityType: 'offer',
      entityId: created.id,
      details: { title: finalTitle, status: created.status },
    });

    return success(serializeOffer(created), 201);
  } catch (err: any) {
    console.error('[OFFERS_POST_ERROR]', err);
    return error('Impossible d’enregistrer cette offre pour le moment. Veuillez réessayer.', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = UpdateOfferSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Modifications invalides.', 400);
    }

    const data = validated.data;
    const existing = await (prisma as any).offer.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      return error('Cette offre est introuvable ou a déjà été supprimée.', 404);
    }

    const currentSerialized = serializeOffer(existing);
    const updates: Record<string, any> = {};

    const nextTitle = data.title ?? data.name;
    if (nextTitle !== undefined) updates.title = nextTitle.trim();
    if (data.description !== undefined) updates.description = data.description.trim();
    if (data.discountValue !== undefined || data.discount !== undefined) {
      updates.discountValue = (data.discountValue ?? data.discount ?? '').trim() || null;
    }
    if (data.period !== undefined) {
      updates.recurrence = data.period.trim() || 'Toute la semaine';
    }
    if (data.status !== undefined) {
      updates.status = data.status;
    }

    if (data.platforms !== undefined || data.image !== undefined) {
      const nextPlatforms = data.platforms ?? currentSerialized.platforms;
      const nextImage = data.image !== undefined ? data.image : currentSerialized.image;
      updates.recurrenceDays = encodeOfferMeta(nextPlatforms, nextImage);
    }

    const updated = await (prisma as any).offer.update({
      where: { id: data.id },
      data: updates,
    });

    await logAudit({
      restaurantId: existing.restaurantId,
      action: 'offer.update',
      entityType: 'offer',
      entityId: updated.id,
      details: updates,
    });

    return success(serializeOffer(updated));
  } catch (err: any) {
    console.error('[OFFERS_PATCH_ERROR]', err);
    return error('Impossible de mettre à jour cette offre pour le moment.', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id) {
      return error('Identifiant de l’offre requis pour la suppression.', 400);
    }

    const existing = await (prisma as any).offer.findUnique({ where: { id } });
    if (!existing) {
      return error('Cette offre est introuvable ou déjà supprimée.', 404);
    }

    await (prisma as any).offer.delete({ where: { id } });

    await logAudit({
      restaurantId: existing.restaurantId,
      action: 'offer.delete',
      entityType: 'offer',
      entityId: id,
      details: { title: existing.title },
    });

    return success({ deletedId: id });
  } catch (err: any) {
    console.error('[OFFERS_DELETE_ERROR]', err);
    return error('Impossible de supprimer cette offre pour le moment.', 500);
  }
}
