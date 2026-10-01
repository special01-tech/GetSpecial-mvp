import { IWeatherProvider, WeatherDataPayload } from './weather-provider.interface';
import { NormalizedSignal } from '../signal.types';
import { getCountryConfig } from '@/server/lib/country-config';

export class OpenMeteoProvider implements IWeatherProvider {
  name = 'open-meteo';

  async getWeatherSignals(lat: number, lon: number, country = 'FR'): Promise<NormalizedSignal[]> {
    const config = getCountryConfig(country);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,rain,weather_code&timezone=auto&forecast_days=2`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Open-Meteo HTTP ${res.status}`);
      }

      const data = await res.json();
      return this.transformOpenMeteo(data, config);
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  private transformOpenMeteo(data: any, config: any): NormalizedSignal[] {
    const current = data.current || {};
    const tempC = Math.round(current.temperature_2m ?? 20);
    const tempF = Math.round((tempC * 9) / 5 + 32);
    const weatherCode = current.weather_code ?? 0;
    const rainMm = current.rain ?? current.precipitation ?? 0;
    const windSpeed = Math.round(current.wind_speed_10m ?? 10);
    const humidity = Math.round(current.relative_humidity_2m ?? 50);

    const isRain = weatherCode >= 51 || rainMm > 0.1;
    const isSunny = (weatherCode === 0 || weatherCode === 1) && tempC >= 18;

    let conditionText = 'Ciel dégagé';
    if (weatherCode === 0) conditionText = 'Ensoleillé / Ciel bleu';
    else if (weatherCode === 1 || weatherCode === 2) conditionText = 'Éclaircies agréables';
    else if (weatherCode === 3) conditionText = 'Couvert';
    else if (weatherCode >= 51 && weatherCode <= 55) conditionText = 'Bruine légère';
    else if (weatherCode >= 61 && weatherCode <= 65) conditionText = 'Pluie continue';
    else if (weatherCode >= 80 && weatherCode <= 82) conditionText = 'Averses passagères';
    else if (weatherCode >= 95) conditionText = 'Orages';

    let terraceAdvice = isSunny
      ? 'Idéal pour le service en terrasse ce midi et ce soir.'
      : isRain
      ? 'Pluie prévue : privilégiez la livraison ou le réconfort en salle.'
      : 'Temps doux propice aux repas en salle ou terrasse abritée.';

    const isImperial = config.units === 'imperial';
    const displayTemp = isImperial ? tempF : tempC;
    const tempUnit = config.tempUnit || (isImperial ? '°F' : '°C');

    let intensity = 0.5;
    if (isRain) intensity = 0.85;
    if (isSunny) intensity = 0.8;

    const payload: WeatherDataPayload = {
      temperatureC: tempC,
      temperatureF: tempF,
      condition: conditionText,
      isRain,
      rainProbability: isRain ? 85 : 15,
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
      : `Conditions météo : ${conditionText} (${displayTemp}${tempUnit})`;

    const summary = `${conditionText}, température de ${displayTemp}${tempUnit}. ${terraceAdvice}`;

    return [
      {
        type: 'weather',
        intensity,
        source: 'open-meteo',
        timestamp: new Date().toISOString(),
        title,
        summary,
        rawPayload: payload as unknown as Record<string, unknown>,
        data: {
          title,
          summary,
          condition: conditionText,
          temperature: displayTemp,
          tempFahrenheit: tempF,
          tempCelsius: tempC,
          tempUnit,
          isRain,
          isSunny,
          terraceAdvice,
          raw: payload,
        },
      },
    ];
  }
}

export const openMeteoProvider = new OpenMeteoProvider();
