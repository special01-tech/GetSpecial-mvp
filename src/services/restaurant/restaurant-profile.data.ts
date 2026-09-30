export type RestaurantTab = 'profile' | 'offers' | 'events' | 'accounts';

export interface RestaurantProfileData {
  name: string;
  type: string;
  tone: string;
  colors: string[];
  hasTerrace: boolean;
  hasDelivery: boolean;
  address?: string;
  phone?: string;
  openingHours: {
    day: string;
    isOpen: boolean;
    lunch: string;
    dinner: string;
  }[];
}

export const INITIAL_RESTAURANT_PROFILE: RestaurantProfileData = {
  name: 'The Brass Pelican',
  type: 'American Bistro & Craft Bar',
  tone: 'Warm & Welcoming',
  colors: ['#1B4332', '#2D6A4F', '#D8F3DC', '#B7E4C7', '#FAFAF7'],
  hasTerrace: true,
  hasDelivery: true,
  openingHours: [
    { day: 'Monday', isOpen: true, lunch: '11:30 AM - 2:30 PM', dinner: '5:00 PM - 10:00 PM' },
    { day: 'Tuesday', isOpen: true, lunch: '11:30 AM - 2:30 PM', dinner: '5:00 PM - 10:00 PM' },
    { day: 'Wednesday', isOpen: true, lunch: '11:30 AM - 2:30 PM', dinner: '5:00 PM - 10:00 PM' },
    { day: 'Thursday', isOpen: true, lunch: '11:30 AM - 2:30 PM', dinner: '5:00 PM - 10:30 PM' },
    { day: 'Friday', isOpen: true, lunch: '11:30 AM - 2:30 PM', dinner: '5:00 PM - 11:30 PM' },
    { day: 'Saturday', isOpen: true, lunch: '11:00 AM - 3:00 PM', dinner: '5:00 PM - 11:30 PM' },
    { day: 'Sunday', isOpen: true, lunch: '11:00 AM - 3:00 PM', dinner: '5:00 PM - 9:00 PM' },
  ],
};
