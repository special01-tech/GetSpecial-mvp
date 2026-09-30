export type CampaignPlatform = 'instagram' | 'facebook' | 'google_business';

export interface CampaignData {
  id: string;
  title: string;
  discount: string;
  description: string;
  timeSlot: string;
  publishTime: string;
  imageUrl: string;
  platforms: CampaignPlatform[];
  opportunityExplanation: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'cancelled';
  scheduledDate?: string;
  scheduledTime?: string;
}

export const MOCK_CAMPAIGN_DETAIL: CampaignData = {
  id: 'camp_wings_50',
  title: 'Happy Hour Wings 50% Off',
  discount: '50% OFF',
  description:
    'Enjoy 50% off our house-smoked jumbo wings today from 4:30 PM to 6:30 PM! Tossed in chef secret glaze. Pair with any craft draft beer.',
  timeSlot: 'Today • 4:30 PM - 6:30 PM',
  publishTime: '4:45 PM',
  imageUrl:
    'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=1000&q=80',
  platforms: ['instagram', 'facebook', 'google_business'],
  opportunityExplanation:
    'Pleasant 76°F weather combined with tonight’s 7:30 PM game tip-off creates a strong early dinner rush. Promoting this Happy Hour offer fills patio tables before the main rush.',
  status: 'pending_approval',
  scheduledDate: '2026-09-30',
  scheduledTime: '4:45 PM',
};
