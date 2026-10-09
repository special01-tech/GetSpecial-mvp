export interface WeatherData {
  condition: string;
  temperature: number; // in Fahrenheit for US market, or Celsius
  tempFahrenheit: number;
  tempUnit?: string;
  iconType: 'sun' | 'cloud-sun' | 'rain' | 'cloud';
  terraceAdvice: string;
  isReal?: boolean;
  source?: string;
}

export interface LocalEventData {
  title: string;
  category: 'sports' | 'concert' | 'culture';
  time: string;
  distance: string;
  opponent?: string;
  venue?: string;
  isReal?: boolean;
  source?: string;
  summary?: string;
  imageUrl?: string;
}

export type UrgencyLevel = 'High' | 'Medium' | 'Low';
export type OpportunityImportance = 'HIGH' | 'MEDIUM' | 'MODERATE';

export interface OpportunityOffer {
  label: string;
  details: string;
  codeWord: string;
  validityText: string;
}

export interface OpportunityDistribution {
  channels: ('INSTAGRAM' | 'FACEBOOK' | 'GOOGLE_BUSINESS')[];
  recommendedPublishTime: string;
  publishTimingReason?: string;
}

export interface TodayOpportunity {
  id: string;
  title: string;
  urgency: UrgencyLevel;
  importance?: OpportunityImportance;
  impactScore?: number; // 1 à 100 estimé par l'IA
  category?: 'EMPTY_SLOT' | 'LOCAL_EVENT' | 'WEATHER_BOOST' | 'SPECIAL_OCCASION' | 'OFFER_PROMOTION';
  signalOrigin: string;
  description: string;
  recommendedTime: string;
  targetAudience: string;
  potentialCovers: string;
  status?: string;
  verifiedFacts?: string[];
  reasons?: string[];
  offer?: OpportunityOffer;
  distribution?: OpportunityDistribution;
  codeWord?: string;
}

export interface TodayOffer {
  id: string;
  title: string;
  description: string;
  timeSlot: string;
  discountBadge: string;
  itemType: string;
  isActive: boolean;
}

export const MOCK_WEATHER_TODAY: WeatherData = {
  condition: 'Ensoleillé et très doux',
  temperature: 22,
  tempFahrenheit: 72,
  tempUnit: '°C',
  iconType: 'sun',
  terraceAdvice: 'Grand soleil et 22°C : conditions idéales pour le service en terrasse ce midi et en afterwork.',
};

export const MOCK_EVENT_TODAY: LocalEventData = {
  title: 'Soirée Match : PSG vs Real Madrid (Ligue des Champions)',
  category: 'sports',
  time: 'Ce soir • 20:45',
  distance: '300 m • Fan Zone & Écrans du quartier Bastille',
  venue: 'Fan Zone & Écrans du quartier Bastille',
  summary: 'Gros choc européen à guichet fermé. Forte affluence attendue de supporters et groupes dès 18h30 pour boire un verre et dîner avant le coup d’envoi.',
  imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80',
  isReal: true,
};

export const MOCK_EVENTS_TODAY: LocalEventData[] = [
  {
    title: 'Soirée Match : PSG vs Real Madrid (Ligue des Champions)',
    category: 'sports',
    time: 'Ce soir • 20:45',
    distance: '300 m • Fan Zone & Écrans du quartier Bastille',
    venue: 'Fan Zone & Écrans du quartier Bastille',
    summary: 'Gros choc européen à guichet fermé. Forte affluence attendue de supporters et groupes dès 18h30 pour boire un verre et dîner avant le coup d’envoi.',
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80',
    isReal: true,
  },
  {
    title: 'Concert Live Indie-Rock : The Black Keys Tribute',
    category: 'concert',
    time: 'Ce soir • 20:00',
    distance: '450 m • Le Bataclan',
    venue: 'Le Bataclan',
    summary: '1 400 spectateurs attendus sur le boulevard. Le public cherche une formule rapide et savoureuse à moins de 5 minutes à pied avant l’ouverture des portes.',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    isReal: true,
  },
  {
    title: 'Grand Afterwork Tech & Startups Bastille',
    category: 'culture',
    time: 'Ce soir • 18:00',
    distance: '180 m • Pôle Coworking & Incubateurs Roquette',
    venue: 'Pôle Coworking & Incubateurs Roquette',
    summary: 'Plusieurs dizaines de jeunes actifs et collègues cherchant un bar chaleureux pour partager planches et pintes dès 18h.',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    isReal: true,
  },
];

export const MOCK_OPPORTUNITIES_TODAY: TodayOpportunity[] = [
  {
    id: 'opp_test_1',
    title: 'Soirée Match : Formule Fan Zone Burgers & Pinte',
    urgency: 'High',
    importance: 'HIGH',
    impactScore: 94,
    category: 'LOCAL_EVENT',
    signalOrigin: 'Choc européen PSG vs Real Madrid à 300m',
    description: 'Captez les supporters avant le coup d’envoi de 20h45 avec une formule burger & bière artisanale servie rapidement.',
    recommendedTime: 'Ce soir de 18h30 à 20h15',
    targetAudience: 'Supporters & groupes du quartier',
    potentialCovers: '+30 à +45 couverts',
    status: 'pending',
    verifiedFacts: [
      'Match PSG vs Real Madrid (Ligue des Champions à 20h45)',
      'Écrans & fan zone à 300m à Bastille',
      'Spécialités : Burgers charolais & bières IPA',
    ],
    reasons: [
      'Événement sportif majeur à proximité immédiate avec forte demande de repas rapide avant 20h30.',
      'Service fluide en salle grâce à vos burgers charolais préparés à la commande.',
      'Marge sécurisée sur les pintes de bière artisanale IPA.',
    ],
    offer: {
      label: 'Formule Fan Zone : Burger Charolais & Pinte IPA',
      details: '1 Burger Charolais maison + 1 pinte de bière artisanale servis avant 20h15.',
      codeWord: 'MATCH15',
      validityText: 'Ce soir de 18h30 à 20h15 uniquement',
    },
    distribution: {
      channels: ['INSTAGRAM', 'FACEBOOK', 'GOOGLE_BUSINESS'],
      recommendedPublishTime: '11:30',
      publishTimingReason: 'Moment où les supporters organisent leur point de rendez-vous.',
    },
    codeWord: 'MATCH15',
  },
  {
    id: 'opp_test_2',
    title: 'Météo Favorable : Plein Soleil en Terrasse',
    urgency: 'Medium',
    importance: 'MEDIUM',
    impactScore: 78,
    category: 'WEATHER_BOOST',
    signalOrigin: 'Grand soleil et 22°C tout l’après-midi',
    description: 'Exploitez les 22°C pour remplir votre terrasse ce midi et en afterwork avec vos cocktails signatures.',
    recommendedTime: '12h00 - 14h30 & 17h30 - 19h30',
    targetAudience: 'Actifs du quartier & passants',
    potentialCovers: '+15 à +25 couverts',
    status: 'pending',
    verifiedFacts: [
      'Grand soleil et 22°C annoncés',
      'Terrasse extérieure disponible',
      'Cocktails signatures & mocktails',
    ],
    reasons: [
      'Ensoleillement optimal déclenchant une envie spontanée de terrasse.',
      'Terrasse visible qui attire naturellement le passage piéton de la rue de la Roquette.',
      'Valorisation de l’expérience estivale et des cocktails signatures à forte marge.',
    ],
    offer: {
      label: 'Pause Ensoleillée : Cocktail Signature & Planche Tapas',
      details: '1 Cocktail signature au choix servi en terrasse accompagné de tapas de saison.',
      codeWord: 'SOLEIL25',
      validityText: 'Ce midi de 12h00 à 14h30 & ce soir de 17h30 à 19h30',
    },
    distribution: {
      channels: ['INSTAGRAM', 'FACEBOOK'],
      recommendedPublishTime: '10:30',
      publishTimingReason: 'Juste avant la décision du déjeuner et de l’afterwork au soleil.',
    },
    codeWord: 'SOLEIL25',
  },
  {
    id: 'opp_test_3',
    title: 'Spécial Jeudi : Formule Dégustation Conviviale',
    urgency: 'Medium',
    importance: 'HIGH',
    impactScore: 88,
    category: 'EMPTY_SLOT',
    signalOrigin: 'Créneau calme identifié (jeudi soir)',
    description: 'Dynamisez votre service du jeudi soir avec une offre privilégiée sur vos planches de charcuteries et fromages.',
    recommendedTime: 'Ce soir de 19h00 à 21h30',
    targetAudience: 'Habitués & riverains du 11ème',
    potentialCovers: '+30 à +45 couverts',
    status: 'pending',
    verifiedFacts: [
      'Créneau calme identifié : jeudi soir',
      'Baseline témoin : 35 couverts',
      'Spécialités : Planche affinée & fromages fermiers',
    ],
    reasons: [
      'Le jeudi est identifié comme un jour plus calme (baseline : 35 couverts).',
      'Le mot-code oral permet de vérifier directement la fréquentation incrémentale générée.',
      'Offre ciblée sur votre produit phare pour garantir une marge saine.',
    ],
    offer: {
      label: 'Privilège Jeudi : Grande Planche & Pinte Artisanale',
      details: '1 Grande Planche mixte affinée pour 2 personnes avec 2 verres ou pintes artisanales.',
      codeWord: 'THU15',
      validityText: 'Ce jeudi soir uniquement sur le service de dîner',
    },
    distribution: {
      channels: ['INSTAGRAM', 'FACEBOOK'],
      recommendedPublishTime: '15:00',
      publishTimingReason: 'En milieu d’après-midi pour orienter le choix du dîner des riverains.',
    },
    codeWord: 'THU15',
  },
  {
    id: 'opp_test_4',
    title: 'À la Carte : Formule Afterwork Pinte & Frites Maison',
    urgency: 'Low',
    importance: 'MODERATE',
    impactScore: 68,
    category: 'OFFER_PROMOTION',
    signalOrigin: 'Offre active du restaurant',
    description: '1 pinte artisanale au choix + 1 portion de frites maison offerte pour toute commande passée avant 19h30.',
    recommendedTime: '18h00 - 19h30',
    targetAudience: 'Habitués & clients au comptoir',
    potentialCovers: '+15 à +25 couverts',
    status: 'pending',
    verifiedFacts: [
      'Offre active existante du restaurant',
      'Frites maison croustillantes & bières IPA',
    ],
    reasons: [
      'Offre active déjà appréciée qui mérite une mise en avant régulière.',
      'Idéal pour capter les afterworks dès 18h et amorcer le service du soir.',
    ],
    offer: {
      label: 'Formule Afterwork Pinte & Frites Maison',
      details: '1 pinte artisanale au choix + 1 portion de frites maison croustillantes.',
      codeWord: 'SPECIAL10',
      validityText: 'Aujourd’hui de 18h00 à 19h30',
    },
    distribution: {
      channels: ['INSTAGRAM', 'FACEBOOK'],
      recommendedPublishTime: '11:00',
      publishTimingReason: 'Publication matinale avant le rush de la journée.',
    },
    codeWord: 'SPECIAL10',
  },
];

export const MOCK_OFFER_TODAY: TodayOffer = {
  id: 'off_afterwork_1',
  title: 'Formule Afterwork Pinte & Frites Maison',
  description: '1 pinte artisanale au choix + 1 portion de frites maison offerte pour toute commande passée avant 19h30.',
  timeSlot: '18h00 - 19h30',
  discountBadge: 'AVANTAGE AFTERWORK',
  itemType: 'Spécialité Maison',
  isActive: true,
};
