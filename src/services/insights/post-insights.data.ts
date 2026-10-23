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
  platform: 'instagram' | 'facebook' | 'google_business' | string;
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
  demographics?: PostDemographics;
}
