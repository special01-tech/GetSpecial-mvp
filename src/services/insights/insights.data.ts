export type InsightsTab = 'overview' | 'posts' | 'audience';

export interface GlobalMetrics {
  views: number;
  interactions: number;
  engagementRate: string;
  period: string;
}

export interface PlatformStatItem {
  id: 'instagram' | 'facebook' | 'google_business' | 'tiktok' | string;
  name: string;
  views: number;
  percentage: number;
  color: string;
  interactions: number;
}

export interface TopContentItem {
  id: string;
  title: string;
  views: string;
  interactions: string;
  imageUrl: string;
  engagement: string;
  platform: 'instagram' | 'facebook' | 'google_business' | 'tiktok' | string;
  date: string;
  postUrl?: string;
}

export interface ChartDataPoint {
  day: string;
  views: number;
  interactions: number;
}

export const MOCK_INSIGHTS_DATA = {
  metrics: {
    views: 12480,
    interactions: 892,
    engagementRate: '+7.4%',
    period: 'Last 30 Days',
  },
  platforms: [
    {
      id: 'instagram' as const,
      name: 'Instagram',
      views: 6864,
      percentage: 55,
      color: '#E1306C',
      interactions: 520,
    },
    {
      id: 'facebook' as const,
      name: 'Facebook',
      views: 3744,
      percentage: 30,
      color: '#1877F2',
      interactions: 260,
    },
    {
      id: 'google_business' as const,
      name: 'Google Business',
      views: 1872,
      percentage: 15,
      color: '#34A853',
      interactions: 112,
    },
  ],
  topContent: [
    {
      id: 'top_1',
      title: 'Happy Hour Wings 50% Off',
      views: '2.4k views',
      interactions: '180 reactions',
      imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=400&q=80',
      engagement: '7.5%',
      platform: 'instagram' as const,
      date: 'Yesterday at 4:45 PM',
    },
    {
      id: 'top_2',
      title: 'Game Night: Craft Beer & Sliders',
      views: '1.9k views',
      interactions: '145 reactions',
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
      engagement: '7.6%',
      platform: 'facebook' as const,
      date: '3 days ago',
    },
    {
      id: 'top_3',
      title: 'Sunny Patio Dining & Craft Drinks',
      views: '1.2k views',
      interactions: '95 reactions',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
      engagement: '7.9%',
      platform: 'google_business' as const,
      date: '5 days ago',
    },
  ],
  chartWeekly: [
    { day: 'Wk 1', views: 2400, interactions: 180 },
    { day: 'Wk 2', views: 3100, interactions: 220 },
    { day: 'Wk 3', views: 2850, interactions: 210 },
    { day: 'Wk 4', views: 4130, interactions: 282 },
  ],
};
