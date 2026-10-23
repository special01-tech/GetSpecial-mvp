import { PlatformType } from '@/services/planning/planning.data';

export type OfferStatus = 'active' | 'scheduled' | 'draft' | 'archived';

export interface RestaurantOffer {
  id: string;
  name: string;
  description: string;
  image?: string;
  discount: string;
  period: string;
  date?: string;
  time?: string;
  status: OfferStatus;
  platforms: PlatformType[];
}

export interface RestaurantMenuData {
  sourceType: 'pdf' | 'image';
  name: string;
  fileSize?: string;
  uploadedAt: string;
  detectedCategories?: string[];
  extractedCount?: number;
}

// Zéro fausse donnée pré-remplie : les offres et menus proviennent exclusivement de la base réelle.
export const INITIAL_RESTAURANT_MENU: RestaurantMenuData | null = null;
export const INITIAL_RESTAURANT_OFFERS: RestaurantOffer[] = [];
