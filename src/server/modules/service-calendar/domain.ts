/**
 * Fonctions pures du calendrier de service.
 * DAY_ROLLOVER_HOUR : 4h du matin (avant 4h, on appartient au service de la veille).
 * SERVICE_CUTOFF_HOUR : 16h (avant 16h = midi, après = soir).
 */

export const DAY_ROLLOVER_HOUR = 4;
export const SERVICE_CUTOFF_HOUR = 16;

export type ServiceType = 'midi' | 'soir';

export interface ServiceDateResult {
  serviceDateStr: string; // YYYY-MM-DD
  service: ServiceType;
  dayOfWeek: string; // 'monday', 'tuesday', etc.
}

export function calculateServiceSlot(
  now: Date,
  timeZone: string = 'Europe/Paris'
): ServiceDateResult {
  // Calculer l'heure locale dans le fuseau du restaurant
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  parts.forEach((p) => {
    partMap[p.type] = p.value;
  });

  let year = parseInt(partMap.year, 10);
  let month = parseInt(partMap.month, 10);
  let day = parseInt(partMap.day, 10);
  const hour = parseInt(partMap.hour, 10);

  // Règle DAY_ROLLOVER_HOUR : Avant 4h, on reste sur la date de la veille
  if (hour < DAY_ROLLOVER_HOUR) {
    const prevDate = new Date(Date.UTC(year, month - 1, day - 1));
    year = prevDate.getUTCFullYear();
    month = prevDate.getUTCMonth() + 1;
    day = prevDate.getUTCDate();
  }

  // Règle SERVICE_CUTOFF_HOUR : Avant 16h = midi, >= 16h = soir
  const service: ServiceType = hour < SERVICE_CUTOFF_HOUR && hour >= DAY_ROLLOVER_HOUR ? 'midi' : 'soir';

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  // Nom du jour en minuscule
  const localDateObj = new Date(`${dateStr}T12:00:00Z`);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = days[localDateObj.getUTCDay()];

  return {
    serviceDateStr: dateStr,
    service,
    dayOfWeek,
  };
}

export function isSlotOffPeak(
  dayOfWeek: string,
  service: ServiceType,
  declaredOffPeakDays: string[]
): boolean {
  if (!declaredOffPeakDays || declaredOffPeakDays.length === 0) return false;
  const normalized = declaredOffPeakDays.map((d) => d.toLowerCase());
  return normalized.some((d) => d.includes(dayOfWeek) || d.includes(service));
}
