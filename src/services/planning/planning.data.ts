export type PlanningStatus = 'published' | 'programmed' | 'approved' | 'to_validate';

export type PlanningEventType = 'weather' | 'sport' | 'commercial' | 'culture' | 'holiday';

export type PlatformType = 'instagram' | 'facebook' | 'google_business';

export interface PlanningItem {
  id: string;
  title: string;
  description: string;
  type: PlanningEventType;
  date: string;
  time: string;
  status: PlanningStatus;
  platforms: PlatformType[];
  impactEstimate?: string;
  campaignId?: string;
  isHighImpact?: boolean;
}

export const PLANNING_STATUS_LABELS: Record<PlanningStatus, string> = {
  published: 'Publié',
  programmed: 'Programmé',
  approved: 'Approuvé',
  to_validate: 'À valider',
};

export const MOCK_PLANNING_ITEMS: PlanningItem[] = [
  {
    id: 'plan_1',
    title: 'Rain Shower Comfort Special',
    description: 'Passing afternoon showers: push cozy dining room seating with warm skillet appetizers & craft bourbon cocktails.',
    type: 'weather',
    date: 'Tue, Sep 29',
    time: '4:45 PM',
    status: 'to_validate',
    platforms: ['instagram', 'facebook'],
    impactEstimate: '+15 indoor covers',
    campaignId: 'camp_rain_shelter',
  },
  {
    id: 'plan_2',
    title: 'Game Night Sports Broadcast',
    description: 'Live broadcast of the rivalry game: $15 smoked wings platter and $5 draft craft pints.',
    type: 'sport',
    date: 'Wed, Sep 30',
    time: '6:30 PM',
    status: 'programmed',
    platforms: ['instagram', 'facebook', 'google_business'],
    impactEstimate: '+40 game-day diners',
    campaignId: 'camp_wings_50',
  },
  {
    id: 'plan_3',
    title: 'Extended Thursday Happy Hour',
    description: 'Signature cocktails and shareable appetizers at special pricing between 4:00 PM and 7:00 PM.',
    type: 'commercial',
    date: 'Thu, Oct 1',
    time: '4:00 PM',
    status: 'approved',
    platforms: ['instagram', 'facebook'],
    impactEstimate: '+25% bar revenue lift',
    campaignId: 'camp_happy_hour',
  },
  {
    id: 'plan_4',
    title: 'Live Acoustic Music Night',
    description: 'Local blues and acoustic set downtown 5 minutes away: pre-concert dinner special promotion.',
    type: 'culture',
    date: 'Fri, Oct 2',
    time: '5:00 PM',
    status: 'to_validate',
    platforms: ['instagram', 'google_business'],
    impactEstimate: '+20 reserved tables',
    campaignId: 'camp_concert_jazz',
  },
  {
    id: 'plan_5',
    title: 'Sunday Brunch & Patio Mimosas',
    description: 'Family-style Texas brunch & specialty espresso drinks: early reservation call-out.',
    type: 'holiday',
    date: 'Sun, Oct 4',
    time: '10:00 AM',
    status: 'programmed',
    platforms: ['facebook', 'google_business'],
    impactEstimate: '+35 brunch bookings',
    campaignId: 'camp_brunch_ferie',
  },
];
