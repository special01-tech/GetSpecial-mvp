export interface WeatherData {
  condition: string;
  temperature: number;
  tempFahrenheit: number;
  tempUnit?: string;
  iconType: 'sun' | 'cloud-sun' | 'rain' | 'cloud';
  terraceAdvice: string;
  isReal?: boolean;
  source?: string;
  isRain?: boolean;
  isSunny?: boolean;
}

export interface LocalEventData {
  id?: string;
  externalId?: string;
  title: string;
  category: 'sports' | 'concert' | 'culture' | 'holiday' | 'arts' | 'theatre' | 'music' | string;
  time: string;
  distance: string;
  opponent?: string;
  venue?: string;
  isReal?: boolean;
  source?: string;
  summary?: string;
  imageUrl?: string;
  url?: string;
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
  impactScore?: number;
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
  oneSentenceSummary?: string;
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
