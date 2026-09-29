export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

/**
 * Convertit une adresse textuelle en coordonnées géographiques (lat/lng).
 * Utilise Nominatim OpenStreetMap avec fallback d'urgence.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!address || address.trim().length === 0) {
    throw new Error('Adresse requise pour le géocodage');
  }

  try {
    const encoded = encodeURIComponent(address.trim());
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`, {
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
      return {
        latitude: parseFloat(first.lat),
        longitude: parseFloat(first.lon),
        displayName: first.display_name,
      };
    }
  } catch (err) {
    console.warn(`[GEOCODING_WARNING] Impossible de géocoder "${address}", fallback Paris`, err);
  }

  // Fallback sécurisé : centre de Paris
  return {
    latitude: 48.8566,
    longitude: 2.3522,
    displayName: address,
  };
}
