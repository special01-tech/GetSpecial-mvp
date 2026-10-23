export interface GlossaryTerm {
  key: string;
  title: string;
  term?: string;
  definition?: string;
  formula?: string;
  example?: string;
  shortDefinition: string;
  longDefinition: string;
  howItsCalculatedTemplate: (params: Record<string, any>) => string;
}

export const GLOSSARY_FR: Record<string, GlossaryTerm> = {
  couvert: {
    key: 'couvert',
    title: 'Couvert',
    term: 'Couvert',
    definition: 'Une personne servie à table ou au comptoir.',
    shortDefinition: 'Une personne servie à table ou au comptoir.',
    longDefinition: 'Le couvert représente chaque client individuel qui consomme dans ton établissement. Une table de 4 personnes représente 4 couverts.',
    howItsCalculatedTemplate: ({ count }) => `${count ?? 1} personne(s) servie(s) = ${count ?? 1} couvert(s).`,
    example: 'Une table de 4 personnes représente 4 couverts comptabilisés.',
  },
  capacity: {
    key: 'capacity',
    title: 'Capacité de service',
    term: 'Capacité de service',
    definition: 'Le maximum de personnes que tu peux accueillir sur un service.',
    formula: 'Places assises × rotations',
    shortDefinition: 'Le maximum de personnes que tu peux accueillir sur un service.',
    longDefinition: 'La capacité correspond au nombre total de places assises multiplié par le nombre de rotations possibles de tes tables au cours du même service.',
    howItsCalculatedTemplate: ({ seats, rotations }) => `${seats || 40} places assises × ${rotations || 1} rotation = ${((seats || 40) * (rotations || 1))} couverts maximum.`,
    example: '40 places assises avec 1 rotation = 40 couverts maximum.',
  },
  service: {
    key: 'service',
    title: 'Service (Midi ou Soir)',
    term: 'Service (Midi ou Soir)',
    definition: 'Le créneau du midi ou du soir, comptabilisé séparément.',
    shortDefinition: 'Le créneau du midi ou du soir, comptabilisé séparément.',
    longDefinition: 'GetSpecial sépare rigoureusement le service du midi (avant 16h) et le service du soir (après 16h). Les clients de 23h à 3h du matin restent rattachés au service du soir de la veille.',
    howItsCalculatedTemplate: ({ cutoffHour }) => `Bascule automatique à ${cutoffHour || 16}h00 locale.`,
    example: 'Service midi jusqu’à 16h, service soir après 16h.',
  },
  off_peak: {
    key: 'off_peak',
    title: 'Créneau creux',
    term: 'Créneau creux',
    definition: 'Un moment où ta salle a habituellement des places libres.',
    shortDefinition: 'Un moment où ta salle a habituellement des places libres.',
    longDefinition: 'C’est toi qui définis tes créneaux calmes (ex: le mardi soir). GetSpecial ne propose une offre que sur ces moments creux et ne bradera jamais un service déjà complet.',
    howItsCalculatedTemplate: ({ days }) => `Jours déclarés comme calmes : ${days || 'Lundi, Mardi'}.`,
    example: 'Mardi soir configuré en créneau creux pour attirer des clients avec un mot-code.',
  },
  baseline: {
    key: 'baseline',
    title: 'Couverts habituels (Baseline B)',
    term: 'Couverts habituels (Baseline B)',
    definition: 'Ton affluence habituelle sur ce service sans aucune offre.',
    formula: 'Médiane des 8 dernières clôtures sans offre',
    shortDefinition: 'Ton affluence habituelle sur ce service sans aucune offre.',
    longDefinition: 'Au départ, c’est ton estimation déclarée. Dès que tu as enregistré au moins 4 clôtures sans offre pour ce même jour et ce même service, le système utilise la médiane de tes 8 dernières clôtures.',
    howItsCalculatedTemplate: ({ source, value, samples }) => `Valeur retenue : ${value || 12} couverts (${source === 'mesuré' ? `médiane de ${samples || 8} clôtures réelles` : 'valeur déclarée'}).`,
    example: '12 couverts habituels mesurés un mardi midi standard.',
  },
  target: {
    key: 'target',
    title: 'Objectif de couverts',
    term: 'Objectif de couverts',
    definition: 'Un quart des places habituellement vides à combler.',
    formula: '25% × (Capacité - Couverts habituels)',
    shortDefinition: 'Un quart des places habituellement vides à combler.',
    longDefinition: 'L’objectif est un repère réaliste pour mesurer le succès de ton offre, calculé comme 25% de tes places habituellement non occupées.',
    howItsCalculatedTemplate: ({ capacity, baseline, target }) => `Objectif = 25% de (${capacity || 40} places - ${baseline || 12} habituels) = ${target || 7} personnes.`,
    example: '25% de (40 places - 12 habituels) = 7 couverts cibles.',
  },
  effect: {
    key: 'effect',
    title: 'Effet estimé',
    term: 'Effet estimé',
    definition: 'Les couverts réellement gagnés en plus de ton habitude.',
    formula: 'Couverts réels - Couverts habituels',
    shortDefinition: 'Les couverts réellement gagnés en plus de ton habitude.',
    longDefinition: 'C’est la différence entre le nombre total de personnes servies ce jour-là et tes couverts habituels. Affiché seulement après 4 services comparables pour éviter qu’un jour exceptionnel ne fausse l’analyse.',
    howItsCalculatedTemplate: ({ actual, baseline, effect }) => `Effet = ${actual || 20} couverts réels - ${baseline || 12} habituels = +${effect || 8} couverts additionnels.`,
    example: '20 couverts réels - 12 habituels = +8 couverts additionnels.',
  },
  cannibalisation: {
    key: 'cannibalisation',
    title: 'Cannibalisation',
    term: 'Cannibalisation',
    definition: 'Clients ayant utilisé l’offre qui seraient venus de toute façon.',
    formula: 'max(0, Personnes offre - Effet estimé)',
    shortDefinition: 'Clients ayant utilisé l’offre qui seraient venus de toute façon.',
    longDefinition: 'Si 15 personnes ont demandé le mot-code mais que ta salle n’a gagné que 8 couverts par rapport à d’habitude, environ 7 clients fidèles ont simplement profité du cadeau sans créer de chiffre d’affaires additionnel.',
    howItsCalculatedTemplate: ({ persons, effect, result }) => `Cannibalisation = max(0, ${persons || 15} utilisateurs - ${effect || 8} nouveaux) = ${result || 7} clients habituels.`,
    example: 'max(0, 15 utilisateurs de l’offre - 8 nouveaux clients) = 7 habituels.',
  },
};

export type HelpTermKey = keyof typeof GLOSSARY_FR;
export const GLOSSARY = GLOSSARY_FR;
