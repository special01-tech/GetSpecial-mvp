import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';

export interface RestaurantSearchResult {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  rating?: number;
  reviewsCount?: number;
  cuisineType: string;
  phone?: string;
  openingHours?: string;
  isOpenNow?: boolean;
  photoUrl?: string;
  photoGallery?: string[];
  googlePlaceId?: string;
}

function deduceCuisineType(name: string, country: string): string {
  const lower = (name || '').toLowerCase();
  if (lower.includes('pizz')) return 'Pizzeria & Cuisine italienne';
  if (lower.includes('burg') || lower.includes('fast') || lower.includes('snack') || lower.includes('street') || lower.includes('tacos') || lower.includes('kebab')) return 'Burgers & Street Food';
  if (lower.includes('café') || lower.includes('cafe') || lower.includes('coffee') || lower.includes('brunch')) return 'Café & Salon de thé';
  if (lower.includes('bar') || lower.includes('pub') || lower.includes('cocktail') || lower.includes('lounge') || lower.includes('brasserie')) return 'Bar & Brasserie';
  if (lower.includes('boulangerie') || lower.includes('bakery') || lower.includes('croissant') || lower.includes('patisserie') || lower.includes('pâtisserie')) return 'Boulangerie & Pâtisserie';
  if (lower.includes('sushi') || lower.includes('ramen') || lower.includes('thai') || lower.includes('asia') || lower.includes('wok')) return 'Cuisine asiatique & Wok';
  if (lower.includes('bistrot') || lower.includes('bistro')) return 'Bistrot & Vins de terroir';
  if (lower.includes('grill') || lower.includes('steak') || lower.includes('bbq') || lower.includes('viande')) return 'Grillades & Viandes';
  if (country === 'US') return 'American Bistro & Craft Dining';
  return 'Restaurant traditionnel & Cuisine de saison';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name')?.trim() || searchParams.get('q')?.trim() || '';
    const city = searchParams.get('city')?.trim() || '';
    const country = (searchParams.get('country')?.trim() || 'FR').toUpperCase();

    if (!name && !city) {
      return error('Veuillez renseigner le nom ou la ville de votre établissement.', 400);
    }

    // Recherche via OpenStreetMap Nominatim
    const searchQuery = [name, city].filter(Boolean).join(' ');
    try {
      const countryParam = country ? `&countrycodes=${country.toLowerCase()}` : '';
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&addressdetails=1&extratags=1${countryParam}`,
        { headers: { 'User-Agent': 'GetSpecial-App/1.0 (contact@getspecial.dev)' } }
      );
      if (res.ok) {
        const livePlaces = await res.json();
        if (Array.isArray(livePlaces) && livePlaces.length > 0) {
          const results: RestaurantSearchResult[] = livePlaces.map((p: any, idx: number) => {
            const addr = p.address || {};
            const tags = p.extratags || {};
            const countryCode = (addr.country_code || country).toUpperCase();
            const rawDisplayName = p.display_name || '';
            const chunks = rawDisplayName.split(',');
            const detectedName = chunks[0]?.trim() || name || 'Restaurant';
            const detectedCity = addr.city || addr.town || addr.village || addr.municipality || city;
            const detectedAddress = chunks.slice(0, 3).join(', ').trim();
            const detectedPostal = addr.postcode || '';

            const detectedType = addr.amenity || addr.cuisine || tags.cuisine || 'Restaurant';
            const cuisineType =
              detectedType === 'restaurant'
                ? 'Restaurant traditionnel'
                : detectedType === 'cafe'
                ? 'Café & Salon de thé'
                : detectedType === 'fast_food'
                ? 'Restauration rapide'
                : detectedType === 'bar'
                ? 'Bar & Brasserie'
                : deduceCuisineType(detectedName, countryCode);

            const realPhone = tags.phone || tags['contact:phone'] || addr.phone || undefined;
            const realOpeningHours = tags.opening_hours || undefined;

            return {
              id: `place_osm_${p.place_id || p.osm_id || idx}_${Date.now()}`,
              name: detectedName,
              address: detectedAddress || [detectedName, detectedCity].filter(Boolean).join(', '),
              city: detectedCity,
              state: addr.state || undefined,
              postalCode: detectedPostal,
              country: countryCode,
              latitude: parseFloat(p.lat),
              longitude: parseFloat(p.lon),
              rating: undefined,
              reviewsCount: undefined,
              cuisineType,
              phone: realPhone,
              openingHours: realOpeningHours,
              isOpenNow: true,
              photoUrl: undefined,
              googlePlaceId: `osm_${p.place_id || idx}`,
            };
          });

          return success(results);
        }
      }
    } catch (apiErr: any) {
      console.warn('[SEARCH_API_LIVE_WARNING] Recherche indisponible:', apiErr?.message || apiErr);
    }

    // Aucun établissement trouvé : pas de simulation, renvoi d'un tableau vide
    return success([]);
  } catch (err: any) {
    console.error('[SEARCH_API_FATAL_ERROR]', err);
    return error(err.message || 'Erreur lors de la recherche', 500);
  }
}
