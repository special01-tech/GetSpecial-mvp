import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { resolveRequestUser } from '@/server/lib/session';

const ORDERED_DAYS_FR = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

/**
 * Résout l'établissement actif à partir d'un identifiant explicite,
 * de la session utilisateur authentifiée ou du dernier établissement actif.
 */
export async function resolveActiveRestaurant(
  req: NextRequest,
  requestedId?: string | null,
  include: Record<string, any> = { profile: true }
) {
  const cleanId = requestedId?.trim();

  // 1. Recherche directe par ID réel si fourni
  if (cleanId && cleanId !== 'current' && cleanId !== 'default') {
    const byId = await (prisma as any).restaurant.findUnique({
      where: { id: cleanId },
      include,
    });
    if (byId) return byId;
  }

  // 2. Recherche via l'utilisateur connecté en session
  const sessionUser = await resolveRequestUser(req);
  if (sessionUser?.userId) {
    const byUser = await (prisma as any).restaurant.findFirst({
      where: { userId: sessionUser.userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      include,
    });
    // Si l'utilisateur est authentifié, on ne renvoie JAMAIS le restaurant d'un tiers
    return byUser || null;
  }

  // 3. Mode dev / fallback local uniquement si aucune session n'est active
  const isLocalDev = process.env.NODE_ENV !== 'production' || process.env.USE_LOCAL_DB === 'true';
  if (isLocalDev) {
    return (prisma as any).restaurant.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      include,
    });
  }

  return null;
}

/**
 * Extrait la liste normalisée des jours creux (ex: ['lundi', 'mardi'])
 * à partir des créneaux d'heures creuses configurés dans l'interface.
 */
export function deriveOffPeakDaysFromSlots(
  hasOffPeak?: boolean,
  slots?: Array<{ days?: string }>
): string[] {
  if (!hasOffPeak || !Array.isArray(slots) || slots.length === 0) {
    return [];
  }

  const detected = new Set<string>();

  for (const slot of slots) {
    const raw = (slot.days || '').toLowerCase();
    if (!raw) continue;

    if (raw.includes('tous les jours') || raw.includes('toute la semaine')) {
      ORDERED_DAYS_FR.forEach((d) => detected.add(d));
      continue;
    }

    // Détection des plages "du <jourA> au <jourB>"
    const rangeMatch = raw.match(
      /du\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+au\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/
    );
    if (rangeMatch) {
      const startIdx = ORDERED_DAYS_FR.indexOf(rangeMatch[1]);
      const endIdx = ORDERED_DAYS_FR.indexOf(rangeMatch[2]);
      if (startIdx !== -1 && endIdx !== -1) {
        if (startIdx <= endIdx) {
          for (let i = startIdx; i <= endIdx; i++) detected.add(ORDERED_DAYS_FR[i]);
        } else {
          for (let i = startIdx; i < ORDERED_DAYS_FR.length; i++) detected.add(ORDERED_DAYS_FR[i]);
          for (let i = 0; i <= endIdx; i++) detected.add(ORDERED_DAYS_FR[i]);
        }
        continue;
      }
    }

    // Détection individuelle des jours mentionnés
    for (const day of ORDERED_DAYS_FR) {
      if (raw.includes(day)) {
        detected.add(day);
      }
    }
  }

  return Array.from(detected);
}
