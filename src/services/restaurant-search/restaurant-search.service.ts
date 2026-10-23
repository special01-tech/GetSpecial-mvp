import {
  RestaurantSearchResult,
  RestaurantSearchQuery,
  RestaurantSearchResponse,
} from './restaurant-search.types';

export interface IRestaurantSearchService {
  search(query: RestaurantSearchQuery): Promise<RestaurantSearchResponse>;
  scrapePlace(candidate: RestaurantSearchResult): Promise<{ success: boolean; data?: any; error?: string }>;
  getPlaceDetails?(placeId: string): Promise<RestaurantSearchResult | null>;
}

class RestaurantSearchService implements IRestaurantSearchService {
  async search(query: RestaurantSearchQuery): Promise<RestaurantSearchResponse> {
    const cleanName = query.name?.trim() || '';
    const cleanCity = query.city?.trim() || '';
    const cleanCountry = (query.country?.trim() || 'FR').toUpperCase();

    if (!cleanName && !cleanCity) {
      return {
        success: false,
        results: [],
        error: 'Veuillez renseigner le nom ou la ville de votre restaurant.',
      };
    }

    // 1. Recherche légère via le moteur Google Maps / Nominatim unifié
    try {
      const res = await fetch('/api/restaurant/scrape-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          restaurantName: cleanName,
          city: cleanCity,
          country: cleanCountry,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const candidates = json.candidates || (json.data && json.data.candidates) || [];
        if (Array.isArray(candidates) && candidates.length > 0) {
          const results: RestaurantSearchResult[] = candidates.map((c: any, idx: number) => ({
            id: c.googlePlaceId || c.id || `candidate_${idx}`,
            name: c.name || cleanName,
            address: c.address || (c.city ? `${c.name}, ${c.city}` : c.name),
            city: c.city || cleanCity,
            country: (c.country || cleanCountry).toUpperCase(),
            postalCode: c.postalCode,
            latitude: c.latitude != null ? Number(c.latitude) : undefined,
            longitude: c.longitude != null ? Number(c.longitude) : undefined,
            rating: c.rating ?? undefined,
            reviewsCount: c.reviewsCount ?? undefined,
            photoUrl: c.photoUrl,
            cuisineType: c.cuisineType || 'Restaurant',
            googlePlaceId: c.googlePlaceId || c.id,
            mapsUrl: c.mapsUrl,
            rawScraped: c,
          }));

          return {
            success: true,
            results,
          };
        }
      }
    } catch (err) {
      console.warn('[RESTAURANT_SEARCH] scrape-maps léger échoué, essai fallback:', err);
    }

    // 2. Fallback via /api/restaurants/search
    try {
      const params = new URLSearchParams();
      if (cleanName) params.set('name', cleanName);
      if (cleanCity) params.set('city', cleanCity);
      if (cleanCountry) params.set('country', cleanCountry);

      const res = await fetch(`/api/restaurants/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return {
            success: true,
            results: json.data,
          };
        }
      }
      return {
        success: false,
        results: [],
        error: 'Aucun établissement correspondant trouvé.',
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

  /**
   * Étape 2 : Scraping approfondi d'UNE SEULE FICHE validée par l'utilisateur
   */
  async scrapePlace(candidate: RestaurantSearchResult): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch('/api/restaurant/scrape-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scrape',
          url: candidate.mapsUrl,
          restaurantName: candidate.name,
          candidate,
          city: candidate.city,
          country: candidate.country,
          address: candidate.address,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors du scraping de la fiche.');
      }

      const placeData = json.restaurant || json.payload || (json.data && (json.data.restaurant || json.data.payload)) || json.data;
      return {
        success: true,
        data: placeData,
      };
    } catch (err: any) {
      console.warn('[RESTAURANT_SCRAPE_ERROR]', err);
      return {
        success: false,
        error: err.message || 'Impossible d\'importer les détails de cet établissement.',
      };
    }
  }

  async getPlaceDetails(placeId: string): Promise<RestaurantSearchResult | null> {
    return null;
  }
}

export const restaurantSearchService = new RestaurantSearchService();
