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
          where: { detectedAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
          orderBy: { detectedAt: 'desc' },
          take: 20,
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

    // 2. Jour courant & Horaires
    const now = new Date();
    const dayInfo = DAYS_MAP[now.getDay()] || { key: 'mon', fr: 'lundi' };
    const profile = restaurant.profile || {};
    const customRules = (profile.customRules as Record<string, any>) || {};

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

    // 3. Météo du jour (Tolérance aux pannes : safe parsing)
    const weatherSignal = (restaurant.signals || []).find((s: any) => s.type === 'weather');
    let weatherData: ContextDossier['weather'] = { available: false };

    if (weatherSignal && weatherSignal.data) {
      const data = weatherSignal.data as Record<string, any>;
      const condition = data.condition || data.weatherDesc || '';
      const condLower = condition.toLowerCase();
      const isRain = Boolean(data.isRain || condLower.includes('pluie') || condLower.includes('rain'));
      const isSunny = Boolean(data.isSunny || condLower.includes('soleil') || condLower.includes('dégagé') || condLower.includes('clear'));

      weatherData = {
        available: true,
        condition: condition || (isSunny ? 'Ensoleillé' : isRain ? 'Pluvieux' : 'Nuageux'),
        temperature: typeof data.temperature === 'number' ? Math.round(data.temperature) : undefined,
        tempUnit: data.tempUnit || '°C',
        isSunny,
        isRain,
        summary: data.summary || `${condition}${data.temperature ? ` (${Math.round(data.temperature)}°C)` : ''}`,
      };
    }

    // 4. Événements locaux (< 2km, filtrés selon préférences)
    const preferredEventTypes: string[] = Array.isArray(customRules.preferredEventTypes)
      ? customRules.preferredEventTypes.map((t: string) => t.toLowerCase())
      : [];

    const eventSignals = (restaurant.signals || []).filter((s: any) => s.type === 'event');
    const events: ContextDossier['events'] = eventSignals.slice(0, 5).map((es: any) => {
      const data = (es.data as Record<string, any>) || {};
      return {
        id: es.id,
        title: data.title || 'Événement local',
        type: data.category || (data.isSport ? 'sport' : 'concert'),
        venue: data.venue || data.location,
        distanceMeters: data.distanceMeters || (data.distance ? Math.round(data.distance * 1000) : undefined),
        startTime: data.time || data.startTime || (data.timestamp ? new Date(data.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined),
        summary: data.summary || data.description,
      };
    });

    // 5. Offres actives du restaurant
    const activeOffers: ContextDossier['activeOffers'] = (restaurant.offers || []).map((o: any) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      discountValue: o.discountValue || undefined,
      lastPromotedAt: o.lastPromotedAt ? new Date(o.lastPromotedAt).toISOString() : undefined,
    }));

    // 6. Assembler le dossier final
    const dossier: ContextDossier = {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        type: restaurant.type || 'restaurant',
        address: restaurant.address,
        city: restaurant.city || (restaurant.address.split(',')[1] || '').trim() || 'Paris',
        timezone: restaurant.timezone || 'Europe/Paris',
        specialties: Array.isArray(restaurant.specialties) ? restaurant.specialties : [],
        hasTerrace: Boolean(profile.hasTerrace),
        averageTicket: customRules.averageTicket || '15-30 €',
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
      },
      weather: weatherData,
      events,
      activeOffers,
      recentDismissals,
    };

    return { dossier, restaurant };
  }
}
