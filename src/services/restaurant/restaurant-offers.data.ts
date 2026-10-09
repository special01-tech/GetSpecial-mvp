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

export interface RestaurantMenuData {
  sourceType: 'pdf' | 'url' | 'image';
  name: string;
  url?: string;
  fileSize?: string;
  uploadedAt: string;
  detectedCategories?: string[];
  extractedCount?: number;
}

export const INITIAL_RESTAURANT_MENU: RestaurantMenuData = {
  sourceType: 'pdf',
  name: 'carte_restaurant_saison.pdf',
  fileSize: '2.1 Mo',
  uploadedAt: '08 oct. 2026',
  detectedCategories: ['Formules Déjeuner', 'Plats Signatures', 'Planches & Apéro', 'Desserts Maison'],
  extractedCount: 3,
};

export const INITIAL_RESTAURANT_OFFERS: RestaurantOffer[] = [
  {
    id: 'off_formule_midi',
    name: 'Formule Déjeuner Express (Entrée + Plat)',
    description: 'Entrée fraîcheur du marché + Plat du jour mijoté + Pain au levain artisanal.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    discount: '16,50 €',
    period: 'Du Lundi au Vendredi • 12h00 - 14h30',
    date: '2026-10-09',
    time: '12:00',
    status: 'active',
    platforms: ['instagram', 'facebook', 'google_business'],
  },
  {
    id: 'off_happy_hour',
    name: 'Happy Hour Cocktails & Planche Tapas',
    description: 'Cocktails signature à 8 € et planche apéritive mixte à moitié prix pour l’afterwork.',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
    discount: '-30% sur les verres',
    period: 'Du Mardi au Vendredi • 17h30 - 19h30',
    date: '2026-10-09',
    time: '17:30',
    status: 'active',
    platforms: ['instagram', 'facebook'],
  },
  {
    id: 'off_brunch_dimanche',
    name: 'Brunch Gourmand & Buffet Sucré-Salé',
    description: 'Boissons chaudes à volonté, avocado toast, œufs bio, viennoiseries et jus pressés.',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    discount: '26,00 €',
    period: 'Le Dimanche • 11h00 - 15h00',
    date: '2026-10-11',
    time: '11:00',
    status: 'scheduled',
    platforms: ['instagram', 'google_business'],
  },
];
