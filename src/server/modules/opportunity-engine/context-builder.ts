import { prisma } from '@/server/db/prisma.client';
import { ContextDossier } from './types';

const DAYS_MAP: Record<number, { key: string; fr: string }> = {
  0: { key: 'sun', fr: 'dimanche' },
  1: { key: 'mon', fr: 'lundi' },
  2: { key: 'tue', fr: 'mardi' },
  3: { key: 'wed', fr: 'mercredi' },
  4: { key: 'thu', fr: 'jeudi' },
  5: { key: 'fri', fr: 'vendredi' },
  6: { key: 'sat', fr: 'samedi' },
};

export class ContextBuilder {
  /**
   * Construit un ContextDossier factuel, propre et résilient à partir de Prisma.
   * L'absence d'une météo ou d'événements n'est JAMAIS bloquante.
   */
  static async buildDossier(restaurantId: string): Promise<{ dossier: ContextDossier; restaurant: any }> {
    const restaurant = await (prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        profile: true,
        offers: { where: { status: 'active' } },
        signals: {
          where: {
            status: 'active',
            OR: [
              { endsAt: { gte: new Date(Date.now() - 2 * 3600 * 1000) } },
              { detectedAt: { gte: new Date(Date.now() - 48 * 3600 * 1000) } },
            ],
          },
          orderBy: { detectedAt: 'desc' },
          take: 30,
        },
      },
    });

    if (!restaurant) {
      throw new Error(`Restaurant introuvable : ${restaurantId}`);
    }

    // 1. Récupérer les motifs de rejets des dernières 48h (pour éviter de reproposer le même thème)
    const recentDismissalsRecords = await (prisma as any).feedbackEvent.findMany({
      where: {
        restaurantId,
        type: 'dismiss_opportunity',
        createdAt: { gte: new Date(Date.now() - 48 * 3600 * 1000) },
      },
      select: { reason: true },
    });
    const recentDismissals = recentDismissalsRecords
      .map((d: any) => (d.reason || '').trim())
      .filter((r: string) => r.length > 0);

    // 2. Jour courant & Horaires avec respect du fuseau horaire de l'établissement
    const now = new Date();
    const timezone = restaurant.timezone || (restaurant.country === 'US' ? 'America/New_York' : 'Europe/Paris');

    let localHour = now.getHours();
    let localMinute = now.getMinutes();
    let localDayOfWeek = now.getDay();

    try {
      const parts = new Intl.DateTimeFormat('fr-FR', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'short',
        hour12: false,
      }).formatToParts(now);

      const h = parts.find((p) => p.type === 'hour')?.value;
      const m = parts.find((p) => p.type === 'minute')?.value;
      if (h) localHour = parseInt(h, 10);
      if (m) localMinute = parseInt(m, 10);

      const weekdayStr = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(now).toLowerCase();
      const dayMapLookup: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
      if (weekdayStr in dayMapLookup) {
        localDayOfWeek = dayMapLookup[weekdayStr];
      }
    } catch {}

    const localTimeStr = `${String(localHour).padStart(2, '0')}:${String(localMinute).padStart(2, '0')}`;
    const dayInfo = DAYS_MAP[localDayOfWeek] || { key: 'mon', fr: 'lundi' };
    const profile = restaurant.profile || {};
    const customRules = (profile.customRules as Record<string, any>) || {};

    let timeOfDay: 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night' = 'lunch';
    let timeOfDayFr = 'Midi / Service du déjeuner';

    if (localHour >= 5 && localHour < 11) {
      timeOfDay = 'morning';
      timeOfDayFr = 'Matinée (Avant le service du midi)';
    } else if (localHour >= 11 && localHour < 14) {
      timeOfDay = 'lunch';
      timeOfDayFr = 'Midi / Service du déjeuner';
    } else if (localHour >= 14 && localHour < 18) {
      timeOfDay = 'afternoon';
      timeOfDayFr = 'Après-midi (Préparation afterwork, apéro & soirée)';
    } else if (localHour >= 18 && localHour < 22) {
      timeOfDay = 'evening';
      timeOfDayFr = 'Soirée / Service du dîner';
    } else {
      timeOfDay = 'night';
      timeOfDayFr = 'Fin de soirée & nuit (Préparation du service de demain)';
    }

    const offPeakDays: string[] = Array.isArray(profile.offPeakDays)
      ? profile.offPeakDays.map((d: string) => d.toLowerCase())
      : [];
    const isOffPeakDay = offPeakDays.some(
      (d) => d.includes(dayInfo.key) || d.includes(dayInfo.fr)
    );

    const openingHours = (restaurant.openingHours as Record<string, string>) || {};
    const todayHours = openingHours[dayInfo.key] || openingHours[dayInfo.fr] || '';
    const isClosed =
      todayHours.toLowerCase().includes('ferm') ||
      todayHours.toLowerCase().includes('close');

    // 3. Météo du jour (Tolérance aux pannes : lecture du contrat unifié data)
    const weatherSignal = (restaurant.signals || []).find((s: any) => s.type === 'weather');
    let weatherData: ContextDossier['weather'] = { available: false };

    if (weatherSignal && weatherSignal.data) {
      const data = weatherSignal.data as Record<string, any>;
      const raw = (data.raw as Record<string, any>) || {};
      const condition = data.condition || raw.condition || data.weatherDesc || '';
      const condLower = condition.toLowerCase();
      const isRain = Boolean(data.isRain || raw.isRain || condLower.includes('pluie') || condLower.includes('rain'));
      const isSunny = Boolean(data.isSunny || raw.isSunny || condLower.includes('soleil') || condLower.includes('dégagé') || condLower.includes('clear'));

      weatherData = {
        available: true,
        condition: condition || (isSunny ? 'Ensoleillé' : isRain ? 'Pluvieux' : 'Nuageux'),
        temperature: typeof data.temperature === 'number' ? Math.round(data.temperature) : typeof raw.temperatureC === 'number' ? raw.temperatureC : undefined,
        tempUnit: data.tempUnit || raw.tempUnit || '°C',
        isSunny,
        isRain,
        summary: data.summary || `${condition}${data.temperature ? ` (${Math.round(data.temperature)}°C)` : ''}`,
      };
    }

    // 4. Événements locaux et célébrations (Filtrés selon distance et préférences)
    const preferredEventTypes: string[] = Array.isArray(customRules.preferredEventTypes)
      ? customRules.preferredEventTypes.map((t: string) => t.toLowerCase())
      : [];

    const activeSignals = (restaurant.signals || []).filter((s: any) => s.type === 'event' || s.type === 'holiday');
    const events: ContextDossier['events'] = activeSignals.slice(0, 8).map((es: any) => {
      const data = (es.data as Record<string, any>) || {};
      const raw = (data.raw as Record<string, any>) || {};
      const rawStartsAt = es.startsAt || data.startsAt || raw.startsAt || data.timestamp;

      let dateFormatted = 'Aujourd’hui';
      if (rawStartsAt) {
        try {
          if (es.type === 'holiday') {
            dateFormatted = new Intl.DateTimeFormat('fr-FR', {
              timeZone: timezone,
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }).format(new Date(rawStartsAt));
          } else {
            dateFormatted = new Intl.DateTimeFormat('fr-FR', {
              timeZone: timezone,
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }).format(new Date(rawStartsAt));
          }
        } catch {
          dateFormatted = 'Aujourd’hui';
        }
      }

      return {
        id: es.id,
        title: data.title || es.title || 'Événement local',
        type: es.category || data.category || (es.type === 'holiday' ? 'holiday' : 'concert'),
        venue: data.venue || raw.venue || 'À proximité',
        distanceMeters: es.distanceMeters || data.distanceMeters || (data.distance ? Math.round(data.distance * 1000) : undefined),
        startTime: dateFormatted,
        summary: data.summary || es.summary || data.description,
      };
    });

    // 5. Offres actives du restaurant & données réelles de comptage (Boutons comptoir + QR codes)
    let counterOffersMap = new Map<string, { total_uses: number }>();
    try {
      const redemptions = await ((prisma as any).redemption).findMany({
        where: { restaurantId: restaurant.id, status: { not: 'cancelled' } },
      });
      for (const r of redemptions) {
        const cur = counterOffersMap.get(r.offerId) || { total_uses: 0 };
        cur.total_uses += 1;
        counterOffersMap.set(r.offerId, cur);
      }
    } catch (e) {
      // Tolérance en cas de table vide
    }

    const activeOffers: ContextDossier['activeOffers'] = (restaurant.offers || []).map((o: any) => {
      const counterStats = counterOffersMap.get(o.id) || counterOffersMap.get(o.codeWord?.toUpperCase()) || { total_uses: 0 };
      return {
        id: o.id,
        title: o.title,
        description: `${o.description || ''} [Comptabilisations réelles en salle : ${counterStats.total_uses} utilisations]`,
        discountValue: o.discountValue || undefined,
        lastPromotedAt: o.lastPromotedAt ? new Date(o.lastPromotedAt).toISOString() : undefined,
      };
    });


    // 6. Assembler le dossier final
    const dossier: ContextDossier = {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        type: restaurant.type || 'restaurant',
        address: restaurant.address,
        city: restaurant.city || (restaurant.address ? (restaurant.address.split(',')[1] || '').trim() : '') || '',
        timezone: restaurant.timezone || 'Europe/Paris',
        specialties: Array.isArray(restaurant.specialties) ? restaurant.specialties : [],
        hasTerrace: Boolean(profile.hasTerrace),
        averageTicket: profile.averageTicket ? `${profile.averageTicket} €` : (customRules.averageTicket || '15-30 €'),
        offPeakDays,
        baselineCovers: typeof profile.baselineCovers === 'number' ? profile.baselineCovers : 15,
        preferredEventTypes,
        constraints: Array.isArray(profile.constraints) ? profile.constraints : [],
        tone: profile.tone || 'chaleureux',
      },
      currentDay: {
        dayKey: dayInfo.key,
        dayNameFr: dayInfo.fr,
        isOffPeakDay,
        isClosed,
        hoursText: todayHours || 'Non spécifié',
        currentTime: localTimeStr,
        currentHour: localHour,
        timeOfDay,
        timeOfDayFr,
      },
      weather: weatherData,
      events,
      activeOffers,
      recentDismissals,
    };

    return { dossier, restaurant };
  }
}
