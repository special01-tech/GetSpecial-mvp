import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { logAudit } from '@/server/lib/audit';
import { resolveActiveRestaurant } from '@/server/lib/resolve-restaurant';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = ['concert', 'sport', 'festival', 'special_day', 'culture'] as const;

const CreateManualEventSchema = z.object({
  restaurantId: z.string().optional(),
  title: z.string().min(2, 'Le titre de l’événement doit comporter au moins 2 caractères.'),
  description: z.string().optional().default(''),
  date: z.string().optional(),
  time: z.string().optional(),
  dateTime: z.string().optional(),
  category: z.enum(VALID_CATEGORIES).optional().default('culture'),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  intensity: z.number().min(0).max(1).default(1.0),
});

const UpdateManualEventSchema = z.object({
  id: z.string().min(1, 'Identifiant de l’événement manquant.'),
  title: z.string().min(2, 'Le titre doit comporter au moins 2 caractères.').optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
  imageUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Normalise une date/heure saisie en objet Date ISO valide.
 */
function parseEventTimestamp(date?: string, time?: string, dateTime?: string): {
  isoString: string;
  dateStr: string;
  timeStr: string;
  parsedDate: Date;
} | null {
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    const cleanDate = date.trim();
    const cleanTime = time && /^\d{2}:\d{2}/.test(time.trim()) ? time.trim().slice(0, 5) : '20:00';
    const d = new Date(`${cleanDate}T${cleanTime}:00`);
    if (!isNaN(d.getTime())) {
      return {
        isoString: d.toISOString(),
        dateStr: cleanDate,
        timeStr: cleanTime,
        parsedDate: d,
      };
    }
  }

  if (dateTime) {
    const normalized = dateTime.trim().replace(' ', 'T');
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) {
      const iso = d.toISOString();
      return {
        isoString: iso,
        dateStr: iso.slice(0, 10),
        timeStr: time?.trim() || iso.slice(11, 16),
        parsedDate: d,
      };
    }
  }

  return null;
}

/**
 * Convertit un Signal manuel en objet RestaurantEvent exploitable par l'UI.
 */
function serializeManualEvent(signal: any) {
  const data = (signal.data as Record<string, any>) || {};
  const rawStartsAt = signal.startsAt || data.timestamp;
  let dateStr = data.date || '';
  let timeStr = data.time || '';

  if ((!dateStr || !timeStr) && rawStartsAt) {
    const d = new Date(rawStartsAt);
    if (!isNaN(d.getTime())) {
      if (!dateStr) dateStr = d.toISOString().slice(0, 10);
      if (!timeStr) timeStr = d.toISOString().slice(11, 16);
    }
  }

  const cat = signal.category || data.category || 'culture';
  const validCategory = (VALID_CATEGORIES as readonly string[]).includes(cat) ? cat : 'culture';

  return {
    id: signal.id,
    restaurantId: signal.restaurantId,
    title: data.title || 'Événement du restaurant',
    date: dateStr,
    time: timeStr || undefined,
    category: validCategory,
    imageUrl: data.imageUrl || undefined,
    description: data.description ?? data.summary ?? '',
    isActive: signal.status !== 'paused' && signal.status !== 'inactive',
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

    const signals = await (prisma as any).signal.findMany({
      where: {
        restaurantId: restaurant.id,
        type: 'event',
        source: 'manual',
      },
      orderBy: { detectedAt: 'desc' },
      take: 50,
    });

    return success(signals.map(serializeManualEvent));
  } catch (err: any) {
    console.error('[MANUAL_EVENTS_GET_ERROR]', err);
    return error('Impossible de charger vos événements pour le moment.', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateManualEventSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Les informations de l’événement sont invalides.', 400);
    }

    const input = validated.data;
    const parsedTs = parseEventTimestamp(input.date, input.time, input.dateTime);
    if (!parsedTs) {
      return error('Veuillez choisir une date valide (format JJ/MM/AAAA) pour votre événement.', 400);
    }

    const restaurant = await resolveActiveRestaurant(req, input.restaurantId, { profile: false });
    if (!restaurant) {
      return error('Aucun établissement actif trouvé.', 404);
    }

    const cleanDescription = input.description.trim();
    const summary = cleanDescription || `Événement au restaurant : ${input.title.trim()}`;

    const signal = await (prisma as any).signal.create({
      data: {
        restaurantId: restaurant.id,
        type: 'event',
        category: input.category,
        source: 'manual',
        intensity: input.intensity,
        startsAt: parsedTs.parsedDate,
        detectedAt: new Date(),
        status: input.isActive ? 'active' : 'paused',
        data: {
          title: input.title.trim(),
          summary,
          description: cleanDescription,
          date: parsedTs.dateStr,
          time: parsedTs.timeStr,
          timestamp: parsedTs.isoString,
          category: input.category,
          imageUrl: input.imageUrl?.trim() || undefined,
          raw: { manual: true },
        },
      },
    });

    await logAudit({
      restaurantId: restaurant.id,
      action: 'event.manual_create',
      entityType: 'signal',
      entityId: signal.id,
      details: { title: input.title, date: parsedTs.dateStr, time: parsedTs.timeStr },
    });

    return success(serializeManualEvent(signal), 201);
  } catch (err: any) {
    console.error('[MANUAL_EVENTS_POST_ERROR]', err);
    return error('Impossible d’ajouter cet événement pour le moment. Veuillez réessayer.', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = UpdateManualEventSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Modifications invalides.', 400);
    }

    const input = validated.data;
    const existing = await (prisma as any).signal.findUnique({
      where: { id: input.id },
    });

    if (!existing) {
      return error('Cet événement est introuvable ou a déjà été supprimé.', 404);
    }

    const currentData = (existing.data as Record<string, any>) || {};
    const nextDate = input.date ?? currentData.date;
    const nextTime = input.time ?? currentData.time;
    const parsedTs = parseEventTimestamp(nextDate, nextTime, currentData.timestamp);

    if (input.date !== undefined && !parsedTs) {
      return error('Veuillez choisir une date valide pour cet événement.', 400);
    }

    const nextTitle = input.title !== undefined ? input.title.trim() : currentData.title;
    const nextDesc =
      input.description !== undefined ? input.description.trim() : (currentData.description ?? '');
    const nextCategory = input.category ?? existing.category ?? currentData.category ?? 'culture';
    const nextImageUrl =
      input.imageUrl !== undefined ? input.imageUrl?.trim() || undefined : currentData.imageUrl;

    const updatedData = {
      ...currentData,
      title: nextTitle,
      description: nextDesc,
      summary: nextDesc || `Événement au restaurant : ${nextTitle}`,
      date: parsedTs ? parsedTs.dateStr : nextDate,
      time: parsedTs ? parsedTs.timeStr : nextTime,
      timestamp: parsedTs ? parsedTs.isoString : currentData.timestamp,
      category: nextCategory,
      imageUrl: nextImageUrl,
    };

    const signalUpdates: Record<string, any> = {
      category: nextCategory,
      data: updatedData,
    };

    if (parsedTs) {
      signalUpdates.startsAt = parsedTs.parsedDate;
    }
    if (input.isActive !== undefined) {
      signalUpdates.status = input.isActive ? 'active' : 'paused';
    }

    const updated = await (prisma as any).signal.update({
      where: { id: input.id },
      data: signalUpdates,
    });

    await logAudit({
      restaurantId: existing.restaurantId,
      action: 'event.manual_update',
      entityType: 'signal',
      entityId: updated.id,
      details: { title: nextTitle, status: updated.status },
    });

    return success(serializeManualEvent(updated));
  } catch (err: any) {
    console.error('[MANUAL_EVENTS_PATCH_ERROR]', err);
    return error('Impossible de modifier cet événement pour le moment.', 500);
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
      return error('Identifiant de l’événement requis.', 400);
    }

    const existing = await (prisma as any).signal.findUnique({ where: { id } });
    if (!existing) {
      return error('Cet événement est introuvable ou déjà supprimé.', 404);
    }

    await (prisma as any).signal.delete({ where: { id } });

    await logAudit({
      restaurantId: existing.restaurantId,
      action: 'event.manual_delete',
      entityType: 'signal',
      entityId: id,
      details: { title: (existing.data as any)?.title },
    });

    return success({ deletedId: id });
  } catch (err: any) {
    console.error('[MANUAL_EVENTS_DELETE_ERROR]', err);
    return error('Impossible de supprimer cet événement pour le moment.', 500);
  }
}
