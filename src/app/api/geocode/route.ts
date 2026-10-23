import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * Proxy de géocodage sécurisé côté serveur (OpenStreetMap Nominatim)
 * Évite les blocages CORS, les erreurs d'en-tête User-Agent et le rate-limiting navigateur.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'search'; // 'search' | 'reverse'
    const q = searchParams.get('q')?.trim() || '';
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const countryCode = searchParams.get('country')?.trim().toLowerCase() || '';

    const headers = {
      'User-Agent': 'GetSpecial-App/1.0 (contact@getspecial.dev)',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    };

    if (mode === 'reverse') {
      if (!lat || !lon) {
        return error('Coordonnées lat et lon requises pour le reverse geocoding.', 400);
      }
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        return error('Erreur lors de la détection GPS.', res.status);
      }
      const data = await res.json();
      return success(data);
    }

    if (!q || q.length < 3) {
      return success([]);
    }

    const countryParam = countryCode ? `&countrycodes=${countryCode}` : '';
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q
    )}&format=json&limit=5&addressdetails=1${countryParam}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      return error('Erreur lors de la recherche d’adresses.', res.status);
    }
    const data = await res.json();
    return success(data);
  } catch (err: any) {
    console.error('[GEOCODE_API_ERROR]', err);
    return error(err.message || 'Erreur serveur de géocodage.', 500);
  }
}
