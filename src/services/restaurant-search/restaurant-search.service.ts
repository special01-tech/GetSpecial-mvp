import {
  RestaurantSearchResult,
  RestaurantSearchQuery,
  RestaurantSearchResponse,
} from './restaurant-search.types';

export interface IRestaurantSearchService {
  search(query: RestaurantSearchQuery): Promise<RestaurantSearchResponse>;
  getPlaceDetails?(placeId: string): Promise<RestaurantSearchResult | null>;
}

class RestaurantSearchService implements IRestaurantSearchService {
  async search(query: RestaurantSearchQuery): Promise<RestaurantSearchResponse> {
    const cleanName = query.name?.trim() || '';
    const cleanCity = query.city?.trim() || '';
    const cleanCountry = query.country?.trim() || '';

    if (!cleanName && !cleanCity) {
      return {
        success: false,
        results: [],
        error: 'Veuillez renseigner le nom ou la ville de votre restaurant.',
      };
    }

    try {
      const params = new URLSearchParams();
      if (cleanName) params.set('name', cleanName);
      if (cleanCity) params.set('city', cleanCity);
      if (cleanCountry) params.set('country', cleanCountry);

      const res = await fetch(`/api/restaurants/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return {
            success: true,
            results: json.data,
          };
        }
      }
      return {
        success: false,
        results: [],
        error: 'Échec de la recherche d\'établissement.',
      };
    } catch (err) {
      console.warn('[RESTAURANT_SEARCH] Erreur réseau lors de la recherche:', err);
      return {
        success: false,
        results: [],
        error: 'Erreur réseau lors de la recherche.',
      };
    }
  }

  async getPlaceDetails(placeId: string): Promise<RestaurantSearchResult | null> {
    return null;
  }
}

export const restaurantSearchService = new RestaurantSearchService();
