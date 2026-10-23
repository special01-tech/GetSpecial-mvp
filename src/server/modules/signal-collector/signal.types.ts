export interface SignalDataPayload {
  title: string;
  summary: string;
  category?: string;
  venue?: string;
  url?: string;
  distanceMeters?: number;
  startsAt?: string;
  endsAt?: string;
  // Métriques Météo
  condition?: string;
  temperature?: number;
  tempCelsius?: number;
  tempFahrenheit?: number;
  tempUnit?: string;
  isRain?: boolean;
  isSunny?: boolean;
  rainProbability?: number;
  terraceAdvice?: string;
  imageUrl?: string;
  raw?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface NormalizedSignal {
  externalId: string;
  type: 'weather' | 'event' | 'holiday' | 'manual';
  category?: 'sport' | 'concert' | 'arts' | 'family' | 'holiday' | 'weather' | 'manual' | 'other';
  intensity: number; // 0.0 à 1.0
  source: string;    // 'open-meteo', 'openweathermap', 'ticketmaster', 'calendarific', 'manual'
  timestamp: string; // ISO string
  startsAt?: string; // ISO string début réel
  endsAt?: string;   // ISO string fin réelle
  distanceMeters?: number; // distance calculée en mètres
  isFallback?: boolean;
  title: string;     // Titre court et factuel
  summary: string;   // Description factuelle sans extrapolation
  data: SignalDataPayload;
  rawPayload: Record<string, unknown>;
}

