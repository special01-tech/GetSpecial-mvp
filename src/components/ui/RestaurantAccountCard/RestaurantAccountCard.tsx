'use client';

import React from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { ConnectedAccountData } from '@/services/restaurant/restaurant-accounts.data';
import { useLanguage } from '@/i18n';
import styles from './RestaurantAccountCard.module.css';

interface RestaurantAccountCardProps {
  account: ConnectedAccountData;
  onActionClick: (account: ConnectedAccountData) => void;
  isLoading?: boolean;
}

export default function RestaurantAccountCard({
  account,
  onActionClick,
  isLoading = false,
}: RestaurantAccountCardProps) {
  const isGoogle = account.id === 'google_business';
  const { t } = useLanguage();

  return (
    <article
      className={`${styles.card} ${account.isConnected ? styles.cardConnected : ''}`}
    >
      {/* Colonne Gauche : Logo Plateforme */}
      <div className={`${styles.logoWrapper} ${styles[account.id] || ''}`}>
        {account.id === 'facebook' && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )}

        {account.id === 'instagram' && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="url(#ig-grad-acc)" />
            <path
              d="M12 16a4 4 0 100-8 4 4 0 000 8z"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17.5 6.5h.01"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="5"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <defs>
              <linearGradient id="ig-grad-acc" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F58529" />
                <stop offset="0.5" stopColor="#DD2A7B" />
                <stop offset="1" stopColor="#8134AF" />
              </linearGradient>
            </defs>
          </svg>
        )}

        {account.id === 'google_business' && (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}

        {account.id === 'tiktok' && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#000000">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.14 1.19 2.05 2.33 2.24.89.15 1.83-.07 2.52-.64.6-.48.97-1.2 1.01-1.97.04-3.72.02-7.44.02-11.16V.02z" />
          </svg>
        )}
      </div>

      {/* Colonne Centrale : Nom, Username & Statut */}
      <div className={styles.infoCol}>
        <div className={styles.nameRow}>
          <h3 className={styles.name}>{account.name}</h3>
          {isGoogle && (
            <span className={styles.localBadge}>
              <MapPin size={10} />
              <span>Local Pack</span>
            </span>
          )}
        </div>

        <div className={styles.usernameRow}>
          <span className={styles.usernameText}>{account.username}</span>
        </div>

        <div className={styles.statusRow}>
          <span
            className={`${styles.statusBadge} ${
              account.isConnected ? styles.statusConnected : styles.statusDisconnected
            }`}
          >
            <span className={styles.statusDot} />
            <span>
              {account.isConnected
                ? t('common.components.restaurantAccountCard.connected')
                : t('common.components.restaurantAccountCard.disconnected')}
            </span>
          </span>
        </div>

        <p className={styles.description}>
          {account.description || t(`common.connectedAccounts.${account.id}.description`)}
        </p>
      </div>

      {/* Colonne Droite : Bouton Connecter / Déconnecter */}
      <div className={styles.actionCol}>
        <button
          type="button"
          onClick={() => onActionClick(account)}
          disabled={isLoading}
          className={`${styles.actionBtn} ${
            account.isConnected ? styles.disconnectBtn : styles.connectBtn
          }`}
          aria-label={
            account.isConnected
              ? t('common.components.restaurantAccountCard.disconnectAria', {
                  name: account.name,
                })
              : t('common.components.restaurantAccountCard.connectAria', {
                  name: account.name,
                })
          }
        >
          {isLoading ? (
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          ) : account.isConnected ? (
            <span>{t('common.components.restaurantAccountCard.disconnectButton')}</span>
          ) : (
            <span>{t('common.components.restaurantAccountCard.connectButton')}</span>
          )}
        </button>
      </div>
    </article>
  );
}
