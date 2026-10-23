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
