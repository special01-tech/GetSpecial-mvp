import { NormalizedSignal } from './signal.types';

/* =============================================================================
 * Weather Collector — Open-Meteo (Conforme Section 11.2 du Document Projet)
 *
 * API 100% gratuite, sans clé API requise, fournissant des prévisions mondiales
 * précises basées sur la géolocalisation du restaurant.
 * ============================================================================= */

export class WeatherCollector {
  /**
   * Récupère la météo courante et les prévisions via l'API Open-Meteo gratuite.
   */
  async collect(lat: number, lon: number): Promise<NormalizedSignal[]> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Open-Meteo HTTP ${res.status}`);
      }

      const data = await res.json();
      return this.normalizeOpenMeteo(data, lat, lon);
    } catch (err) {
      console.warn('[WEATHER_COLLECTOR] Erreur Open-Meteo, utilisation du fallback local :', err);
      return this.getFallbackSignals(lat, lon);
    }
  }

  /**
   * Normalise les données météo Open-Meteo en signaux exploitables
   */
  private normalizeOpenMeteo(data: any, lat: number, lon: number): NormalizedSignal[] {
    const current = data.current;
    const temp = Math.round(current?.temperature_2m ?? 22);
    const code = current?.weather_code ?? 0;
    const precip = current?.precipitation ?? 0;

    const signals: NormalizedSignal[] = [];

    // Détection Pluie / Averses
    if (code >= 51 || precip > 0.5) {
      signals.push({
        source: 'open-meteo',
        type: 'weather',
        timestamp: new Date(),
        intensity: code >= 63 || precip > 2 ? 0.95 : 0.75,
        payload: {
          condition: 'rain',
          description: code >= 95 ? 'Orages violents' : 'Pluie continue',
          temperature: temp,
          summary: `Pluie et ${temp}°C : forte incitation à la livraison et aux plats réconfortants.`,
          actionHint: 'Mettez en avant vos plats chauds, vos soupes ou une offre livraison offerte.',
        },
      });
    }
    // Détection Forte Chaleur / Beau temps
    else if (temp >= 28) {
      signals.push({
        source: 'open-meteo',
        type: 'weather',
        timestamp: new Date(),
        intensity: 0.9,
        payload: {
          condition: 'heat',
          description: 'Forte chaleur et soleil',
          temperature: temp,
          summary: `Forte chaleur (${temp}°C) : forte demande de boissons fraîches et terrasse ombragée.`,
          actionHint: 'Proposez des cocktails glacés, glaces ou salades fraîches.',
        },
      });
    }
    // Détection Froid
    else if (temp <= 10) {
      signals.push({
        source: 'open-meteo',
        type: 'weather',
        timestamp: new Date(),
        intensity: 0.85,
        payload: {
          condition: 'cold',
          description: 'Froid hivernal',
          temperature: temp,
          summary: `Temps froid (${temp}°C) : recherche d'ambiance cosy et de boissons chaudes.`,
          actionHint: 'Mettez en avant le chocolat chaud maison, cafés gourmands et gratins.',
        },
      });
    }
    // Beau temps tempéré (Terrasse)
    else {
      signals.push({
        source: 'open-meteo',
        type: 'weather',
        timestamp: new Date(),
        intensity: 0.8,
        payload: {
          condition: 'clear',
          description: 'Ciel dégagé et température agréable',
          temperature: temp,
          summary: `Météo idéale (${temp}°C) : opportunité terrasse et déjeuners à l'extérieur.`,
          actionHint: 'Invitez votre communauté à profiter de la terrasse pour le déjeuner.',
        },
      });
    }

    return signals;
  }

  private getFallbackSignals(lat: number, lon: number): NormalizedSignal[] {
    return [
      {
        source: 'open-meteo-fallback',
        type: 'weather',
        timestamp: new Date(),
        intensity: 0.8,
        payload: {
          condition: 'rain',
          description: 'Pluie prévue ce soir',
          temperature: 24,
          summary: 'Pluie prévue ce soir : opportunité livraison et plats chauds réconfortants.',
          actionHint: 'Proposez une offre spéciale livraison ou un plat gourmand de saison.',
        },
      },
    ];
  }
}

export const weatherCollector = new WeatherCollector();
