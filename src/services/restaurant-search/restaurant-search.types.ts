/**
 * Types pour la recherche et l'onboarding de restaurant.
 * Conçu pour être 100% compatible avec Google Places API / Google Maps.
 */

export interface RestaurantSearchResult {
  id: string; // Ex: Google Place ID ou ID interne
  name: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewsCount?: number;
  photoUrl?: string;
  cuisineType?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  isOpenNow?: boolean;
  photoGallery?: string[];
  googlePlaceId?: string;
}

export interface RestaurantSearchQuery {
  name: string;
  city: string;
}

export interface RestaurantSearchResponse {
  success: boolean;
  results: RestaurantSearchResult[];
  error?: string;
}
