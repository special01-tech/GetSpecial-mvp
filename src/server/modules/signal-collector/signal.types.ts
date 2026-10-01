export interface NormalizedSignal {
  type: 'weather' | 'event' | 'holiday' | 'manual';
  intensity: number; // 0.0 à 1.0 (ou sévérité météo/affluence)
  source: string;    // 'open-meteo', 'ticketmaster', 'calendarific', 'manual'
  timestamp: string; // ISO string de l'événement ou de l'observation
  title: string;     // Titre court et factuel
  summary: string;   // Description factuelle sans extrapolation
  payload?: {
    condition?: string;
    description?: string;
    temperature?: number;
    summary?: string;
    actionHint?: string;
  };
  rawPayload: Record<string, unknown>;
}
