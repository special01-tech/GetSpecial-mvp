import { PlatformType } from '@/services/planning/planning.data';

export type OfferStatus = 'active' | 'scheduled' | 'draft' | 'archived';

export interface RestaurantOffer {
  id: string;
  name: string;
  description: string;
  image: string;
  discount: string;
  period: string;
  date?: string;
  time?: string;
  status: OfferStatus;
  platforms: PlatformType[];
}

export const INITIAL_RESTAURANT_OFFERS: RestaurantOffer[] = [
  {
    id: 'off_wings_50',
    name: 'Happy Hour Wings 50% Off',
    description: 'Enjoy 50% off crispy smoked jumbo wings from 4:30 PM to 6:30 PM before tip-off!',
    image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80',
    discount: '50% OFF',
    period: 'Today • 4:30 PM - 6:30 PM',
    date: '2026-09-30',
    time: '4:45 PM',
    status: 'active',
    platforms: ['instagram', 'facebook', 'google_business'],
  },
  {
    id: 'off_happy_hour',
    name: 'Happy Hour Cocktails & Sliders',
    description: 'Signature craft cocktails for $8 and half-price bar sliders from 4 PM to 7 PM.',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
    discount: '$8 Cocktails',
    period: 'Tue - Fri • 4:00 PM - 7:00 PM',
    date: '2026-10-01',
    time: '4:00 PM',
    status: 'scheduled',
    platforms: ['instagram', 'facebook'],
  },
  {
    id: 'off_lunch_special',
    name: 'Quick Express Lunch Combo',
    description: 'Entrée + side and iced tea for $14.99 served in under 15 minutes for office workers.',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    discount: '$14.99 Combo',
    period: 'Mon - Fri • 11:30 AM - 2:00 PM',
    date: '2026-10-02',
    time: '11:00 AM',
    status: 'draft',
    platforms: ['google_business'],
  },
];
