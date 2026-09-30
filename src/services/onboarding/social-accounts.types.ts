export type SocialPlatformId = 'facebook' | 'instagram' | 'google_business';

export type ConnectionStatus = 'connected' | 'disconnected' | 'syncing' | 'verified';

export interface SocialAccountConfig {
  id: SocialPlatformId;
  name: string;
  category: 'social' | 'directory';
  description: string;
  accountHandle?: string;
  status: ConnectionStatus;
  lastSync?: string;
  benefits: string;
}

export const DEFAULT_SOCIAL_ACCOUNTS: SocialAccountConfig[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'social',
    description: 'Page officielle de votre établissement',
    status: 'disconnected',
    benefits: 'Publication automatique des menus & événements locaux',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social',
    description: 'Compte professionnel Instagram Business',
    status: 'disconnected',
    benefits: 'Photos d’ambiance, stories & visibilité auprès des foodies',
  },
  {
    id: 'google_business',
    name: 'Google Business',
    category: 'directory',
    description: 'Fiche Google Maps & recherche locale',
    status: 'disconnected',
    benefits: 'Posts "Actualités" & "Offres" vus par les clients à proximité',
  },
];
