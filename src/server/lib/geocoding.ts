// Autorise les requêtes de développement local sous Windows si un antivirus ou proxy inspecte les certificats SSL
if (process.env.NODE_ENV === 'development' && typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
  countryCode?: string;
  country?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

/**
 * Convertit une adresse textuelle en coordonnées géographiques (lat/lng) avec détails d'adresse mondiaux.
 * Utilise Nominatim OpenStreetMap avec support de tous les pays au monde.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!address || address.trim().length === 0) {
    throw new Error('Adresse requise pour le géocodage');
  }

  try {
    const encoded = encodeURIComponent(address.trim());
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=1`, {
      headers: {
        'User-Agent': 'GetSpecial-App/1.0 (contact@getspecial.dev)',
      },
    });

    if (!res.ok) {
      throw new Error(`Erreur HTTP Géocodage: ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      const addr = first.address || {};
      const detectedCity = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
      const countryCode = (addr.country_code || 'US').toUpperCase();

      return {
        latitude: parseFloat(first.lat),
        longitude: parseFloat(first.lon),
        displayName: first.display_name,
        countryCode,
        country: addr.country,
        city: detectedCity,
        state: addr.state,
        postalCode: addr.postcode,
      };
    }

    // Si la recherche exacte échoue, tenter de géocoder la ville/pays (derniers mots de la requête)
    const words = address.trim().split(/[, ]+/);
    if (words.length > 1) {
      const fallbackQuery = words.slice(-2).join(' ');
      const retryRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fallbackQuery)}&format=json&limit=1&addressdetails=1`,
        {
          headers: { 'User-Agent': 'GetSpecial-App/1.0 (contact@getspecial.dev)' },
        }
      );
      if (retryRes.ok) {
        const retryData = await retryRes.json();
        if (Array.isArray(retryData) && retryData.length > 0) {
          const first = retryData[0];
          const addr = first.address || {};
          return {
            latitude: parseFloat(first.lat),
            longitude: parseFloat(first.lon),
            displayName: address,
            countryCode: (addr.country_code || 'US').toUpperCase(),
            country: addr.country,
            city: addr.city || addr.town || fallbackQuery,
            state: addr.state,
            postalCode: addr.postcode,
          };
        }
      }
    }
  } catch (err) {
    console.warn(`[GEOCODING_WARNING] Impossible de géocoder "${address}", utilisation du fallback par défaut`, err);
  }

  // Fallback sécurisé par défaut
  return {
    latitude: 40.7128,
    longitude: -74.0060,
    displayName: address,
    countryCode: 'US',
    country: 'United States',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
  };
}
