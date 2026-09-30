export interface BrandColor {
  hex: string;
  name: string;
}

export type BrandToneId =
  | 'chaleureux'
  | 'convivial'
  | 'gourmand'
  | 'festif'
  | 'chic_elegant'
  | 'decontracte';

export interface BrandToneOption {
  id: BrandToneId;
  label: string;
  emoji: string;
  description: string;
}

export type EditorialStyleId =
  | 'storytelling'
  | 'direct_percutant'
  | 'humoristique'
  | 'epicurien';

export interface EditorialStyleOption {
  id: EditorialStyleId;
  label: string;
  description: string;
}

export interface BrandProfileData {
  tones: BrandToneId[];
  colors: BrandColor[];
  editorialStyle: EditorialStyleId;
  detectedSummary?: string;
  confidenceScore?: number;
}

export const AVAILABLE_BRAND_TONES: BrandToneOption[] = [
  {
    id: 'chaleureux',
    label: 'Chaleureux',
    emoji: '☀️',
    description: 'Accueillant, authentique et proche des clients',
  },
  {
    id: 'convivial',
    label: 'Convivial',
    emoji: '🤝',
    description: 'Partage, bonne humeur et esprit de tablée',
  },
  {
    id: 'gourmand',
    label: 'Gourmand',
    emoji: '🍴',
    description: 'Focus sur les saveurs, textures et produits frais',
  },
  {
    id: 'festif',
    label: 'Festif',
    emoji: '🎉',
    description: 'Énergie haute, apéros animés et soirées',
  },
  {
    id: 'chic_elegant',
    label: 'Chic & Raffiné',
    emoji: '✨',
    description: 'Gastronomie soignée, vocabulaire élégant',
  },
  {
    id: 'decontracte',
    label: 'Décontracté',
    emoji: '😎',
    description: 'Simple, direct, sans chichis',
  },
];

export const AVAILABLE_EDITORIAL_STYLES: EditorialStyleOption[] = [
  {
    id: 'direct_percutant',
    label: 'Direct & Percutant',
    description: 'Phrases courtes, appel à l’action immédiat',
  },
  {
    id: 'storytelling',
    label: 'Storytelling & Terroir',
    description: 'Raconte l’histoire des ingrédients et des producteurs',
  },
  {
    id: 'humoristique',
    label: 'Léger & Complice',
    description: 'Pointes d’humour, autodérision et proximité',
  },
  {
    id: 'epicurien',
    label: 'Épicurien & Poétique',
    description: 'Éveille les sens et met l’eau à la bouche',
  },
];

export const DEFAULT_BRAND_PROFILE: BrandProfileData = {
  tones: ['chaleureux', 'convivial'],
  colors: [
    { hex: '#1B4332', name: 'Vert Forêt' },
    { hex: '#D4A373', name: 'Terracotta Doux' },
    { hex: '#FAEDCD', name: 'Ivoire Doré' },
    { hex: '#2B2D42', name: 'Ardoise' },
  ],
  editorialStyle: 'direct_percutant',
  detectedSummary: 'Basé sur vos 12 dernières publications Instagram & Google Business',
  confidenceScore: 94,
};
