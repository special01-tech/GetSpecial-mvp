import { prisma } from '@/server/db/prisma.client';
import { weatherService } from './weather/weather.service';
import { ticketmasterCollector } from './ticketmaster.collector';
import { calendarificCollector } from './calendarific.collector';
import { NormalizedSignal } from './signal.types';
import { logAudit } from '@/server/lib/audit';

export class SignalSyncScheduler {
  /**
   * Tâche de synchronisation des signaux d'un restaurant donné avec upsert déterministe.
   */
  async syncSignalsForRestaurant(restaurantId: string): Promise<NormalizedSignal[]> {
    const restaurant = await (prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      include: { profile: true },
    });

    if (!restaurant) {
      throw new Error(`Restaurant ${restaurantId} introuvable`);
    }

    const { latitude, longitude } = restaurant;
    const country = (restaurant.country || restaurant.profile?.country || 'FR').toUpperCase();
    const customRules = (restaurant.profile?.customRules as Record<string, any>) || {};
    const eventPrefs = customRules.eventPreferences || {};
    const radiusKm = typeof eventPrefs.radiusKm === 'number'
      ? eventPrefs.radiusKm
      : typeof customRules.eventRadiusKm === 'number'
      ? customRules.eventRadiusKm
      : 15;
    const catPrefs = {
      sport: eventPrefs.categories?.sport ?? true,
      concert: eventPrefs.categories?.concert ?? true,
      arts: eventPrefs.categories?.arts ?? true,
      holiday: eventPrefs.categories?.holiday ?? true,
      internal: eventPrefs.categories?.internal ?? true,
    };

    const allSignals: NormalizedSignal[] = [];

    // 1. Météo locale en temps réel
    try {
      const weatherSignals = await weatherService.getSignals(latitude, longitude, country);
      allSignals.push(...weatherSignals);
    } catch (err) {
      console.error(`[SYNC_WEATHER_ERROR] Restaurant ${restaurantId}:`, err);
    }

    // 2. Événements Ticketmaster locaux selon le rayon et les catégories choisies
    const hasAnyExternalEventEnabled = catPrefs.sport || catPrefs.concert || catPrefs.arts;
    if (hasAnyExternalEventEnabled) {
      try {
        const restCity = restaurant.city || (country === 'FR' ? 'Paris' : country === 'US' ? 'New York' : '');
        const eventSignals = await ticketmasterCollector.collect(latitude, longitude, radiusKm, country, new Date(), restCity);
        allSignals.push(...eventSignals);
      } catch (err) {
        console.error(`[SYNC_TICKETMASTER_ERROR] Restaurant ${restaurantId}:`, err);
      }
    }

    // 3. Fêtes & célébrations Calendarific (si activées)
    if (catPrefs.holiday) {
      try {
        const holidaySignals = await calendarificCollector.collect(country);
        allSignals.push(...holidaySignals);
      } catch (err) {
        console.error(`[SYNC_CALENDARIFIC_ERROR] Restaurant ${restaurantId}:`, err);
      }
    }

    let createdCount = 0;
    let updatedCount = 0;

    // 4. Persistance robuste par Upsert sur (restaurantId + source + externalId)
    for (const sig of allSignals) {
      const externalId = sig.externalId;
      const startsAt = sig.startsAt ? new Date(sig.startsAt) : new Date(sig.timestamp);
      const endsAt = sig.endsAt ? new Date(sig.endsAt) : new Date(startsAt.getTime() + 4 * 3600 * 1000);

      // Recherche par identifiant stable
      const existing = await (prisma as any).signal.findFirst({
        where: {
          restaurantId,
          source: sig.source,
          externalId,
        },
      });

      if (existing) {
        // Mise à jour si déjà existant
        await (prisma as any).signal.update({
          where: { id: existing.id },
          data: {
            intensity: sig.intensity,
            category: sig.category || 'other',
            startsAt,
            endsAt,
            distanceMeters: sig.distanceMeters ?? null,
            isFallback: sig.isFallback ?? false,
            detectedAt: new Date(),
            status: 'active',
            data: sig.data,
          },
        });
        updatedCount++;
      } else {
        // Création d'un nouveau signal
        await (prisma as any).signal.create({
          data: {
            restaurantId,
            externalId,
            type: sig.type,
            category: sig.category || 'other',
            source: sig.source,
            intensity: sig.intensity,
            startsAt,
            endsAt,
            distanceMeters: sig.distanceMeters ?? null,
            isFallback: sig.isFallback ?? false,
            detectedAt: new Date(),
            status: 'active',
            data: sig.data,
          },
        });
        createdCount++;
      }
    }

    // 5. Expiration des signaux dont la date de fin est dépassée
    const now = new Date();
    try {
      await (prisma as any).signal.updateMany({
        where: {
          restaurantId,
          endsAt: { lt: now },
          status: 'active',
        },
        data: {
          status: 'expired',
        },
      });
    } catch (e) {
      // Tolérance si la colonne endsAt n'est pas encore migrée
    }

    await logAudit({
      restaurantId,
      action: 'signals.sync',
      entityType: 'signals',
      details: {
        totalSignals: allSignals.length,
        created: createdCount,
        updated: updatedCount,
      },
    });

    return allSignals;
  }

  /**
   * Exécute la synchronisation séquentielle par restaurant pour tous les restaurants actifs.
   */
  async runDailyBatch(): Promise<{ processed: number; errors: number }> {
    const restaurants = await (prisma as any).restaurant.findMany({
      where: { status: 'active', isPaused: false },
      select: { id: true },
    });

    let errors = 0;
    for (const r of restaurants) {
      try {
        await this.syncSignalsForRestaurant(r.id);
      } catch (err) {
        errors++;
        console.error(`[DAILY_BATCH_ERROR] Échec pour le restaurant ${r.id}:`, err);
      }
    }

    return { processed: restaurants.length, errors };
  }
}

export const signalSyncScheduler = new SignalSyncScheduler();

