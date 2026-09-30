export type ConnectedAccountId = 'facebook' | 'instagram' | 'google_business';

export interface ConnectedAccountData {
  id: ConnectedAccountId;
  name: string;
  username: string; // Ex: "@lepetitbistrot"
  isConnected: boolean;
  category: 'social' | 'directory';
  description: string;
}

export const INITIAL_CONNECTED_ACCOUNTS: ConnectedAccountData[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    username: '@lepetitbistrot',
    isConnected: true,
    category: 'social',
    description: 'Diffusion instantanée des offres et événements sur votre page abonnés.',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    username: '@lepetitbistrot',
    isConnected: true,
    category: 'social',
    description: 'Publication des stories et posts pour vos clients locaux et touristes.',
  },
  {
    id: 'google_business',
    name: 'Google Business',
    username: '@lepetitbistrot-paris',
    isConnected: false,
    category: 'directory',
    description: 'Apparaissez dans le Pack Local Maps lors des recherches de proximité.',
  },
];
