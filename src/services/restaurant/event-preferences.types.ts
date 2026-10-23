export interface EventCategoryPreferences {
  sport: boolean;      // Sports, matchs, tournois
  concert: boolean;    // Concerts, musique live, festivals
  arts: boolean;       // Théâtre, spectacles, musées, comédie
  holiday: boolean;    // Fêtes nationales, célébrations, jours fériés
  internal: boolean;   // Événements créés par le restaurant lui-même
}

export interface RestaurantEventPreferences {
  categories: EventCategoryPreferences;
  radiusKm: number;          // Rayon en km (ex: 5, 15, 25)
  excludedKeywords: string[]; // Mots-clés à filtrer
}

export const DEFAULT_EVENT_PREFERENCES: RestaurantEventPreferences = {
  categories: {
    sport: true,
    concert: true,
    arts: true,
    holiday: true,
    internal: true,
  },
  radiusKm: 15,
  excludedKeywords: [],
};
