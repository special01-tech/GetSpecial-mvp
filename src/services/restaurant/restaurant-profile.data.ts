export type RestaurantTab = 'profile' | 'offers' | 'events' | 'accounts';

export interface OffPeakSlot {
  id: string;
  name: string; // Ex: "Après-midi calme", "Happy Hour"
  timeStart: string; // "15:00"
  timeEnd: string; // "18:30"
  days: string; // "Du Lundi au Vendredi"
}

export interface RestaurantProfileData {
  id?: string;
  name: string;
  type: string;
  tone: string;
  colors: string[];
  hasTerrace: boolean;
  hasDelivery: boolean;
  hasOffPeak?: boolean;
  offPeakSlots?: OffPeakSlot[];
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  website?: string;
  capacityCovers?: number | null;
  averageTicket?: number | null;
  specialties?: string[];
  baselineCovers?: number;
  openingHours: {
    day: string;
    isOpen: boolean;
    lunch: string;
    dinner: string;
  }[];
}

export const INITIAL_RESTAURANT_PROFILE: RestaurantProfileData = {
  name: 'Mon Restaurant',
  type: 'Restaurant traditionnel',
  tone: 'Chaleureux & Convivial',
  colors: ['#FF5A00', '#1A1A1A', '#F9FAFB'],
  hasTerrace: false,
  hasDelivery: false,
  hasOffPeak: false,
  offPeakSlots: [],
  openingHours: [
    { day: 'Lundi', isOpen: true, lunch: '12:00 - 14:30', dinner: '19:00 - 22:30' },
    { day: 'Mardi', isOpen: true, lunch: '12:00 - 14:30', dinner: '19:00 - 22:30' },
    { day: 'Mercredi', isOpen: true, lunch: '12:00 - 14:30', dinner: '19:00 - 22:30' },
    { day: 'Jeudi', isOpen: true, lunch: '12:00 - 14:30', dinner: '19:00 - 22:30' },
    { day: 'Vendredi', isOpen: true, lunch: '12:00 - 14:30', dinner: '19:00 - 23:00' },
    { day: 'Samedi', isOpen: true, lunch: '12:00 - 15:00', dinner: '19:00 - 23:00' },
    { day: 'Dimanche', isOpen: false, lunch: 'Fermé', dinner: 'Fermé' },
  ],
};
