export interface PostDemographics {
  gender: {
    men: number; // 48%
    women: number; // 52%
  };
  ageRanges: {
    range: string;
    percentage: number;
  }[];
}

export interface DetailedPostStats {
  id: string;
  title: string;
  imageUrl: string;
  date: string; // Ex: "Hier à 17:30 (Mardi 29 Sept.)"
  time?: string;
  platform: 'instagram' | 'facebook' | 'google_business' | 'tiktok' | string;
  postUrl: string;
  views: number; // 2 421
  likes: number; // 180
  comments: number; // 24
  shares: number; // 12
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    engagementRate?: string;
  };
  demographics: PostDemographics;
}

export const MOCK_DETAILED_POST: DetailedPostStats = {
  id: 'post_wings_50',
  title: 'Ailes de poulet -50%',
  imageUrl:
    'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=1000&q=80',
  date: 'Hier à 17:30 (Mardi 29 Sept.)',
  platform: 'instagram',
  postUrl: 'https://instagram.com/p/example-wings-50',
  views: 2421,
  likes: 180,
  comments: 24,
  shares: 12,
  demographics: {
    gender: {
      men: 48,
      women: 52,
    },
    ageRanges: [
      { range: '18-24', percentage: 22 },
      { range: '25-34', percentage: 46 },
      { range: '35-44', percentage: 20 },
      { range: '45-54', percentage: 8 },
      { range: '55+', percentage: 4 },
    ],
  },
};
