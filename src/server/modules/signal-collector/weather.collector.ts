import { NormalizedSignal } from './signal.types';
import { getCountryConfig, CountryConfig } from '@/server/lib/country-config';

export class WeatherCollector {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENWEATHERMAP_API_KEY;
  }

  /**
   * Récupère la météo courante et les prévisions par coordonnées.
   * S'adapte dynamiquement à n'importe quel pays dans le monde (langue, unités métrique/impérial, °F/°C).
   */
  async collect(lat: number, lon: number, country = 'US'): Promise<NormalizedSignal[]> {
    const config = getCountryConfig(country);

    if (!this.apiKey) {
      throw new Error(`OPENWEATHERMAP_API_KEY non configurée pour (${lat}, ${lon}).`);
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${config.units}&lang=${config.language}`;

    let attempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error(`OpenWeatherMap HTTP ${res.status} (${res.statusText})`);
        }

        const data = await res.json();
        return this.normalizeForecast(data, config);
      } catch (err: any) {
        lastError = err;
        console.warn(`[WEATHER_COLLECTOR] Essai ${attempts}/${maxAttempts} échoué :`, err?.message || err);
        if (attempts >= maxAttempts) {
          throw new Error(`Échec OpenWeatherMap après ${maxAttempts} tentatives : ${err?.message || err}`);
        }
        await new Promise((r) => setTimeout(r, 1000 * attempts));
      }
    }

    throw lastError || new Error('Échec inconnu lors de la récupération météo');
  }

  private normalizeForecast(data: any, config: CountryConfig): NormalizedSignal[] {
    const list = data?.list || [];
    const signals: NormalizedSignal[] = [];
    const isImperial = config.units === 'imperial';

    // On analyse les 4 prochains créneaux (12 prochaines heures)
    for (const item of list.slice(0, 4)) {
      const weatherMain = item.weather?.[0]?.main?.toLowerCase() || '';
      const weatherDesc = item.weather?.[0]?.description || '';
      const temp = Math.round(item.main?.temp ?? (isImperial ? 75 : 22));

      const isRain = weatherMain.includes('rain') || weatherMain.includes('drizzle');
      const isSun = weatherMain.includes('clear') && (isImperial ? temp >= 70 : temp >= 22);

      let intensity = 0.5;
      if (isRain) intensity = 0.8;
      if (isSun) intensity = 0.7;

      let title = `Weather: ${weatherDesc} (${temp}${config.tempUnit})`;
      let summary = `Temperature around ${temp}${config.tempUnit} with ${weatherDesc}. Wind at ${Math.round(item.wind?.speed ?? 0)} ${config.speedUnit}.`;

      if (config.language === 'fr') {
        title = isRain ? `Pluie prévue (${temp}${config.tempUnit})` : isSun ? `Grand soleil et douceur (${temp}${config.tempUnit})` : `Météo : ${weatherDesc} (${temp}${config.tempUnit})`;
        summary = `Température de ${temp}${config.tempUnit} avec ${weatherDesc}. Vent à ${Math.round(item.wind?.speed ?? 0)} ${config.speedUnit}.`;
      } else if (config.language === 'es') {
        title = isRain ? `Lluvia prevista (${temp}${config.tempUnit})` : isSun ? `Sol y temperatura agradable (${temp}${config.tempUnit})` : `Clima: ${weatherDesc} (${temp}${config.tempUnit})`;
        summary = `Temperatura alrededor de ${temp}${config.tempUnit} con ${weatherDesc}. Viento a ${Math.round(item.wind?.speed ?? 0)} ${config.speedUnit}.`;
      } else if (config.language === 'de') {
        title = isRain ? `Regen erwartet (${temp}${config.tempUnit})` : isSun ? `Sonnig und mild (${temp}${config.tempUnit})` : `Wetter: ${weatherDesc} (${temp}${config.tempUnit})`;
        summary = `Temperatur ca. ${temp}${config.tempUnit} mit ${weatherDesc}. Wind mit ${Math.round(item.wind?.speed ?? 0)} ${config.speedUnit}.`;
      } else if (config.language === 'it') {
        title = isRain ? `Pioggia prevista (${temp}${config.tempUnit})` : isSun ? `Sole e clima mite (${temp}${config.tempUnit})` : `Meteo: ${weatherDesc} (${temp}${config.tempUnit})`;
        summary = `Temperatura di circa ${temp}${config.tempUnit} con ${weatherDesc}. Vento a ${Math.round(item.wind?.speed ?? 0)} ${config.speedUnit}.`;
      } else {
        title = isRain ? `Rain Expected (${temp}${config.tempUnit})` : isSun ? `Sunny & Pleasant (${temp}${config.tempUnit})` : `Weather: ${weatherDesc} (${temp}${config.tempUnit})`;
      }

      signals.push({
        type: 'weather',
        source: 'openweathermap',
        intensity,
        timestamp: item.dt_txt || new Date().toISOString(),
        title,
        summary,
        rawPayload: { ...item, country: config.code, unit: config.tempUnit },
      });
    }

    return signals;
  }
}

export const weatherCollector = new WeatherCollector();
