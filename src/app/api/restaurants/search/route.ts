import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';

export interface RestaurantSearchResult {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  cuisineType?: string;
  displayName: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || searchParams.get('name')?.trim() || '';
    const city = searchParams.get('city')?.trim() || '';

    if (!query && !city) {
      return error('Veuillez renseigner un nom ou une ville.', 400);
    }

    const searchQuery = `${query} ${city}`.trim();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'GetSpecial-App/1.0 (contact@getspecial.dev)',
            'Accept-Language': 'fr,en;q=0.8',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const places = await res.json();
        if (Array.isArray(places) && places.length > 0) {
          const results: RestaurantSearchResult[] = places.map((p: any, idx: number) => {
            const addr = p.address || {};
            const rawDisplayName = p.display_name || '';
            const chunks = rawDisplayName.split(',');
            const detectedName = query || chunks[0]?.trim() || 'Restaurant';
            const detectedCity =
              addr.city || addr.town || addr.village || addr.municipality || city || 'Paris';
            const detectedAddress = chunks.slice(0, 3).join(', ').trim();
            const detectedPostal = addr.postcode || '';
            const countryCode = (addr.country_code || 'fr').toUpperCase();

            return {
              id: `place_${p.place_id || p.osm_id || idx}_${Date.now()}`,
              name: detectedName,
              address: detectedAddress || `${detectedName}, ${detectedCity}`,
              city: detectedCity,
              postalCode: detectedPostal,
              country: countryCode,
              latitude: parseFloat(p.lat),
              longitude: parseFloat(p.lon),
              displayName: rawDisplayName,
            };
          });

          return success(results);
        }
      }
    } catch (apiErr) {
      console.warn('[SEARCH_API_WARNING] OpenStreetMap temporairement indisponible :', apiErr);
    }

    return success([]);
  } catch (err: any) {
    return error(err.message, 500);
  }
}
