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
}

export type UrgencyLevel = 'High' | 'Medium' | 'Low';

export interface TodayOpportunity {
  id: string;
  title: string;
  urgency: UrgencyLevel;
  signalOrigin: string;
  description: string;
  recommendedTime: string;
  targetAudience: string;
  potentialCovers: string;
  status?: string;
  verifiedFacts?: string[];
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
  condition: 'Sunny & Pleasant',
  temperature: 76,
  tempFahrenheit: 76,
  iconType: 'sun',
  terraceAdvice: 'Ideal patio dining weather for lunch and Happy Hour',
};

export const MOCK_EVENT_TODAY: LocalEventData = {
  title: 'NBA Game Night: Knicks vs 76ers',
  category: 'sports',
  time: 'Tonight • 7:30 PM',
  distance: '0.6 mi • Downtown Arena',
  opponent: 'NBA Eastern Conference',
  venue: 'Pre-game dinner and drink specials',
};

export const MOCK_OPPORTUNITIES_TODAY: TodayOpportunity[] = [
  {
    id: 'opp_foot_1',
    title: 'Game Night Sports Rush',
    urgency: 'High',
    signalOrigin: 'Tip-off tonight at 7:30 PM • High pre-game demand expected',
    description: 'Promote a beer bucket + smoked wings combo before 7:00 PM to fill bar stools early.',
    recommendedTime: '4:45 PM - 6:45 PM',
    targetAudience: 'Sports fans & after-work groups',
    potentialCovers: '+30 to +45 covers',
    status: 'pending',
  },
  {
    id: 'opp_terrasse_2',
    title: 'Sunny Patio Dining',
    urgency: 'Medium',
    signalOrigin: '76°F clear skies forecast through the afternoon',
    description: 'Highlight your outdoor patio seating and signature craft cocktails in the sunshine.',
    recommendedTime: '11:30 AM - 2:30 PM',
    targetAudience: 'Lunch crowd & stroll traffic',
    potentialCovers: '+20 covers',
    status: 'pending',
  },
  {
    id: 'opp_concert_3',
    title: 'Concert Pre-Theater Rush',
    urgency: 'Medium',
    signalOrigin: 'Sold-out live music performance 5 minutes away at 8:00 PM',
    description: 'Capture dinner diners looking for quick shared plates before heading to the venue.',
    recommendedTime: '5:30 PM - 7:15 PM',
    targetAudience: 'Concertgoers & couples',
    potentialCovers: '+15 covers',
    status: 'pending',
  },
];

export const MOCK_OFFER_TODAY: TodayOffer = {
  id: 'offer_wings_1',
  title: 'Happy Hour Wings 50% Off',
  description: 'Half-price crispy smoked wings with purchase of any craft draft or cocktail.',
  timeSlot: '4:30 PM - 6:30 PM',
  discountBadge: '50% OFF',
  itemType: 'Happy Hour Special',
  isActive: true,
};
