export type InsightsTab = 'overview' | 'posts' | 'audience';

export interface GlobalMetrics {
  views: number;
  interactions: number;
  engagementRate: string;
  period: string;
}

export interface PlatformStatItem {
  id: 'instagram' | 'facebook' | 'google_business' | string;
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
  platform: 'instagram' | 'facebook' | 'google_business' | string;
  date: string;
  postUrl?: string;
}

export interface ChartDataPoint {
  day: string;
  views: number;
  interactions: number;
}
