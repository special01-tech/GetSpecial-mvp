import { IWeatherProvider, WeatherDataPayload } from './weather-provider.interface';
import { NormalizedSignal } from '../signal.types';
import { getCountryConfig } from '@/server/lib/country-config';

interface WeatherCacheEntry {
  timestamp: number;
  signals: NormalizedSignal[];
}

export class OpenMeteoProvider implements IWeatherProvider {
  name = 'open-meteo';
  private cache = new Map<string, WeatherCacheEntry>();
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes de cache

  async getWeatherSignals(lat: number, lon: number, country = 'FR'): Promise<NormalizedSignal[]> {
    const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}_${country}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.signals;
    }

    const config = getCountryConfig(country);
    // Requête HTTP épurée : suppression des séries horaires inutilisées et réduction à 1 jour
    const currentVars = 'temperature_2m,relative_humidity_2m,is_day,precipitation,rain,weather_code,wind_speed_10m';
    const hourlyVars = 'precipitation_probability';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${currentVars}&hourly=${hourlyVars}&timezone=auto&forecast_days=1`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        if (cached) {
          return cached.signals;
        }
        throw new Error(`Open-Meteo HTTP ${res.status}`);
      }

      const data = await res.json();
      const signals = this.transformOpenMeteo(data, config, lat, lon);
      this.cache.set(cacheKey, { timestamp: now, signals });
      return signals;
    } catch (err) {
      clearTimeout(timeout);
      if (cached) {
        return cached.signals;
      }
      throw err;
    }
  }

  private transformOpenMeteo(data: any, config: any, lat: number, lon: number): NormalizedSignal[] {
    const current = data.current || {};
    if (typeof current.temperature_2m !== 'number') {
      throw new Error('Données de température Open-Meteo absentes ou non numériques');
    }

    const tempC = Math.round(current.temperature_2m);
    const tempF = Math.round((tempC * 9) / 5 + 32);
    const weatherCode = current.weather_code ?? 0;
    const rainMm = current.rain ?? current.precipitation ?? 0;
    const isDay = current.is_day !== 0; // 1 = jour, 0 = nuit
    const windSpeed = Math.round(current.wind_speed_10m ?? 10);
    const humidity = Math.round(current.relative_humidity_2m ?? 50);

    // Calcul de la vraie probabilité de pluie pour les 6 prochaines heures depuis hourly
    let maxHourlyRainProb = 0;
    if (Array.isArray(data.hourly?.precipitation_probability)) {
      const nextSlots = data.hourly.precipitation_probability.slice(0, 6);
      maxHourlyRainProb = Math.max(0, ...nextSlots.filter((v: any) => typeof v === 'number'));
    }

    const isRain = weatherCode >= 51 && weatherCode <= 67 || weatherCode >= 80 && weatherCode <= 82 || rainMm > 0.1 || maxHourlyRainProb >= 60;
    const isSnow = weatherCode >= 71 && weatherCode <= 77 || weatherCode >= 85 && weatherCode <= 86;
    const isThunderstorm = weatherCode >= 95;
    const isSunny = isDay && (weatherCode === 0 || weatherCode === 1) && tempC >= 18;

    let conditionText = 'Ciel dégagé';
    if (weatherCode === 0) conditionText = isDay ? 'Ensoleillé / Ciel bleu' : 'Nuit claire et dégagée';
    else if (weatherCode === 1 || weatherCode === 2) conditionText = isDay ? 'Éclaircies agréables' : 'Nuit peu nuageuse';
    else if (weatherCode === 3) conditionText = 'Couvert';
    else if (weatherCode === 45 || weatherCode === 48) conditionText = 'Brouillard';
    else if (weatherCode >= 51 && weatherCode <= 55) conditionText = 'Bruine légère';
    else if (weatherCode >= 61 && weatherCode <= 65) conditionText = 'Pluie continue';
    else if (isSnow) conditionText = 'Chutes de neige';
    else if (weatherCode >= 80 && weatherCode <= 82) conditionText = 'Averses passagères';
    else if (isThunderstorm) conditionText = 'Risque d’orage';

    let terraceAdvice = isSunny
      ? 'Idéal pour le service en terrasse ce midi et ce soir.'
      : isRain
      ? 'Pluie prévue ou en cours : privilégiez la livraison ou le réconfort en salle.'
      : isSnow
      ? 'Temps neigeux : ambiance cocon et plats chauds réconfortants en salle.'
      : 'Temps doux propice aux repas en salle ou terrasse abritée.';

    const isImperial = config.units === 'imperial';
    const displayTemp = isImperial ? tempF : tempC;
    const tempUnit = config.tempUnit || (isImperial ? '°F' : '°C');

    let intensity = 0.5;
    if (isThunderstorm || isSnow) intensity = 0.9;
    else if (isRain) intensity = 0.85;
    else if (isSunny) intensity = 0.8;

    const payload: WeatherDataPayload = {
      temperatureC: tempC,
      temperatureF: tempF,
      condition: conditionText,
      isRain,
      rainProbability: maxHourlyRainProb > 0 ? maxHourlyRainProb : (isRain ? 80 : 10),
      isSunny,
      windSpeedKmh: windSpeed,
      humidityPercent: humidity,
      terraceAdvice,
      source: 'open-meteo',
    };

    const title = isRain
      ? `Pluie constatée ou imminente (${displayTemp}${tempUnit})`
      : isSunny
      ? `Grand soleil et météo clémente (${displayTemp}${tempUnit})`
      : isSnow
      ? `Conditions hivernales et neige (${displayTemp}${tempUnit})`
      : `Conditions météo : ${conditionText} (${displayTemp}${tempUnit})`;

    const summary = `${conditionText}, température de ${displayTemp}${tempUnit}. ${terraceAdvice}`;
    const nowIso = new Date().toISOString();
    const dateHourKey = nowIso.slice(0, 13); // ex: '2026-10-19T11'
    const externalId = `wx_openmeteo_${lat.toFixed(2)}_${lon.toFixed(2)}_${dateHourKey}`;

    return [
      {
        externalId,
        type: 'weather',
        category: 'weather',
        intensity,
        source: 'open-meteo',
        timestamp: nowIso,
        startsAt: nowIso,
        endsAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
        isFallback: false,
        title,
        summary,
        rawPayload: payload as unknown as Record<string, unknown>,
        data: {
          title,
          summary,
          category: 'weather',
          condition: conditionText,
          temperature: displayTemp,
          tempFahrenheit: tempF,
          tempCelsius: tempC,
          tempUnit,
          isRain,
          isSunny,
          rainProbability: payload.rainProbability,
          terraceAdvice,
          startsAt: nowIso,
          raw: payload as unknown as Record<string, unknown>,
        },
      },
    ];
  }
}

export const openMeteoProvider = new OpenMeteoProvider();
