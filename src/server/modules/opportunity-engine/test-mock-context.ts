import { ContextDossier } from './types';

/**
 * Jeu de données de test réaliste et exploitable pour l'Opportunity Engine.
 * Modélise un bar/bistrot indépendant avec météo favorable et événements locaux majeurs.
 */
export const MOCK_TEST_DOSSIER: ContextDossier = {
  restaurant: {
    id: 'rest_test_bistrot_1',
    name: 'Le Zinc & La Braise',
    type: 'Bistrot Moderne & Bar à Tapas',
    address: '28 Rue de la Roquette, 75011 Paris',
    city: 'Paris',
    timezone: 'Europe/Paris',
    specialties: [
      'Planche de charcuteries affinées & fromages fermiers',
      'Burgers au bœuf charolais & oignons confits',
      'Frites maison croustillantes & sauces artisanales',
      'Bières artisanales IPA et blondes en pression',
      'Cocktails signatures & mocktails de saison',
    ],
    hasTerrace: true,
    averageTicket: '24 €',
    offPeakDays: ['tuesday', 'thursday'], // Le jeudi est inclus !
    baselineCovers: 35,
    preferredEventTypes: ['sport', 'concert', 'afterwork'],
    constraints: [
      'Aucune remise directe supérieure à 30%',
      'Cuisine ouverte jusqu’à 22h30 les soirs de semaine',
      'Privilégier les formules à service rapide avant 20h',
    ],
    tone: 'Épicurien, chaleureux et convivial',
  },
  currentDay: {
    dayKey: 'thu',
    dayNameFr: 'jeudi',
    isOffPeakDay: true, // Dynamisation du jeudi soir
    isClosed: false,
    hoursText: '11:30 - 00:30 (Service continu)',
  },
  weather: {
    available: true,
    condition: 'Ensoleillé et très doux',
    temperature: 22,
    tempUnit: '°C',
    isSunny: true,
    isRain: false,
    summary: 'Grand soleil et 22°C : conditions idéales pour le service en terrasse ce midi et en afterwork.',
  },
  events: [
    {
      id: 'ev_psg_real_1',
      title: 'Soirée Match : PSG vs Real Madrid (Ligue des Champions)',
      type: 'sport',
      venue: 'Fan Zone & Écrans du quartier Bastille',
      distanceMeters: 300,
      startTime: '20:45',
      summary: 'Gros choc européen à guichet fermé. Forte affluence attendue de supporters et groupes dès 18h30 pour boire un verre et dîner avant le coup d’envoi.',
    },
    {
      id: 'ev_concert_bataclan_2',
      title: 'Concert Live Indie-Rock : The Black Keys Tribute',
      type: 'concert',
      venue: 'Le Bataclan',
      distanceMeters: 450,
      startTime: '20:00',
      summary: '1 400 spectateurs attendus sur le boulevard. Le public cherche une formule rapide et savoureuse à moins de 5 minutes à pied avant l’ouverture des portes.',
    },
    {
      id: 'ev_afterwork_tech_3',
      title: 'Grand Afterwork Tech & Startups Bastille',
      type: 'afterwork',
      venue: 'Pôle Coworking & Incubateurs Roquette',
      distanceMeters: 180,
      startTime: '18:00',
      summary: 'Plusieurs dizaines de jeunes actifs et collègues cherchant un bar chaleureux pour partager planches et pintes dès 18h.',
    },
  ],
  activeOffers: [
    {
      id: 'off_afterwork_1',
      title: 'Formule Afterwork Pinte & Frites Maison',
      description: '1 pinte artisanale au choix + 1 portion de frites maison offerte pour toute commande passée avant 19h30.',
      discountValue: 'Avantage 18h-19h30',
      lastPromotedAt: '2026-10-01',
    },
    {
      id: 'off_burger_duo_2',
      title: 'Duo Burger Charolais & Bière Pression',
      description: 'Burger du chef au bœuf charolais avec bière artisanale pression.',
      discountValue: 'Formule Privilège',
    },
  ],
  recentDismissals: [],
};
