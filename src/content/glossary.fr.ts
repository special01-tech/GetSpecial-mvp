export interface GlossaryTerm {
  key: string;
  title: string;
  shortDefinition: string;
  longDefinition: string;
  howItsCalculatedTemplate: (params: Record<string, any>) => string;
}

export const GLOSSARY_FR: Record<string, GlossaryTerm> = {
  couvert: {
    key: 'couvert',
    title: 'Couvert',
    shortDefinition: 'Une personne servie à table ou au comptoir.',
    longDefinition: 'Le couvert représente chaque client individuel qui consomme dans ton établissement. Une table de 4 personnes représente 4 couverts.',
    howItsCalculatedTemplate: ({ count }) => `${count ?? 1} personne(s) servie(s) = ${count ?? 1} couvert(s).`,
  },
  capacity: {
    key: 'capacity',
    title: 'Capacité de service',
    shortDefinition: 'Le maximum de personnes que tu peux accueillir sur un service.',
    longDefinition: 'La capacité correspond au nombre total de places assises multiplié par le nombre de rotations possibles de tes tables au cours du même service.',
    howItsCalculatedTemplate: ({ seats, rotations }) => `${seats || 40} places assises × ${rotations || 1} rotation = ${((seats || 40) * (rotations || 1))} couverts maximum.`,
  },
  service: {
    key: 'service',
    title: 'Service (Midi ou Soir)',
    shortDefinition: 'Le créneau du midi ou du soir, comptabilisé séparément.',
    longDefinition: 'GetSpecial sépare rigoureusement le service du midi (avant 16h) et le service du soir (après 16h). Les clients de 23h à 3h du matin restent rattachés au service du soir de la veille.',
    howItsCalculatedTemplate: ({ cutoffHour }) => `Bascule automatique à ${cutoffHour || 16}h00 locale.`,
  },
  off_peak: {
    key: 'off_peak',
    title: 'Créneau creux',
    shortDefinition: 'Un moment où ta salle a habituellement des places libres.',
    longDefinition: 'C’est toi qui définis tes créneaux calmes (ex: le mardi soir). GetSpecial ne propose une offre que sur ces moments creux et ne bradera jamais un service déjà complet.',
    howItsCalculatedTemplate: ({ days }) => `Jours déclarés comme calmes : ${days || 'Lundi, Mardi'}.`,
  },
  baseline: {
    key: 'baseline',
    title: 'Couverts habituels (Baseline B)',
    shortDefinition: 'Ton affluence habituelle sur ce service sans aucune offre.',
    longDefinition: 'Au départ, c’est ton estimation déclarée. Dès que tu as enregistré au moins 4 clôtures sans offre pour ce même jour et ce même service, le système utilise la médiane de tes 8 dernières clôtures.',
    howItsCalculatedTemplate: ({ source, value, samples }) => `Valeur retenue : ${value || 12} couverts (${source === 'mesuré' ? `médiane de ${samples || 8} clôtures réelles` : 'valeur déclarée'}).`,
  },
  target: {
    key: 'target',
    title: 'Objectif de couverts',
    shortDefinition: 'Un quart des places habituellement vides à combler.',
    longDefinition: 'L’objectif est un repère réaliste pour mesurer le succès de ton offre, calculé comme 25% de tes places habituellement non occupées.',
    howItsCalculatedTemplate: ({ capacity, baseline, target }) => `Objectif = 25% de (${capacity || 40} places - ${baseline || 12} habituels) = ${target || 7} personnes.`,
  },
  effect: {
    key: 'effect',
    title: 'Effet estimé',
    shortDefinition: 'Les couverts réellement gagnés en plus de ton habitude.',
    longDefinition: 'C’est la différence entre le nombre total de personnes servies ce jour-là et tes couverts habituels. Affiché seulement après 4 services comparables pour éviter qu’un jour exceptionnel ne fausse l’analyse.',
    howItsCalculatedTemplate: ({ actual, baseline, effect }) => `Effet = ${actual || 20} couverts réels - ${baseline || 12} habituels = +${effect || 8} couverts additionnels.`,
  },
  cannibalisation: {
    key: 'cannibalisation',
    title: 'Cannibalisation',
    shortDefinition: 'Clients ayant utilisé l’offre qui seraient venus de toute façon.',
    longDefinition: 'Si 15 personnes ont demandé le mot-code mais que ta salle n’a gagné que 8 couverts par rapport à d’habitude, environ 7 clients fidèles ont simplement profité du cadeau sans créer de chiffre d’affaires additionnel.',
    howItsCalculatedTemplate: ({ persons, effect, result }) => `Cannibalisation = max(0, ${persons || 15} utilisateurs - ${effect || 8} nouveaux) = ${result || 7} clients habituels.`,
  },
};
