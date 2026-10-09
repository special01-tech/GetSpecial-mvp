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
      throw new Error(`CALENDARIFIC_API_KEY non configurée pour ${config.name} (${countryCode}).`);
    }

    const year = targetDate.getFullYear();
    const url = `https://calendarific.com/api/v2/holidays?api_key=${this.apiKey}&country=${countryCode}&year=${year}`;

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
          throw new Error(`Calendarific HTTP ${res.status} (${res.statusText})`);
        }

        const data = await res.json();
        if (data?.meta?.code && data.meta.code !== 200) {
          throw new Error(`Calendarific API error (${data.meta.code}): ${data.meta.error_detail || data.meta.error_type || 'Erreur inconnue'}`);
        }

        const holidays: CalendarificHoliday[] = data?.response?.holidays || [];
        return this.filterAndNormalize(holidays, targetDate, config);
      } catch (err: any) {
        lastError = err;
        console.warn(`[CALENDARIFIC_COLLECTOR] Essai ${attempts}/${maxAttempts} échoué :`, err?.message || err);
        if (attempts >= maxAttempts) {
          throw new Error(`Échec Calendarific pour le pays ${countryCode} après ${maxAttempts} tentatives : ${err?.message || err}`);
        }
        await new Promise((r) => setTimeout(r, 1000 * attempts));
      }
    }

    throw lastError || new Error(`Échec Calendarific pour ${countryCode}`);
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
}

export const calendarificCollector = new CalendarificCollector();

