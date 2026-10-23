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
