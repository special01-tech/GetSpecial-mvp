import { NormalizedSignal } from './signal.types';

/* =============================================================================
 * Calendarific Collector — Jours fériés & Événements nationaux
 *
 * Utilise l'API Calendarific (clé configurée dans .env) ou un fallback
 * local déterministe pour injecter les jours fériés dans le moteur d'opportunités.
 * ============================================================================= */

export class CalendarificCollector {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.CALENDARIFIC_API_KEY;
  }

  async collect(country = 'FR', targetDate: Date = new Date()): Promise<NormalizedSignal[]> {
    const year = targetDate.getFullYear();
    const countryCode = country.toUpperCase();

    if (!this.apiKey) {
      return this.getFallbackSignals(countryCode, targetDate);
    }

    const url = `https://calendarific.com/api/v2/holidays?api_key=${this.apiKey}&country=${countryCode}&year=${year}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Calendarific HTTP ${res.status}`);
      }

      const data = await res.json();
      const holidays = data?.response?.holidays || [];
      return this.filterAndNormalize(holidays, targetDate, countryCode);
    } catch (err) {
      console.warn('[CALENDARIFIC_COLLECTOR] Erreur API Calendarific, fallback local utilisé :', err);
      return this.getFallbackSignals(countryCode, targetDate);
    }
  }

  private filterAndNormalize(holidays: any[], targetDate: Date, countryCode: string): NormalizedSignal[] {
    const signals: NormalizedSignal[] = [];
    const now = targetDate.getTime();
    const sevenDaysInMs = 7 * 24 * 3600 * 1000;

    for (const h of holidays) {
      const isoDate = h.date?.iso || '';
      const holidayDate = new Date(isoDate);
      const diffMs = holidayDate.getTime() - now;

      // Détecter si le jour férié est aujourd'hui ou dans les 7 prochains jours
      if (diffMs >= -24 * 3600 * 1000 && diffMs <= sevenDaysInMs) {
        const isNational = Array.isArray(h.type) && h.type.some((t: string) => t.toLowerCase().includes('national'));
        const intensity = isNational ? 0.9 : 0.65;
        const isToday = Math.abs(diffMs) < 24 * 3600 * 1000 && holidayDate.getDate() === targetDate.getDate();

        const title = isToday ? `Jour férié : ${h.name}` : `À venir : ${h.name}`;
        const summary = h.description || `${h.name} est célébré. Opportunité d'affluence et de formules spéciales.`;

        signals.push({
          type: 'holiday',
          source: 'calendarific',
          intensity,
          timestamp: holidayDate.toISOString(),
          title,
          summary,
          payload: {
            condition: 'holiday',
            description: h.name,
            summary,
            actionHint: `Anticipez les réservations pour ${h.name}.`,
          },
          rawPayload: { country: countryCode, name: h.name, date: isoDate },
        });
      }
    }

    return signals;
  }

  private getFallbackSignals(countryCode: string, targetDate: Date): NormalizedSignal[] {
    const year = targetDate.getFullYear();
    const countryHolidays: Record<string, { name: string; month: number; day: number }[]> = {
      FR: [
        { name: "Jour de l'An", month: 0, day: 1 },
        { name: 'Fête du Travail', month: 4, day: 1 },
        { name: 'Victoire 1945', month: 4, day: 8 },
        { name: 'Fête Nationale', month: 6, day: 14 },
        { name: 'Assomption', month: 7, day: 15 },
        { name: 'Toussaint', month: 10, day: 1 },
        { name: 'Armistice 1918', month: 10, day: 11 },
        { name: 'Noël', month: 11, day: 25 },
      ],
      US: [
        { name: "New Year's Day", month: 0, day: 1 },
        { name: 'Independence Day', month: 6, day: 4 },
        { name: 'Thanksgiving', month: 10, day: 26 },
        { name: 'Christmas Day', month: 11, day: 25 },
      ],
    };

    const list = countryHolidays[countryCode] || countryHolidays.FR;
    const signals: NormalizedSignal[] = [];
    const now = targetDate.getTime();
    const sevenDaysInMs = 7 * 24 * 3600 * 1000;

    for (const h of list) {
      const holidayDate = new Date(year, h.month, h.day);
      const diffMs = holidayDate.getTime() - now;

      if (diffMs >= -24 * 3600 * 1000 && diffMs <= sevenDaysInMs) {
        const summary = `${h.name} est un jour férié. Forte opportunité de restauration et moments conviviaux.`;
        signals.push({
          type: 'holiday',
          source: 'calendarific',
          intensity: 0.9,
          timestamp: holidayDate.toISOString(),
          title: `Jour férié : ${h.name}`,
          summary,
          payload: {
            condition: 'holiday',
            description: h.name,
            summary,
            actionHint: `Mettez en avant un menu de fête pour ${h.name}.`,
          },
          rawPayload: { simulated: true, country: countryCode, name: h.name, date: holidayDate.toISOString() },
        });
      }
    }

    return signals;
  }
}

export const calendarificCollector = new CalendarificCollector();
