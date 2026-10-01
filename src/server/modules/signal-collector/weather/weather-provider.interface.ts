import { NormalizedSignal } from '../signal.types';

export interface WeatherDataPayload {
  temperatureC: number;
  temperatureF: number;
  condition: string;
  isRain: boolean;
  rainProbability: number;
  isSunny: boolean;
  windSpeedKmh: number;
  humidityPercent: number;
  hourlyRainForecast?: { hour: string; rainMm: number; probaPercent: number }[];
  terraceAdvice?: string;
  source: string;
}

export interface IWeatherProvider {
  name: string;
  getWeatherSignals(lat: number, lon: number, country?: string): Promise<NormalizedSignal[]>;
}
