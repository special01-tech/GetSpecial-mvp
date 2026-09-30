import { prisma } from '@/server/db/prisma.client';
import { weatherCollector } from './weather.collector';
import { ticketmasterCollector } from './ticketmaster.collector';
import { calendarificCollector } from './calendarific.collector';
import { NormalizedSignal } from './signal.types';
import { logAudit } from '@/server/lib/audit';

export class SignalSyncScheduler {
  /**
   * Tâche planifiée pour synchroniser les signaux de tous les restaurants (ou d'un restaurant spécifique).
   * Traitement unitaire par restaurant pour éviter les boucles géantes bloquantes.
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
    const country = (restaurant.country || 'US').toUpperCase();
    const allSignals: NormalizedSignal[] = [];

    // 1. Météo adaptée au pays (°F pour US, °C pour FR)
    try {
      const weatherSignals = await weatherCollector.collect(latitude, longitude, country);
      allSignals.push(...weatherSignals);
    } catch (err) {
      console.error(`[SYNC_WEATHER_ERROR] Restaurant ${restaurantId}`, err);
    }

    // 2. Événements Ticketmaster dans le rayon et pays du restaurant
    try {
      const eventSignals = await ticketmasterCollector.collect(latitude, longitude, 15, country);
      allSignals.push(...eventSignals);
    } catch (err) {
      console.error(`[SYNC_TICKETMASTER_ERROR] Restaurant ${restaurantId}`, err);
    }

    // 3. Jours fériés & célébrations Calendarific spécifiques au pays
    try {
      const holidaySignals = await calendarificCollector.collect(country);
      allSignals.push(...holidaySignals);
    } catch (err) {
      console.error(`[SYNC_CALENDARIFIC_ERROR] Restaurant ${restaurantId}`, err);
    }

    // 3. Persistance dans la table signals sans doublons (vérification d'unicité basée sur type + timestamp)
    for (const sig of allSignals) {
      const existing = await (prisma as any).signal.findFirst({
        where: {
          restaurantId,
          type: sig.type,
          source: sig.source,
          detectedAt: {
            gte: new Date(Date.now() - 3 * 3600 * 1000), // Fenêtre de 3h anti-doublon
          },
        },
      });

      if (!existing) {
        await (prisma as any).signal.create({
          data: {
            restaurantId,
            type: sig.type,
            source: sig.source,
            intensity: sig.intensity,
            data: {
              title: sig.title,
              summary: sig.summary,
              timestamp: sig.timestamp,
              raw: sig.rawPayload,
            },
          },
        });
      }
    }

    await logAudit({
      restaurantId,
      action: 'signals.sync',
      entityType: 'signals',
      details: { count: allSignals.length },
    });

    return allSignals;
  }

  /**
   * Exécute la synchronisation séquentielle par restaurant.
   */
  async runDailyBatch(): Promise<{ processed: number }> {
    const restaurants = await (prisma as any).restaurant.findMany({
      where: { status: 'active', isPaused: false },
      select: { id: true },
    });

    for (const r of restaurants) {
      try {
        await this.syncSignalsForRestaurant(r.id);
      } catch (err) {
        console.error(`[DAILY_BATCH_ERROR] Échec pour le restaurant ${r.id}`, err);
      }
    }

    return { processed: restaurants.length };
  }
}

export const signalSyncScheduler = new SignalSyncScheduler();
