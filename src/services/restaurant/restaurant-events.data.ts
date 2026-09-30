export type EventCategory = 'concert' | 'sport' | 'festival' | 'special_day' | 'culture';

export interface RestaurantEvent {
  id: string;
  title: string;
  date: string; // Ex: "2026-10-03" ou format d'affichage
  time?: string; // Ex: "20:30"
  category: EventCategory;
  imageUrl?: string;
  isActive: boolean; // toggle activation / désactivation
  description?: string;
}

export const EVENT_CATEGORIES: { id: EventCategory; label: string }[] = [
  { id: 'concert', label: 'Concert' },
  { id: 'sport', label: 'Sport / Match' },
  { id: 'festival', label: 'Fête / Festival' },
  { id: 'special_day', label: 'Jour Férié' },
  { id: 'culture', label: 'Culture & Spectacle' },
];

export const INITIAL_RESTAURANT_EVENTS: RestaurantEvent[] = [
  {
    id: 'evt_concert_live',
    title: 'Concert live acoustique',
    date: 'Vendredi 2 Oct. 2026',
    time: '20:30',
    category: 'concert',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    description: 'Set guitare et voix sur notre scène intérieure, ambiance intimiste et tapas.',
  },
  {
    id: 'evt_match_psg',
    title: 'Match PSG - Champions League',
    date: 'Mercredi 30 Sept. 2026',
    time: '21:00',
    category: 'sport',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    description: 'Diffusion grand écran en terrasse couverte avec formules bières et wings.',
  },
  {
    id: 'evt_fete_musique',
    title: 'Fête de la musique',
    date: 'Samedi 21 Juin 2026',
    time: '18:00',
    category: 'festival',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    isActive: false,
    description: 'Grande scène extérieure et bar éphémère devant l’établissement.',
  },
];
