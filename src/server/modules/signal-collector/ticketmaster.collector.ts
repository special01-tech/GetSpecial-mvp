import { NormalizedSignal } from './signal.types';
import { getCountryConfig } from '@/server/lib/country-config';

export class TicketmasterCollector {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.TICKETMASTER_API_KEY;
  }

  async collect(lat: number, lon: number, radiusKm = 25, country = 'US'): Promise<NormalizedSignal[]> {
    if (!this.apiKey) {
      throw new Error('TICKETMASTER_API_KEY non configurée.');
    }

    const config = getCountryConfig(country);
    const geoPoint = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    const radius = config.distanceUnit === 'miles' ? Math.max(1, Math.round(radiusKm * 0.621371)) : radiusKm;
    const unit = config.distanceUnit; // 'miles' for US/UK, 'km' for others

    // Recherche Ticketmaster basée sur les coordonnées GPS réelles et le rayon
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${this.apiKey}&latlong=${geoPoint}&radius=${radius}&unit=${unit}&size=10&sort=date,asc`;

    let attempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error(`Ticketmaster HTTP ${res.status} (${res.statusText})`);
        }

        const data = await res.json();
        const events = data?._embedded?.events || [];

        return events.map((ev: any): NormalizedSignal => {
          const startDateTime = ev.dates?.start?.dateTime || ev.dates?.start?.localDate || new Date().toISOString();
          const venue = ev._embedded?.venues?.[0]?.name || (config.language === 'fr' ? 'À proximité' : 'Nearby');
          const dateStr = new Date(startDateTime).toLocaleDateString(config.locale, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          let title = `Événement : ${ev.name}`;
          let summary = `${ev.name} prévu le ${dateStr} à ${venue}. Forte opportunité d'affluence avant/après événement.`;

          if (config.language !== 'fr') {
            title = `Event: ${ev.name}`;
            summary = `${ev.name} scheduled for ${dateStr} at ${venue}. High potential for pre/post event dining crowd.`;
          }

          return {
            type: 'event',
            source: 'ticketmaster',
            intensity: 0.75,
            timestamp: startDateTime,
            title,
            summary,
            rawPayload: { id: ev.id, name: ev.name, url: ev.url, venue, distance: radiusKm },
          };
        });
      } catch (err: any) {
        lastError = err;
        console.warn(`[TICKETMASTER_COLLECTOR] Essai ${attempts}/${maxAttempts} échoué :`, err?.message || err);
        if (attempts >= maxAttempts) {
          throw new Error(`Échec Ticketmaster après ${maxAttempts} tentatives : ${err?.message || err}`);
        }
        await new Promise((r) => setTimeout(r, 1000 * attempts));
      }
    }

    throw lastError || new Error('Échec Ticketmaster');
  }
}

export const ticketmasterCollector = new TicketmasterCollector();
