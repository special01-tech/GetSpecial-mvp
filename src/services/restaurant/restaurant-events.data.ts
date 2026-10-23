export type EventCategory = 'concert' | 'sport' | 'festival' | 'special_day' | 'culture';

export interface RestaurantEvent {
  id: string;
  title: string;
  date: string; // Format ISO YYYY-MM-DD
  time?: string; // Ex: "20:30"
  category: EventCategory;
  imageUrl?: string;
  isActive: boolean;
  description?: string;
}

export const EVENT_CATEGORIES: { id: EventCategory; label: string }[] = [
  { id: 'concert', label: 'Concert' },
  { id: 'sport', label: 'Sport / Match' },
  { id: 'festival', label: 'Fête / Festival' },
  { id: 'special_day', label: 'Jour Férié' },
  { id: 'culture', label: 'Culture & Spectacle' },
];

// Zéro faux événement par défaut : chargé depuis la base réelle de l'établissement.
export const INITIAL_RESTAURANT_EVENTS: RestaurantEvent[] = [];
