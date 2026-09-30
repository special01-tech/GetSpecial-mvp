/* =============================================================================
 * Formatters & Helpers de transformation pour l'API GetSpecial
 * ============================================================================= */

import type {
  OpportunityBadge,
  OpportunityIconType,
  IdeaFilter,
  PublicationStatus,
} from '@/types/dto';

/** Formate un grand nombre sous forme compacte française (ex: 42600 -> "42,6K", 1300 -> "1,3K") */
export function formatCompactNumber(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(1).replace('.', ',');
    return `${val}M`;
  }
  if (num >= 1_000) {
    const val = (num / 1_000).toFixed(1).replace('.', ',');
    return `${val}K`;
  }
  return num.toString();
}

/** Formate un taux d'évolution en chaîne (ex: 18 -> "+18%", -5 -> "-5%") */
export function formatPercentageGrowth(pct: number): string {
  if (pct === null || pct === undefined || isNaN(pct)) return '+0%';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${Math.round(pct)}%`;
}

/** Formate une date au format court "18 Avr" */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/** Formate une heure au format "12:00" */
export function formatTimeShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Détermine la période relative d'une opportunité */
export function formatRelativePeriod(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const isSameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isSameDay) return "Aujourd'hui";

  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7 && diffDays >= 0) return 'Cette semaine';
  return formatDateShort(d);
}

/** Mappe un type de signal vers un badge UI */
export function mapSignalToBadge(signalType?: string): OpportunityBadge {
  switch (signalType?.toLowerCase()) {
    case 'weather':
    case 'meteo':
      return 'Météo';
    case 'event':
    case 'evenement':
    case 'match':
    case 'concert':
      return 'Événement';
    case 'trend':
    case 'tendance':
      return 'Tendance';
    case 'holiday':
    case 'fete':
    case 'season':
      return 'Relance';
    default:
      return 'Offre spéciale';
  }
}

/** Mappe un type de signal vers une icône UI */
export function mapSignalToIconType(signalType?: string): OpportunityIconType {
  switch (signalType?.toLowerCase()) {
    case 'weather':
    case 'meteo':
      return 'weather';
    case 'sport':
    case 'match':
      return 'sport';
    case 'cocktail':
    case 'happyhour':
    case 'bar':
      return 'cocktail';
    case 'dish':
    case 'plat':
    case 'menu':
      return 'dish';
    case 'music':
    case 'concert':
      return 'music';
    case 'trend':
    case 'tendance':
      return 'trend';
    default:
      return 'calendar';
  }
}

/** Mappe une opportunité vers un filtre de la page Idées */
export function mapSignalToFilter(signalType?: string, suggestedAt?: Date | string): IdeaFilter {
  const period = formatRelativePeriod(suggestedAt || new Date());
  if (period === "Aujourd'hui") return 'today';

  switch (signalType?.toLowerCase()) {
    case 'weather':
      return 'weather';
    case 'event':
    case 'sport':
    case 'music':
      return 'events';
    case 'trend':
      return 'trends';
    case 'season':
    case 'holiday':
      return 'season';
    default:
      return 'week';
  }
}

/** Mappe le statut d'un post vers le statut de publication normalisé */
export function mapPostStatus(status: string): { status: PublicationStatus; label: string } {
  switch (status.toLowerCase()) {
    case 'published':
      return { status: 'published', label: 'Publiée' };
    case 'scheduled':
    case 'approved':
      return { status: 'scheduled', label: 'Programmée' };
    case 'pending_approval':
    case 'draft':
    default:
      return { status: 'to_publish', label: 'À publier' };
  }
}

/** Images par défaut de haute qualité selon le contexte */
export const DEFAULT_IMAGES = {
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
  cover: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  weather: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
  event: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  cocktail: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  dish: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  dessert: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
};
