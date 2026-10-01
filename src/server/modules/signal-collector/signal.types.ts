export interface NormalizedSignal {
  type: 'weather' | 'event' | 'holiday' | 'manual';
  intensity: number; // 0.0 à 1.0 (ou sévérité météo/affluence)
  source: string;    // 'openweathermap', 'ticketmaster', 'manual'
  timestamp: string; // ISO string de l'événement ou de l'observation
  title: string;     // Titre court et factuel
  summary: string;   // Description factuelle sans extrapolation
  rawPayload: Record<string, unknown>;
  data?: any;
}
