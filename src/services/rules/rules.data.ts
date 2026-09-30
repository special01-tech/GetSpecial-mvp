export interface AssistantRulesData {
  // Section 1 : Pause globale
  globalPause: boolean;
  deleteAllScheduledOnPause: boolean;

  // Section 2 : Sujets autorisés
  topics: {
    weather: boolean; // Météo
    sport: boolean; // Sport
    concerts: boolean; // Concerts
    holidays: boolean; // Jours fériés
    offerReminders: boolean; // Rappels offres
  };

  // Section 3 : Sujets exclus
  excludedTopics: string[];
}

export const INITIAL_RULES_DATA: AssistantRulesData = {
  globalPause: false,
  deleteAllScheduledOnPause: false,
  topics: {
    weather: true,
    sport: true,
    concerts: true,
    holidays: true,
    offerReminders: true,
  },
  excludedTopics: ['Matchs', 'Politique', 'Religion'],
};
