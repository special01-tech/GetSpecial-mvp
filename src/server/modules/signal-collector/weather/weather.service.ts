import { IWeatherProvider } from './weather-provider.interface';
import { openMeteoProvider } from './open-meteo.provider';
import { weatherCollector as legacyOwmCollector } from '../weather.collector';
import { NormalizedSignal } from '../signal.types';
import { getCountryConfig } from '@/server/lib/country-config';

export class WeatherService {
  private providers: IWeatherProvider[] = [openMeteoProvider];

  async getSignals(lat: number, lon: number, country = 'FR'): Promise<NormalizedSignal[]> {
    let openMeteoError: string | null = null;
    let owmError: string | null = null;

    // 1. Tenter Open-Meteo (prioritaire, données météo réelles mondiales)
    try {
      const signals = await openMeteoProvider.getWeatherSignals(lat, lon, country);
      if (signals && signals.length > 0) {
        return signals;
      }
    } catch (err: any) {
      openMeteoError = err.message || 'Erreur réseau Open-Meteo';
      console.warn('[WEATHER_SERVICE] Échec Open-Meteo, tentative OpenWeatherMap :', openMeteoError);
    }

    // 2. Tenter OpenWeatherMap si clé disponible
    try {
      if (process.env.OPENWEATHERMAP_API_KEY) {
        const owmSignals = await legacyOwmCollector.collect(lat, lon, country);
        if (owmSignals && owmSignals.length > 0) {
          return owmSignals;
        }
      } else {
        owmError = 'OPENWEATHERMAP_API_KEY non configurée';
      }
    } catch (err: any) {
      owmError = err.message || 'Erreur réseau OpenWeatherMap';
      console.warn('[WEATHER_SERVICE] Échec OpenWeatherMap :', owmError);
    }

    // Pas de fausses données inventées : lever une vraie erreur pour le dev et l'affichage
    throw new Error(
      `Impossible de récupérer la météo réelle pour les coordonnées (${lat}, ${lon}) : Open-Meteo (${openMeteoError || 'Aucune donnée'}), OpenWeatherMap (${owmError || 'Échec'})`
    );
  }
}

export const weatherService = new WeatherService();
