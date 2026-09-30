import { NormalizedSignal } from './signal.types';
import { getCountryConfig } from '@/server/lib/country-config';

export class TicketmasterCollector {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.TICKETMASTER_API_KEY;
  }

  async collect(lat: number, lon: number, radiusKm = 15, country = 'US'): Promise<NormalizedSignal[]> {
    if (!this.apiKey) {
      return [];
    }

    const config = getCountryConfig(country);
    const geoPoint = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    const radius = config.distanceUnit === 'miles' ? Math.max(1, Math.round(radiusKm * 0.621371)) : radiusKm;
    const unit = config.distanceUnit; // 'miles' for US/UK, 'km' for others
    const countryCode = config.code;

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${this.apiKey}&latlong=${geoPoint}&radius=${radius}&unit=${unit}&countryCode=${countryCode}&size=5&sort=date,asc`;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error(`Ticketmaster HTTP ${res.status}`);
        }

        const data = await res.json();
        const events = data?._embedded?.events || [];

        return events.map((ev: any): NormalizedSignal => {
          const startDateTime = ev.dates?.start?.dateTime || new Date().toISOString();
          const venue = ev._embedded?.venues?.[0]?.name || (config.language === 'fr' ? 'à proximité' : 'nearby');
          const dateStr = new Date(startDateTime).toLocaleDateString(config.locale, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          let title = `Local Event: ${ev.name}`;
          let summary = `${ev.name} scheduled for ${dateStr} at ${venue}. High potential for pre/post event dining crowd.`;

          if (config.language === 'fr') {
            title = `Événement local : ${ev.name}`;
            summary = `${ev.name} prévu le ${dateStr} à ${venue}. Forte opportunité d'affluence avant/après événement.`;
          } else if (config.language === 'es') {
            title = `Evento local: ${ev.name}`;
            summary = `${ev.name} programado para el ${dateStr} en ${venue}. Gran oportunidad para atraer comensales.`;
          } else if (config.language === 'de') {
            title = `Lokales Event: ${ev.name}`;
            summary = `${ev.name} am ${dateStr} in ${venue}. Hohes Potenzial für Restaurantgäste vor/nach der Veranstaltung.`;
          }

          return {
            type: 'event',
            source: 'ticketmaster',
            intensity: 0.75,
            timestamp: startDateTime,
            title,
            summary,
            rawPayload: { id: ev.id, name: ev.name, url: ev.url, country: countryCode },
          };
        });
      } catch (err) {
        console.warn(`[TICKETMASTER_COLLECTOR] Essai ${attempts}/${maxAttempts} échoué :`, err);
        if (attempts >= maxAttempts) {
          return [];
        }
        await new Promise((r) => setTimeout(r, 1000 * attempts));
      }
    }

    return [];
  }
}

export const ticketmasterCollector = new TicketmasterCollector();
