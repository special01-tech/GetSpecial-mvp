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
 * Déduit le fuseau horaire IANA standard à partir du code pays et de la longitude.
 */
export function deduceTimezone(countryCode = 'FR', lon = 2.35): string {
  const code = (countryCode || 'FR').toUpperCase().trim();

  // Europe de l'Ouest
  if (['FR', 'BE', 'LU', 'MC', 'NL', 'DE', 'ES', 'IT', 'CH', 'AT'].includes(code)) {
    return 'Europe/Paris';
  }
  if (['GB', 'IE', 'PT'].includes(code)) {
    return 'Europe/London';
  }

  // Afrique francophone
  if (['CI', 'SN', 'ML', 'BF', 'GN', 'TG', 'BJ', 'NE'].includes(code)) {
    return 'Africa/Abidjan';
  }
  if (['CM', 'GA', 'CG', 'CD', 'TD', 'CF'].includes(code)) {
    return 'Africa/Douala';
  }
  if (['MA', 'DZ', 'TN'].includes(code)) {
    return 'Africa/Casablanca';
  }

  // Amérique du Nord
  if (code === 'CA') {
    return 'America/Toronto';
  }
  if (code === 'US') {
    if (lon <= -114.5) return 'America/Los_Angeles';
    if (lon <= -102.0) return 'America/Denver';
    if (lon <= -85.5) return 'America/Chicago';
    return 'America/New_York';
  }

  return 'Europe/Paris';
}

/**
 * Convertit une adresse textuelle en coordonnées géographiques (lat/lng) avec détails d'adresse mondiaux.
 * Utilise Nominatim OpenStreetMap avec support de tous les pays au monde.
 */
export async function geocodeAddress(address: string, fallbackCountry = 'FR'): Promise<GeocodeResult> {
  if (!address || address.trim().length === 0) {
    throw new Error('Adresse requise pour le géocodage');
  }

  try {
    const encoded = encodeURIComponent(address.trim());
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=1`, {
      headers: {
        'User-Agent': 'GetSpecial-App/1.0 (contact@getspecial.dev)',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
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
      const countryCode = (addr.country_code || fallbackCountry).toUpperCase();

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
          headers: {
            'User-Agent': 'GetSpecial-App/1.0 (contact@getspecial.dev)',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          },
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
            countryCode: (addr.country_code || fallbackCountry).toUpperCase(),
            country: addr.country,
            city: addr.city || addr.town || fallbackQuery,
            state: addr.state,
            postalCode: addr.postcode,
          };
        }
      }
    }
  } catch (err) {
    console.warn(`[GEOCODING_WARNING] Impossible de géocoder "${address}", utilisation du fallback`, err);
  }

  // Fallback propre (centre de la région / France au lieu de New York !)
  const cleanFallbackCountry = (fallbackCountry || 'FR').toUpperCase();
  return {
    latitude: cleanFallbackCountry === 'FR' ? 48.8566 : cleanFallbackCountry === 'CI' ? 5.3600 : 48.8566,
    longitude: cleanFallbackCountry === 'FR' ? 2.3522 : cleanFallbackCountry === 'CI' ? -4.0083 : 2.3522,
    displayName: address,
    countryCode: cleanFallbackCountry,
    country: cleanFallbackCountry === 'FR' ? 'France' : cleanFallbackCountry === 'CI' ? 'Côte d’Ivoire' : 'France',
    city: cleanFallbackCountry === 'FR' ? 'Paris' : cleanFallbackCountry === 'CI' ? 'Abidjan' : '',
    postalCode: undefined,
  };
}
