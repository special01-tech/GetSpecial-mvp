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
}

/**
 * Calcul perpétuel de la date du Dimanche de Pâques (Algorithme de Butcher / Meeus)
 * Fonctionne pour n'importe quelle année grégorienne sans date codée en dur.
 */
function getEasterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = mars, 4 = avril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function addDaysToDate(year: number, month: number, day: number, daysToAdd: number): { year: number; month: number; day: number; iso: string } {
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const da = d.getUTCDate();
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
  return { year: y, month: m, day: da, iso };
}

function getNthDayOfWeek(year: number, month: number, dayOfWeek: number, n: number): { year: number; month: number; day: number; iso: string } {
  const date = new Date(Date.UTC(year, month - 1, 1));
  let count = 0;
  while (date.getUTCMonth() === month - 1) {
    if (date.getUTCDay() === dayOfWeek) {
      count++;
      if (count === n) {
        const da = date.getUTCDate();
        return { year, month, day: da, iso: `${year}-${String(month).padStart(2, '0')}-${String(da).padStart(2, '0')}` };
      }
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return { year, month, day: 1, iso: `${year}-${String(month).padStart(2, '0')}-01` };
}

function getLastDayOfWeek(year: number, month: number, dayOfWeek: number): { year: number; month: number; day: number; iso: string } {
  const date = new Date(Date.UTC(year, month, 0)); // Dernier jour du mois
  while (date.getUTCDay() !== dayOfWeek) {
    date.setUTCDate(date.getUTCDate() - 1);
  }
  const da = date.getUTCDate();
  return { year, month, day: da, iso: `${year}-${String(month).padStart(2, '0')}-${String(da).padStart(2, '0')}` };
}

interface CalendarificCacheEntry {
  timestamp: number;
  signals: NormalizedSignal[];
}

export class CalendarificCollector {
  private readonly apiKey: string | undefined;
  private cache = new Map<string, CalendarificCacheEntry>();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 heures de cache

  constructor() {
    this.apiKey = process.env.CALENDARIFIC_API_KEY;
  }

  /**
   * Récupère les jours fériés et célébrations officielles pour le pays.
   * Optimisé : requête ciblée sur le mois en cours et les types majeurs, avec cache mémoire 24h.
   */
  async collect(country = 'FR', targetDate: Date = new Date()): Promise<NormalizedSignal[]> {
    const config = getCountryConfig(country);
    const countryCode = config.code;
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1; // 1 à 12
    const day = targetDate.getDate();

    // Cache mémoire (24h)
    const dateKey = targetDate.toISOString().slice(0, 10);
    const cacheKey = `${countryCode}_${year}_${month}_${dateKey}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.signals;
    }

    // Périodes à interroger : mois courant et mois suivant (fenêtre d'anticipation de 30-45 jours)
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const targetsToFetch: { y: number; m: number }[] = [
      { y: year, m: month },
      { y: nextYear, m: nextMonth },
    ];

    const baseHolidays = targetsToFetch.flatMap(({ y }) => this.getCalculatedHolidays(countryCode, y));

    if (!this.apiKey || this.apiKey.includes('...') || this.apiKey.trim() === '') {
      const fallbackSignals = this.filterAndNormalize(baseHolidays, targetDate, config, true);
      this.cache.set(cacheKey, { timestamp: now, signals: fallbackSignals });
      return fallbackSignals;
    }

    try {
      const allFetched: CalendarificHoliday[] = [];

      for (const { y, m } of targetsToFetch) {
        const url = `https://calendarific.com/api/v2/holidays?api_key=${this.apiKey}&country=${countryCode}&year=${y}&month=${m}&type=national,observance`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);

          if (res.ok) {
            const data = await res.json();
            const holidays: CalendarificHoliday[] = data?.response?.holidays || [];
            allFetched.push(...holidays);
          } else {
            console.warn(`[CALENDARIFIC_COLLECTOR] HTTP ${res.status} pour ${countryCode}/${y}/${m}.`);
          }
        } catch {
          clearTimeout(timeout);
        }
      }

      // Fusionner les fêtes réelles Calendarific avec le calendrier officiel perpétuel (déduplication automatique par date et nom)
      const mergedHolidays = [...allFetched, ...baseHolidays];
      const signals = this.filterAndNormalize(mergedHolidays, targetDate, config, false);
      this.cache.set(cacheKey, { timestamp: now, signals });
      return signals;
    } catch (err: any) {
      console.warn('[CALENDARIFIC_COLLECTOR] Exception réseau Calendarific :', err?.message || err);
      const fallbackSignals = this.filterAndNormalize(baseHolidays, targetDate, config, true);
      this.cache.set(cacheKey, { timestamp: now, signals: fallbackSignals });
      return fallbackSignals;
    }
  }

  /**
   * Calcul déterministe perpétuel des jours fériés et célébrations majeures
   * Ne dépend pas d'une année codée en dur.
   */
  private getCalculatedHolidays(countryCode: string, year: number): CalendarificHoliday[] {
    const easter = getEasterSunday(year);
    const easterMonday = addDaysToDate(year, easter.month, easter.day, 1);
    const ascension = addDaysToDate(year, easter.month, easter.day, 39);
    const pentecostMonday = addDaysToDate(year, easter.month, easter.day, 50);

    if (countryCode === 'FR') {
      return [
        { name: "Jour de l'An", description: 'Premier jour de l’année civile.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-01-01`, datetime: { year, month: 1, day: 1 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Lundi de Pâques', description: 'Célébration du lundi de Pâques.', country: { id: 'fr', name: 'France' }, date: { iso: easterMonday.iso, datetime: { year, month: easterMonday.month, day: easterMonday.day } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Fête du Travail', description: 'Journée internationale des travailleurs.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-05-01`, datetime: { year, month: 5, day: 1 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Victoire 1945', description: 'Commémoration de la fin de la Seconde Guerre mondiale.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-05-08`, datetime: { year, month: 5, day: 8 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: "Jeudi de l'Ascension", description: 'Fête de l’Ascension.', country: { id: 'fr', name: 'France' }, date: { iso: ascension.iso, datetime: { year, month: ascension.month, day: ascension.day } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Lundi de Pentecôte', description: 'Lundi de Pentecôte.', country: { id: 'fr', name: 'France' }, date: { iso: pentecostMonday.iso, datetime: { year, month: pentecostMonday.month, day: pentecostMonday.day } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Fête de la Musique', description: 'Grande célébration festive et concerts dans les rues.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-06-21`, datetime: { year, month: 6, day: 21 } }, type: ['Observance'], primary_type: 'Événement culturel' },
        { name: 'Fête Nationale (14 Juillet)', description: 'Défilé, feux d’artifice et forte affluence en terrasse.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-07-14`, datetime: { year, month: 7, day: 14 } }, type: ['National holiday'], primary_type: 'Fête nationale' },
        { name: 'Assomption', description: 'Fête de l’Assomption en plein cœur de l’été.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-08-15`, datetime: { year, month: 8, day: 15 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Halloween', description: 'Soirée festive et déguisée, cocktails et menus à thème.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-10-31`, datetime: { year, month: 10, day: 31 } }, type: ['Observance'], primary_type: 'Célébration festive' },
        { name: 'La Toussaint', description: 'Jour férié de la Toussaint.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-11-01`, datetime: { year, month: 11, day: 1 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Armistice 1918', description: 'Commémoration de l’armistice du 11 novembre.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-11-11`, datetime: { year, month: 11, day: 11 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Noël', description: 'Fête de Noël.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-12-25`, datetime: { year, month: 12, day: 25 } }, type: ['National holiday'], primary_type: 'Jour férié' },
        { name: 'Réveillon Saint-Sylvestre', description: 'Grand réveillon du Nouvel An, dîners de fête et champagne.', country: { id: 'fr', name: 'France' }, date: { iso: `${year}-12-31`, datetime: { year, month: 12, day: 31 } }, type: ['Observance'], primary_type: 'Soirée de réveillon' },
      ];
    }

    if (countryCode === 'US') {
      const memorialDay = getLastDayOfWeek(year, 5, 1); // Dernier lundi de mai
      const laborDay = getNthDayOfWeek(year, 9, 1, 1);   // 1er lundi de septembre
      const thanksgiving = getNthDayOfWeek(year, 11, 4, 4); // 4e jeudi de novembre

      return [
        { name: "New Year's Day", description: 'First day of the new year.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-01-01`, datetime: { year, month: 1, day: 1 } }, type: ['National holiday'], primary_type: 'Federal Holiday' },
        { name: "Valentine's Day", description: 'Celebration of love and dining for couples.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-02-14`, datetime: { year, month: 2, day: 14 } }, type: ['Observance'], primary_type: 'Dining Holiday' },
        { name: "St. Patrick's Day", description: 'Celebration with craft beer and festive food.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-03-17`, datetime: { year, month: 3, day: 17 } }, type: ['Observance'], primary_type: 'Bar & Dining Event' },
        { name: 'Memorial Day', description: 'Memorial Day weekend kick-off for terrace dining.', country: { id: 'us', name: 'United States' }, date: { iso: memorialDay.iso, datetime: { year, month: memorialDay.month, day: memorialDay.day } }, type: ['National holiday'], primary_type: 'Federal Holiday' },
        { name: 'Independence Day (4th of July)', description: 'BBQ, terrace dining and patriotic celebrations.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-07-04`, datetime: { year, month: 7, day: 4 } }, type: ['National holiday'], primary_type: 'Federal Holiday' },
        { name: 'Labor Day', description: 'Labor Day holiday weekend.', country: { id: 'us', name: 'United States' }, date: { iso: laborDay.iso, datetime: { year, month: laborDay.month, day: laborDay.day } }, type: ['National holiday'], primary_type: 'Federal Holiday' },
        { name: 'Halloween', description: 'Costume parties, special cocktails and dining.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-10-31`, datetime: { year, month: 10, day: 31 } }, type: ['Observance'], primary_type: 'Celebration' },
        { name: 'Thanksgiving Day', description: 'Traditional Thanksgiving gathering and dinners.', country: { id: 'us', name: 'United States' }, date: { iso: thanksgiving.iso, datetime: { year, month: thanksgiving.month, day: thanksgiving.day } }, type: ['National holiday'], primary_type: 'Federal Holiday' },
        { name: 'Christmas Day', description: 'Christmas holiday.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-12-25`, datetime: { year, month: 12, day: 25 } }, type: ['National holiday'], primary_type: 'Federal Holiday' },
        { name: "New Year's Eve", description: 'Dining, celebrations and midnight champagne toast.', country: { id: 'us', name: 'United States' }, date: { iso: `${year}-12-31`, datetime: { year, month: 12, day: 31 } }, type: ['Observance'], primary_type: 'Major Dining Event' },
      ];
    }

    // Autres pays internationaux : Jours de fête universels uniquement (pas d'injection de fêtes US !)
    return [
      { name: "New Year's Day", description: 'First day of the new year.', country: { id: countryCode.toLowerCase(), name: countryCode }, date: { iso: `${year}-01-01`, datetime: { year, month: 1, day: 1 } }, type: ['National holiday'], primary_type: 'Holiday' },
      { name: "Valentine's Day", description: 'Romantic dining occasion.', country: { id: countryCode.toLowerCase(), name: countryCode }, date: { iso: `${year}-02-14`, datetime: { year, month: 2, day: 14 } }, type: ['Observance'], primary_type: 'Celebration' },
      { name: 'Christmas Day', description: 'Christmas celebration.', country: { id: countryCode.toLowerCase(), name: countryCode }, date: { iso: `${year}-12-25`, datetime: { year, month: 12, day: 25 } }, type: ['National holiday'], primary_type: 'Holiday' },
      { name: "New Year's Eve", description: 'New Year celebration and dining.', country: { id: countryCode.toLowerCase(), name: countryCode }, date: { iso: `${year}-12-31`, datetime: { year, month: 12, day: 31 } }, type: ['Observance'], primary_type: 'Celebration' },
    ];
  }

  private filterAndNormalize(
    holidays: CalendarificHoliday[],
    targetDate: Date,
    config: CountryConfig,
    isFallback: boolean
  ): NormalizedSignal[] {
    const signals: NormalizedSignal[] = [];
    const nowMs = targetDate.getTime();
    // Fenêtre d'anticipation de 30 jours (permet aux restaurateurs de capter les fêtes du mois : Halloween, Toussaint, etc.)
    const anticipationWindowMs = 30 * 24 * 3600 * 1000;

    // Déduplication par date ISO + nom
    const seen = new Set<string>();

    for (const h of holidays) {
      // Filtrer les types non pertinents (heures d'été, saisons, journées internationales anecdotiques)
      const typesJoined = (h.type || []).join(' ').toLowerCase();
      if (typesJoined.includes('clock') || typesJoined.includes('season') || typesJoined.includes('equinox') || typesJoined.includes('solstice')) {
        continue;
      }

      const targetIso = new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone }).format(targetDate);
      const isToday = h.date.iso === targetIso;

      const holidayDate = new Date(`${h.date.iso}T00:00:00Z`);
      const diffMs = holidayDate.getTime() - nowMs;

      // Détecter si le jour férié est aujourd'hui ou dans les 30 prochains jours
      if (diffMs >= -24 * 3600 * 1000 && diffMs <= anticipationWindowMs) {
        const key = `${h.date.iso}_${h.name.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const isNational = h.type.some((t) => t.toLowerCase().includes('national') || t.toLowerCase().includes('federal'));
        const intensity = isNational ? 0.9 : 0.65;

        let title = isToday ? `Célébration du jour : ${h.name}` : `Événement à venir : ${h.name}`;
        let summary = h.description || `${h.name} (${h.primary_type || 'Jour officiel'}). Forte opportunité d'accueil et d'offres festives.`;

        if (config.language !== 'fr') {
          title = isToday ? `Today's Celebration: ${h.name}` : `Upcoming: ${h.name}`;
          summary = h.description || `${h.name} (${h.primary_type || 'Official holiday'}). Great dining and promotional opportunity.`;
        }

        const externalId = `cal_${config.code}_${h.date.iso}_${h.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}`;

        signals.push({
          externalId,
          type: 'holiday',
          category: 'holiday',
          source: 'calendarific',
          intensity,
          timestamp: holidayDate.toISOString(),
          startsAt: holidayDate.toISOString(),
          endsAt: new Date(`${h.date.iso}T23:59:59Z`).toISOString(),
          isFallback,
          title,
          summary,
          data: {
            title,
            summary,
            category: 'holiday',
            venue: config.name,
            startsAt: holidayDate.toISOString(),
            raw: {
              country: config.code,
              name: h.name,
              date: h.date.iso,
              types: h.type,
              primary_type: h.primary_type,
              isFallback,
            },
          },
          rawPayload: {
            country: config.code,
            name: h.name,
            date: h.date.iso,
            types: h.type,
            primary_type: h.primary_type,
            isFallback,
          },
        });
      }
    }

    return signals;
  }
}

export const calendarificCollector = new CalendarificCollector();
