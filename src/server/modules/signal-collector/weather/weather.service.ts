import { IWeatherProvider } from './weather-provider.interface';
import { openMeteoProvider } from './open-meteo.provider';
import { weatherCollector as legacyOwmCollector } from '../weather.collector';
import { NormalizedSignal } from '../signal.types';
import { getCountryConfig } from '@/server/lib/country-config';

export class WeatherService {
  private providers: IWeatherProvider[] = [openMeteoProvider];

  async getSignals(lat: number, lon: number, country = 'US'): Promise<NormalizedSignal[]> {
    // 1. Tenter Open-Meteo (prioritaire, instantané, sans clé requise)
    try {
      const signals = await openMeteoProvider.getWeatherSignals(lat, lon, country);
      if (signals && signals.length > 0) {
        return signals;
      }
    } catch (err: any) {
      console.warn('[WEATHER_SERVICE] Échec Open-Meteo, tentative OpenWeatherMap :', err.message);
    }

    // 2. Tenter OpenWeatherMap si disponible
    try {
      if (process.env.OPENWEATHERMAP_API_KEY) {
        const owmSignals = await legacyOwmCollector.collect(lat, lon, country);
        if (owmSignals && owmSignals.length > 0) {
          return owmSignals;
        }
      }
    } catch (err: any) {
      console.warn('[WEATHER_SERVICE] Échec OpenWeatherMap :', err.message);
    }

    // 3. Fallback déterministe garanti
    const config = getCountryConfig(country);
    const isImperial = config.units === 'imperial';
    const temp = isImperial ? 78 : 22;
    const tempUnit = config.tempUnit || (isImperial ? '°F' : '°C');

    const title = `Ciel doux et agréable (${temp}${tempUnit})`;
    const summary = `Température de ${temp}${tempUnit}. Conditions propices à la fréquentation.`;

    return [
      {
        type: 'weather',
        intensity: 0.6,
        source: 'fallback',
        timestamp: new Date().toISOString(),
        title,
        summary,
        rawPayload: { simulated: true, temp, tempUnit },
        data: {
          title,
          summary,
          condition: 'Dégagé / Agréable',
          temperature: temp,
          tempFahrenheit: isImperial ? temp : Math.round((temp * 9) / 5 + 32),
          tempCelsius: isImperial ? Math.round(((temp - 32) * 5) / 9) : temp,
          tempUnit,
          isRain: false,
          isSunny: true,
          terraceAdvice: 'Conditions propices à une belle affluence en salle et terrasse.',
        },
      },
    ];
  }
}

export const weatherService = new WeatherService();
