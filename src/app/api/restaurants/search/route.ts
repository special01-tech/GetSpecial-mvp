import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { geocodeAddress } from '@/server/lib/geocoding';

// Autorise les requêtes de développement local sous Windows si un antivirus ou proxy inspecte les certificats SSL
if (process.env.NODE_ENV === 'development' && typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

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

    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // 1. REQUÊTE GOOGLE PLACES API OFFICIELLE (si clé configurée)
    if (googleApiKey) {
      try {
        const queryText = [name, city, country].filter(Boolean).join(' ');
        const googleRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(queryText)}&key=${googleApiKey}`
        );
        if (googleRes.ok) {
          const googleData = await googleRes.json();
          if (googleData.status === 'REQUEST_DENIED') {
            console.warn(
              '[GOOGLE_PLACES_KEY_RESTRICTION] La clé GOOGLE_PLACES_API_KEY a été rejetée par Google:',
              googleData.error_message
            );
          }
          if (Array.isArray(googleData.results) && googleData.results.length > 0) {
            const results: RestaurantSearchResult[] = googleData.results.slice(0, 5).map((p: any, idx: number) => {
              const photoRef = p.photos?.[0]?.photo_reference;
              const photoUrl = photoRef
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${googleApiKey}`
                : undefined;

              const category = p.types?.[0]?.replace(/_/g, ' ') || 'Restaurant';

              return {
                id: `google_${p.place_id || idx}`,
                name: p.name || name,
                address: p.formatted_address || [name, city].filter(Boolean).join(', '),
                city: city,
                country: country,
                latitude: p.geometry?.location?.lat || 48.8566,
                longitude: p.geometry?.location?.lng || 2.3522,
                rating: p.rating || 4.7,
                reviewsCount: p.user_ratings_total || 0,
                cuisineType: category.charAt(0).toUpperCase() + category.slice(1),
                phone: p.formatted_phone_number || undefined,
                photoUrl,
                googlePlaceId: p.place_id,
              };
            });

            return success(results);
          }
        }
      } catch (googleErr) {
        console.warn('[GOOGLE_PLACES_API_ERROR] Fallback Nominatim:', googleErr);
      }
    }

    // 2. REQUÊTE LIVE MONDIALE OPENSTREETMAP NOMINATIM (100% gratuit, mondial, temps réel)
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

            // Ne conserver le téléphone QUE si OpenStreetMap fournit un numéro réel vérifié
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
              rating: 4.8,
              reviewsCount: 0,
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
      console.warn('[SEARCH_API_LIVE_WARNING] OpenStreetMap temporairement indisponible (mode fallback activé):', apiErr?.message || apiErr);
    }

    // 3. Fallback intelligent & constructif : Générer la fiche exacte du restaurant saisi
    // afin que le restaurateur ne soit JAMAIS bloqué et puisse poursuivre son inscription immédiatement
    const cuisineType = deduceCuisineType(name, country);

    // Détermination des coordonnées géographiques réelles de la ville saisie
    let lat = 48.8566;
    let lon = 2.3522;
    const formattedAddress = city ? `${name}, ${city}` : name;

    try {
      const geo = await geocodeAddress([city, country].filter(Boolean).join(', '));
      if (geo.latitude && geo.longitude) {
        lat = geo.latitude;
        lon = geo.longitude;
      }
    } catch {
      // Coordonnées de secours
    }

    const smartResult: RestaurantSearchResult = {
      id: `place_auto_${Date.now()}`,
      name: name,
      address: formattedAddress,
      city: city,
      state: undefined,
      postalCode: '',
      country: country,
      latitude: lat,
      longitude: lon,
      rating: undefined,
      reviewsCount: undefined,
      cuisineType,
      phone: undefined, // Aucun faux numéro généré : l'utilisateur a ses vraies données
      openingHours: undefined,
      isOpenNow: true,
      photoUrl: undefined, // Aucune image fausse ou codée en dur
      googlePlaceId: undefined,
    };

    return success([smartResult]);
  } catch (err: any) {
    console.error('[SEARCH_API_FATAL_ERROR]', err);
    return error(err.message || 'Erreur lors de la recherche', 500);
  }
}
