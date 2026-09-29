import { NormalizedSignal } from './signal.types';

export class TicketmasterCollector {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.TICKETMASTER_API_KEY;
  }

  async collect(lat: number, lon: number, radiusKm = 10): Promise<NormalizedSignal[]> {
    if (!this.apiKey) {
      return [];
    }

    const geoPoint = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${this.apiKey}&latlong=${geoPoint}&radius=${radiusKm}&unit=km&size=5&sort=date,asc`;

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
          const venue = ev._embedded?.venues?.[0]?.name || 'à proximité';
          return {
            type: 'event',
            source: 'ticketmaster',
            intensity: 0.75,
            timestamp: startDateTime,
            title: `Événement : ${ev.name}`,
            summary: `${ev.name} prévu le ${new Date(startDateTime).toLocaleDateString('fr-FR')} à ${venue}.`,
            rawPayload: { id: ev.id, name: ev.name, url: ev.url },
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
