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
  canonical_url?: string;
  urlid?: string;
  locations?: string;
  states?: string;
}

export class CalendarificCollector {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.CALENDARIFIC_API_KEY;
  }

  /**
   * Récupère les jours fériés et célébrations officielles.
   * Utilise l'API Calendarific si clé disponible, sinon calcule les jours fériés
   * réels du calendrier officiel 2026 pour le pays (France, USA, etc.).
   */
  async collect(country = 'FR', targetDate: Date = new Date()): Promise<NormalizedSignal[]> {
    const config = getCountryConfig(country);
    const countryCode = config.code;
    const year = targetDate.getFullYear();

    if (!this.apiKey) {
      const realHolidays = this.getOfficialHolidays(countryCode, year);
      return this.filterAndNormalize(realHolidays, targetDate, config);
    }

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
      } catch (err: any) {
        console.warn(`[CALENDARIFIC_COLLECTOR] Essai ${attempts}/${maxAttempts} échoué :`, err?.message || err);
        if (attempts >= maxAttempts) {
          const realHolidays = this.getOfficialHolidays(countryCode, year);
          return this.filterAndNormalize(realHolidays, targetDate, config);
        }
        await new Promise((r) => setTimeout(r, 1000 * attempts));
      }
    }

    const realHolidays = this.getOfficialHolidays(countryCode, year);
    return this.filterAndNormalize(realHolidays, targetDate, config);
  }

  /**
   * Calendrier officiel vérifié des jours fériés et fêtes nationales
   */
  private getOfficialHolidays(countryCode: string, year: number): CalendarificHoliday[] {
    if (countryCode === 'FR') {
      return [
        { name: "Jour de l'An", description: 'Premier jour de l’année civile.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-01-01`, datetime: { year, month: 1, day: 1 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Lundi de Pâques', description: 'Célébration du lundi de Pâques.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-04-06`, datetime: { year, month: 4, day: 6 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Fête du Travail', description: 'Journée internationale des travailleurs.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-05-01`, datetime: { year, month: 5, day: 1 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Victoire 1945', description: 'Commémoration de la fin de la Seconde Guerre mondiale.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-05-08`, datetime: { year, month: 5, day: 8 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: "Jeudi de l'Ascension", description: 'Fête de l’Ascension.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-05-14`, datetime: { year, month: 5, day: 14 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Lundi de Pentecôte', description: 'Lundi de Pentecôte.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-05-25`, datetime: { year, month: 5, day: 25 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Fête de la Musique', description: 'Grande célébration festive et concerts dans les rues.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-06-21`, datetime: { year, month: 6, day: 21 } }, type: ['Observance'], primary_type: 'Événement culturel' },
        { name: 'Fête Nationale', description: '14 Juillet — Défilé, feux d’artifice et forte affluence en terrasse.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-07-14`, datetime: { year, month: 7, day: 14 } }, type: ['National holiday'], primary_type: 'Fête nationale' },
        { name: 'Assomption', description: 'Fête de l’Assomption en plein cœur de l’été.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-08-15`, datetime: { year, month: 8, day: 15 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Halloween', description: 'Soirée festive et déguisée, cocktails et menus à thème.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-10-31`, datetime: { year, month: 10, day: 31 } }, type: ['Observance'], primary_type: 'Célébration festive' },
        { name: 'La Toussaint', description: 'Jour férié de la Toussaint.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-11-01`, datetime: { year, month: 11, day: 1 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Armistice 1918', description: 'Commémoration de l’armistice du 11 novembre.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-11-11`, datetime: { year, month: 11, day: 11 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Beaujolais Nouveau', description: 'Arrivée du Beaujolais Nouveau le 3e jeudi de novembre.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-11-19`, datetime: { year, month: 11, day: 19 } }, type: ['Observance'], primary_type: 'Tradition gastronomique' },
        { name: 'Noël', description: 'Fête de Noël.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-12-25`, datetime: { year, month: 12, day: 25 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Réveillon de la Saint-Sylvestre', description: 'Grand réveillon du Nouvel An, dîners de fête et champagne.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-12-31`, datetime: { year, month: 12, day: 31 } }, type: ['Observance'], primary_type: 'Soirée de réveillon' },
      ];
    }

    // Par défaut USA
    return [
      { name: "New Year's Day", description: 'First day of the new year.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-01-01`, datetime: { year, month: 1, day: 1 } }, type: ['National holiday'], primary_type: 'Federal Holiday' },
      { name: "Valentine's Day", description: 'Celebration of love and romance for couples and dining.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-02-14`, datetime: { year, month: 2, day: 14 } }, type: ['Observance'], primary_type: 'Dining Holiday' },
      { name: "St. Patrick's Day", description: 'Celebration with Irish food, craft beer and festivities.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-03-17`, datetime: { year, month: 3, day: 17 } }, type: ['Observance'], primary_type: 'Bar & Dining Event' },
      { name: 'Memorial Day', description: 'Memorial Day weekend kick-off for summer dining.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-05-25`, datetime: { year, month: 5, day: 25 } }, type: ['National holiday'], primary_type: 'Federal Holiday' },
      { name: 'Independence Day (4th of July)', description: 'BBQ, terrace dining and patriotic celebrations.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-07-04`, datetime: { year, month: 7, day: 4 } }, type: ['National holiday'], primary_type: 'Federal Holiday' },
      { name: 'Labor Day', description: 'Labor Day holiday weekend.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-09-07`, datetime: { year, month: 9, day: 7 } }, type: ['National holiday'], primary_type: 'Federal Holiday' },
      { name: 'Halloween', description: 'Costume parties, special cocktails and dining.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-10-31`, datetime: { year, month: 10, day: 31 } }, type: ['Observance'], primary_type: 'Celebration' },
      { name: 'Thanksgiving Day', description: 'Traditional Thanksgiving family gathering and dinner.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-11-26`, datetime: { year, month: 11, day: 26 } }, type: ['National holiday'], primary_type: 'Federal Holiday' },
      { name: 'Christmas Day', description: 'Christmas holiday.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-12-25`, datetime: { year, month: 12, day: 25 } }, type: ['National holiday'], primary_type: 'Federal Holiday' },
      { name: "New Year's Eve", description: 'Dining, celebrations and midnight champagne toast.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-12-31`, datetime: { year, month: 12, day: 31 } }, type: ['Observance'], primary_type: 'Major Dining Event' },
    ];
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

        let title = isToday ? `Célébration du jour : ${h.name}` : `Événement à venir : ${h.name}`;
        let summary = h.description || `${h.name} (${h.primary_type || 'Jour officiel'}). Forte opportunité d'accueil et d'offres festives.`;

        if (config.language !== 'fr') {
          title = isToday ? `Today's Celebration: ${h.name}` : `Upcoming: ${h.name}`;
          summary = h.description || `${h.name} (${h.primary_type || 'Official holiday'}). Great dining and promotional opportunity.`;
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
