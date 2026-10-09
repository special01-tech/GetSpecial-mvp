export type ConnectedAccountId = 'facebook' | 'instagram' | 'google_business' | 'tiktok';

export interface ConnectedAccountData {
  id: ConnectedAccountId;
  name: string;
  username: string; // Ex: "@thebrasspelican"
  isConnected: boolean;
  category: 'social' | 'directory';
  description: string;
  pageId?: string;
  lastSyncAt?: string;
}

export const INITIAL_CONNECTED_ACCOUNTS: ConnectedAccountData[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    username: 'Non connecté',
    isConnected: false,
    category: 'social',
    description: 'Diffusion instantanée des offres et événements sur votre Page officielle abonnés.',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    username: 'Non connecté',
    isConnected: false,
    category: 'social',
    description: 'Publication des visuels, stories et réels pour vos clients locaux et touristes.',
  },
  {
    id: 'google_business',
    name: 'Google Business',
    username: 'Non connecté',
    isConnected: false,
    category: 'directory',
    description: 'Apparaissez dans le Pack Local Maps lors des recherches de proximité.',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    username: 'Non connecté',
    isConnected: false,
    category: 'social',
    description: 'Publication de vidéos courtes et formats immersifs auprès des clients locaux.',
  },
];
