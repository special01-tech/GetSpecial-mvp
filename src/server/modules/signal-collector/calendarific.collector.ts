import { NormalizedSignal } from './signal.types';
import { getCountryConfig, CountryConfig } from '@/server/lib/country-config';

export interface CalendarificHoliday {
  name: string;
  description: string;
  country: {
    id: string;
    name: string;
  };
  date: {
    iso: string;
    datetime: {
      year: number;
      month: number;
      day: number;
    };
  };
  type: string[];
  primary_type: string;
  canonical_url: string;
  urlid: string;
  locations: string;
  states: string;
}

export class CalendarificCollector {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.CALENDARIFIC_API_KEY;
  }

  /**
   * Récupère les jours fériés et célébrations pour n'importe quel pays au monde (Calendarific 230+ pays).
   * Filtre les événements du jour ou des 7 prochains jours.
   */
  async collect(country = 'US', targetDate: Date = new Date()): Promise<NormalizedSignal[]> {
    const config = getCountryConfig(country);
    const countryCode = config.code;

    if (!this.apiKey) {
      console.warn(`[CALENDARIFIC_COLLECTOR] Pas de clé CALENDARIFIC_API_KEY. Utilisation des jours fériés légaux pour ${config.name} (${countryCode}).`);
      return this.getFallbackSignals(config, targetDate);
    }

    const year = targetDate.getFullYear();
    const url = `https://calendarific.com/api/v2/holidays?api_key=${this.apiKey}&country=${countryCode}&year=${year}`;

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
          throw new Error(`Calendarific HTTP ${res.status}`);
        }

        const data = await res.json();
        const holidays: CalendarificHoliday[] = data?.response?.holidays || [];
        return this.filterAndNormalize(holidays, targetDate, config);
      } catch (err) {
        console.warn(`[CALENDARIFIC_COLLECTOR] Essai ${attempts}/${maxAttempts} échoué :`, err);
        if (attempts >= maxAttempts) {
          return this.getFallbackSignals(config, targetDate);
        }
        await new Promise((r) => setTimeout(r, 1000 * attempts));
      }
    }

    return this.getFallbackSignals(config, targetDate);
  }

  private filterAndNormalize(holidays: CalendarificHoliday[], targetDate: Date, config: CountryConfig): NormalizedSignal[] {
    const signals: NormalizedSignal[] = [];
    const now = targetDate.getTime();
    const sevenDaysInMs = 7 * 24 * 3600 * 1000;

    for (const h of holidays) {
      const holidayDate = new Date(h.date.iso);
      const diffMs = holidayDate.getTime() - now;

      // Détecter si le jour férié est aujourd'hui ou dans les 7 prochains jours
      if (diffMs >= -24 * 3600 * 1000 && diffMs <= sevenDaysInMs) {
        const isNational = h.type.some((t) => t.toLowerCase().includes('national'));
        const intensity = isNational ? 0.9 : 0.65;
        const isToday = Math.abs(diffMs) < 24 * 3600 * 1000 && holidayDate.getDate() === targetDate.getDate();

        let title = isToday ? `Holiday / Celebration: ${h.name}` : `Upcoming: ${h.name}`;
        let summary = h.description || `${h.name} (${h.primary_type || 'Public Holiday'}). Great opportunity for restaurant dining and promotions.`;

        if (config.language === 'fr') {
          title = isToday ? `Jour férié / Célébration : ${h.name}` : `À venir : ${h.name}`;
          summary = h.description || `${h.name} (${h.primary_type || 'Jour férié'}).`;
        } else if (config.language === 'es') {
          title = isToday ? `Día festivo / Celebración: ${h.name}` : `Próximo: ${h.name}`;
          summary = h.description || `${h.name} (${h.primary_type || 'Día festivo'}).`;
        } else if (config.language === 'de') {
          title = isToday ? `Feiertag / Festtag: ${h.name}` : `Bevorstehend: ${h.name}`;
          summary = h.description || `${h.name} (${h.primary_type || 'Feiertag'}).`;
        }

        signals.push({
          type: 'holiday',
          source: 'calendarific',
          intensity,
          timestamp: holidayDate.toISOString(),
          title,
          summary,
          rawPayload: {
            country: config.code,
            name: h.name,
            date: h.date.iso,
            types: h.type,
            primary_type: h.primary_type,
          },
        });
      }
    }

    return signals;
  }

  /**
   * Jours fériés officiels adaptés au pays (fallback sans clé d'API)
   */
  private getFallbackSignals(config: CountryConfig, targetDate: Date): NormalizedSignal[] {
    const year = targetDate.getFullYear();

    const countryHolidays: Record<string, { name: string; month: number; day: number }[]> = {
      US: [
        { name: "New Year's Day", month: 0, day: 1 },
        { name: 'Martin Luther King Jr. Day', month: 0, day: 19 },
        { name: "Presidents' Day", month: 1, day: 16 },
        { name: 'Memorial Day', month: 4, day: 25 },
        { name: 'Juneteenth National Independence Day', month: 5, day: 19 },
        { name: 'Independence Day (4th of July)', month: 6, day: 4 },
        { name: 'Labor Day', month: 8, day: 1 },
        { name: 'Columbus Day / Indigenous Peoples Day', month: 9, day: 12 },
        { name: 'Veterans Day', month: 10, day: 11 },
        { name: 'Thanksgiving Day', month: 10, day: 26 },
        { name: 'Christmas Day', month: 11, day: 25 },
      ],
      GB: [
        { name: "New Year's Day", month: 0, day: 1 },
        { name: 'Good Friday', month: 3, day: 3 },
        { name: 'Easter Monday', month: 3, day: 6 },
        { name: 'Early May Bank Holiday', month: 4, day: 4 },
        { name: 'Spring Bank Holiday', month: 4, day: 25 },
        { name: 'Summer Bank Holiday', month: 7, day: 31 },
        { name: 'Christmas Day', month: 11, day: 25 },
        { name: 'Boxing Day', month: 11, day: 26 },
      ],
      CA: [
        { name: "New Year's Day", month: 0, day: 1 },
        { name: 'Victoria Day', month: 4, day: 18 },
        { name: 'Canada Day', month: 6, day: 1 },
        { name: 'Labour Day', month: 8, day: 7 },
        { name: 'Thanksgiving', month: 9, day: 12 },
        { name: 'Remembrance Day', month: 10, day: 11 },
        { name: 'Christmas Day', month: 11, day: 25 },
      ],
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
      DE: [
        { name: 'Neujahr', month: 0, day: 1 },
        { name: 'Tag der Arbeit', month: 4, day: 1 },
        { name: 'Tag der Deutschen Einheit', month: 9, day: 3 },
        { name: 'Weihnachten', month: 11, day: 25 },
      ],
      ES: [
        { name: 'Año Nuevo', month: 0, day: 1 },
        { name: 'Día del Trabajo', month: 4, day: 1 },
        { name: 'Fiesta Nacional de España', month: 9, day: 12 },
        { name: 'Navidad', month: 11, day: 25 },
      ],
    };

    const list = countryHolidays[config.code] || [
      { name: "New Year's Day", month: 0, day: 1 },
      { name: 'International Workers Day', month: 4, day: 1 },
      { name: 'Christmas Day', month: 11, day: 25 },
    ];

    const signals: NormalizedSignal[] = [];
    const now = targetDate.getTime();
    const sevenDaysInMs = 7 * 24 * 3600 * 1000;

    for (const h of list) {
      const holidayDate = new Date(year, h.month, h.day);
      const diffMs = holidayDate.getTime() - now;

      if (diffMs >= -24 * 3600 * 1000 && diffMs <= sevenDaysInMs) {
        signals.push({
          type: 'holiday',
          source: 'calendarific',
          intensity: 0.9,
          timestamp: holidayDate.toISOString(),
          title: config.language === 'fr' ? `Jour férié : ${h.name}` : `Public Holiday: ${h.name}`,
          summary: config.language === 'fr'
            ? `${h.name} est un jour férié national. Opportunité d'affluence ou formule spéciale.`
            : `${h.name} is a national holiday in ${config.name}. High opportunity for group bookings and specials.`,
          rawPayload: { simulated: true, country: config.code, name: h.name, date: holidayDate.toISOString() },
        });
      }
    }

    return signals;
  }
}

export const calendarificCollector = new CalendarificCollector();
