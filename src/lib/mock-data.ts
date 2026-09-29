/**
 * Données de mock fidèles au design de référence GetSpecial
 * Utilisé pour alimenter les composants frontend avec réalisme et cohérence
 */

export interface Opportunity {
  id: string;
  title: string;
  category: string;
  period: string;
  description: string;
  badge: 'Offre spéciale' | 'Relance' | 'Tendance' | 'Événement' | 'Météo';
  image: string;
  iconType: 'weather' | 'sport' | 'cocktail' | 'dish' | 'music' | 'trend';
  ctaText: string;
}

export interface IdeaItem {
  id: string;
  title: string;
  category: string;
  period: string;
  description: string;
  filter: 'today' | 'week' | 'weather' | 'events' | 'trends' | 'performance' | 'season';
  image: string;
  iconType: 'weather' | 'sport' | 'trend' | 'calendar' | 'music' | 'cocktail';
}

export interface PublicationItem {
  id: string;
  title: string;
  date: string;
  time: string;
  status: 'to_publish' | 'scheduled' | 'published';
  statusLabel: string;
  image: string;
  reach?: string;
  interactions?: string;
  platforms?: ('instagram' | 'facebook' | 'tiktok')[];
}

export interface TopPerformanceItem {
  rank: number;
  title: string;
  reach: string;
  interactions: string;
  growth: string;
  image: string;
}

export const MOCK_RESTAURANT = {
  name: 'Le Comptoir',
  subtitle: 'Restaurant • 1 min',
  category: 'Restaurant • Cuisine française',
  status: 'Ouvert',
  avatar: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80',
  coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  logoText: 'LC',
  typeEtablissement: 'Restaurant • Cuisine traditionnelle française',
  address: '12 Rue des Lilas, Cotonou, Bénin',
  hours: 'Lun - Dim : 11h - 23h',
  posStatus: 'Actif',
  communicationTone: 'Convivial',
  targetAudience: 'Tout public',
  offers: ['Happy Hour', 'Menu du jour', 'Événement'],
  stats: {
    reach: '42,6K',
    reachGrowth: '+18%',
    interactions: '1,3K',
    interactionsGrowth: '+24%',
    clicks: '892',
    clicksGrowth: '+12%',
  },
  photos: [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=400&q=80',
  ],
};

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'Pluie prévue ce soir',
    category: 'Météo',
    period: "Aujourd'hui",
    description: 'Les gens cherchent des lieux pour se réchauffer. Mettez en avant votre menu spécial.',
    badge: 'Offre spéciale',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
    iconType: 'weather',
    ctaText: 'Créer la publication →',
  },
  {
    id: 'opp-2',
    title: 'Match à 2 km à 20h',
    category: 'Événement',
    period: "Aujourd'hui",
    description: 'Attirez plus de clients avec une offre spéciale pendant le match.',
    badge: 'Offre spéciale',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    iconType: 'sport',
    ctaText: 'Créer la publication →',
  },
  {
    id: 'opp-3',
    title: 'Tendance Happy Hour fonctionne bien',
    category: 'Tendances',
    period: 'Ce vendredi',
    description: 'Rehaussez la visibilité avec une nouvelle créa pour ce vendredi.',
    badge: 'Relance',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    iconType: 'cocktail',
    ctaText: 'Créer la publication →',
  },
];

export const MOCK_IDEAS: IdeaItem[] = [
  {
    id: 'idea-1',
    title: 'Pluie prévue ce soir',
    category: 'Météo',
    period: "Aujourd'hui",
    description: 'Les gens cherchent des lieux pour se réchauffer. Mettez en avant votre menu spécial.',
    filter: 'weather',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80',
    iconType: 'weather',
  },
  {
    id: 'idea-2',
    title: 'Match à 2 km à 20h',
    category: 'Événement',
    period: "Aujourd'hui",
    description: 'Attirez plus de clients avec une offre spéciale pendant le match.',
    filter: 'events',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
    iconType: 'sport',
  },
  {
    id: 'idea-3',
    title: 'Tendance : cocktails sans alcool',
    category: 'Tendances',
    period: 'Cette semaine',
    description: 'De plus en plus de personnes recherchent des options sans alcool. Mettez-les en avant !',
    filter: 'trends',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
    iconType: 'trend',
  },
  {
    id: 'idea-4',
    title: 'Menu du jour — Plats locaux',
    category: 'Saisonnalité',
    period: 'Cette semaine',
    description: 'Les plats locaux sont très recherchés en ce moment. Mettez votre menu du jour en avant.',
    filter: 'season',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
    iconType: 'calendar',
  },
  {
    id: 'idea-5',
    title: 'Soirée Acoustique Live',
    category: 'Événements',
    period: 'Cette semaine',
    description: 'Créez une atmosphère intime et captivez vos habitués avec un set acoustique.',
    filter: 'events',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
    iconType: 'music',
  },
  {
    id: 'idea-6',
    title: 'Brunch en terrasse dominical',
    category: 'Météo',
    period: 'Ce week-end',
    description: 'Grand soleil prévu dimanche à midi. Remplissez votre terrasse dès 11h.',
    filter: 'weather',
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=400&q=80',
    iconType: 'weather',
  },
];

export const MOCK_PUBLICATIONS: PublicationItem[] = [
  {
    id: 'pub-1',
    title: 'Happy Hour',
    date: '16 avr.',
    time: '17h',
    status: 'to_publish',
    statusLabel: 'À publier',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=500&q=80',
    reach: '3,4K',
    interactions: '320',
    platforms: ['instagram', 'facebook'],
  },
  {
    id: 'pub-2',
    title: 'Soirée live rock',
    date: '18 avr.',
    time: '20h',
    status: 'scheduled',
    statusLabel: 'Programmée',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=500&q=80',
    reach: '2,1K',
    interactions: '180',
    platforms: ['instagram', 'facebook', 'tiktok'],
  },
  {
    id: 'pub-3',
    title: 'Brunch gourmand',
    date: '20 avr.',
    time: '11h',
    status: 'published',
    statusLabel: 'Publiée',
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=500&q=80',
    reach: '2,8K',
    interactions: '210',
    platforms: ['instagram'],
  },
  {
    id: 'pub-4',
    title: 'Menu du jour',
    date: '22 avr.',
    time: '12h',
    status: 'published',
    statusLabel: 'Publiée',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
    reach: '1,6K',
    interactions: '120',
    platforms: ['instagram', 'facebook'],
  },
];

export const MOCK_TOP_PERFORMANCES: TopPerformanceItem[] = [
  {
    rank: 1,
    title: 'Happy Hour',
    reach: '3,4K portée',
    interactions: '320 interactions',
    growth: '+42%',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=300&q=80',
  },
  {
    rank: 2,
    title: 'Brunch gourmand',
    reach: '2,8K portée',
    interactions: '210 interactions',
    growth: '+28%',
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=300&q=80',
  },
  {
    rank: 3,
    title: 'Soirée live rock',
    reach: '2,1K portée',
    interactions: '180 interactions',
    growth: '+19%',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80',
  },
  {
    rank: 4,
    title: 'Menu du jour',
    reach: '1,6K portée',
    interactions: '120 interactions',
    growth: '+12%',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80',
  },
];

export const MOCK_PLATFORMS_BREAKDOWN = [
  { name: 'Instagram', percent: 62, color: '#FF5C00' },
  { name: 'Facebook', percent: 28, color: '#38BDF8' },
  { name: 'TikTok', percent: 10, color: '#94A3B8' },
];
