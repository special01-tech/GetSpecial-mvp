import { NormalizedSignal } from './signal.types';

export class WeatherCollector {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENWEATHERMAP_API_KEY;
  }

  /**
   * Récupère la météo courante et les prévisions par coordonnées.
   * Gère les timeouts et effectue jusqu'à 3 tentatives en cas d'échec.
   */
  async collect(lat: number, lon: number): Promise<NormalizedSignal[]> {
    if (!this.apiKey) {
      console.warn('[WEATHER_COLLECTOR] Pas de clé OPENWEATHERMAP_API_KEY configurée. Utilisation de données météo simulées.');
      return this.getFallbackSignals(lat, lon);
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=fr`;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error(`OpenWeatherMap HTTP ${res.status}`);
        }

        const data = await res.json();
        return this.normalizeForecast(data);
      } catch (err) {
        console.warn(`[WEATHER_COLLECTOR] Essai ${attempts}/${maxAttempts} échoué :`, err);
        if (attempts >= maxAttempts) {
          return this.getFallbackSignals(lat, lon);
        }
        await new Promise((r) => setTimeout(r, 1000 * attempts));
      }
    }

    return this.getFallbackSignals(lat, lon);
  }

  private normalizeForecast(data: any): NormalizedSignal[] {
    const list = data?.list || [];
    const signals: NormalizedSignal[] = [];

    // On analyse les 4 prochains créneaux (12 prochaines heures)
    for (const item of list.slice(0, 4)) {
      const weatherMain = item.weather?.[0]?.main?.toLowerCase() || '';
      const weatherDesc = item.weather?.[0]?.description || '';
      const temp = Math.round(item.main?.temp ?? 20);
      const isRain = weatherMain.includes('rain') || weatherMain.includes('drizzle');
      const isSun = weatherMain.includes('clear') && temp >= 22;
      const isCold = temp < 10;

      let intensity = 0.5;
      if (isRain) intensity = 0.8;
      if (isSun) intensity = 0.7;

      signals.push({
        type: 'weather',
        source: 'openweathermap',
        intensity,
        timestamp: item.dt_txt || new Date().toISOString(),
        title: isRain ? `Pluie prévue (${temp}°C)` : isSun ? `Grand soleil et douceur (${temp}°C)` : `Météo : ${weatherDesc} (${temp}°C)`,
        summary: `Température de ${temp}°C avec ${weatherDesc}. Vent à ${Math.round(item.wind?.speed ?? 0)} m/s.`,
        rawPayload: item,
      });
    }

    return signals;
  }

  private getFallbackSignals(lat: number, lon: number): NormalizedSignal[] {
    return [
      {
        type: 'weather',
        source: 'openweathermap',
        intensity: 0.7,
        timestamp: new Date().toISOString(),
        title: 'Ciel dégagé et température agréable (22°C)',
        summary: 'Conditions idéales pour le service en terrasse ce midi.',
        rawPayload: { simulated: true, lat, lon },
      },
    ];
  }
}

export const weatherCollector = new WeatherCollector();
