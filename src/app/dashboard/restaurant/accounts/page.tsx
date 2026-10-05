'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Tag,
  Calendar,
  Share2,
  AlertTriangle,
  X,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import RestaurantAccountCard from '@/components/ui/RestaurantAccountCard/RestaurantAccountCard';
import { useLanguage } from '@/i18n';
import {
  ConnectedAccountData,
  INITIAL_CONNECTED_ACCOUNTS,
} from '@/services/restaurant/restaurant-accounts.data';
import styles from '../restaurant.module.css';
import cardStyles from '@/components/ui/RestaurantAccountCard/RestaurantAccountCard.module.css';

/**
 * Écran 17 : Mon restaurant - Comptes (/dashboard/restaurant/accounts)
 *
 * Mêmes en-tête et navigation interne :
 * - Profil (/dashboard/restaurant)
 * - Offres (/dashboard/restaurant/offers)
 * - Événements (/dashboard/restaurant/events)
 * - Comptes (/dashboard/restaurant/accounts)
 *
 * Afficher :
 * - Facebook : Connecté (@lepetitbistrot)
 * - Instagram : Connecté (@lepetitbistrot)
 * - Google Business : Non connecté
 *
 * Pour chaque compte :
 * - logo (SVG vectoriel officiel)
 * - nom
 * - username (@handle)
 * - statut (Connecté / Non connecté)
 * - bouton connecter / déconnecter
 *
 * Modale de confirmation avant déconnexion.
 */
export default function RestaurantAccountsPage() {
  const { t } = useLanguage();
  const [restaurantName, setRestaurantName] = useState('Le Petit Bistrot');
  const [accounts, setAccounts] = useState<ConnectedAccountData[]>(INITIAL_CONNECTED_ACCOUNTS);
  const [confirmAccount, setConfirmAccount] = useState<ConnectedAccountData | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('getspecial_selected_restaurant');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setRestaurantName(parsed.name);
      }

      const storedAcc = localStorage.getItem('getspecial_connected_accounts');
      if (storedAcc) {
        setAccounts(JSON.parse(storedAcc));
      }
    } catch {
      // Ignorer
    }
  }, []);

  const saveAccounts = (updated: ConnectedAccountData[], message: string) => {
    setAccounts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_connected_accounts', JSON.stringify(updated));
    }
    setNotice(message);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleActionClick = (account: ConnectedAccountData) => {
    if (account.isConnected) {
      // Ouvrir la modale de confirmation avant déconnexion
      setConfirmAccount(account);
    } else {
      // Connexion directe
      setLoadingId(account.id);
      setTimeout(() => {
        const updated = accounts.map((acc) =>
          acc.id === account.id ? { ...acc, isConnected: true } : acc
        );
        saveAccounts(
          updated,
          t('restaurant.accounts.connectedNotice', { name: account.name })
        );
        setLoadingId(null);
      }, 500);
    }
  };

  const handleConfirmDisconnect = () => {
    if (!confirmAccount) return;

    setLoadingId(confirmAccount.id);
    const target = confirmAccount;
    setConfirmAccount(null);

    setTimeout(() => {
      const updated = accounts.map((acc) =>
        acc.id === target.id ? { ...acc, isConnected: false } : acc
      );
      saveAccounts(
        updated,
        t('restaurant.accounts.disconnectedNotice', { name: target.name })
      );
      setLoadingId(null);
    }, 400);
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header Restaurant */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.storeAvatar}>
              <Store size={22} className={styles.storeIcon} />
            </div>
            <div>
              <h1 className={styles.headerTitle}>{restaurantName}</h1>
              <p className={styles.headerSubtitle}>{t('restaurant.header.subtitle')}</p>
            </div>
          </div>
        </header>

        {/* Notice temporaire de confirmation */}
        {notice && (
          <div className={styles.savedNotice}>
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
        )}

        {/* Navigation Interne (Tabs) */}
        <nav className={styles.tabsNav} aria-label={t('restaurant.tabs.label')}>
          <Link href="/dashboard/restaurant" className={styles.tabBtn}>
            <Store size={14} />
            <span>{t('restaurant.tabs.profile')}</span>
          </Link>

          <Link href="/dashboard/restaurant/offers" className={styles.tabBtn}>
            <Tag size={14} />
            <span>{t('restaurant.tabs.offers')}</span>
          </Link>

          <Link href="/dashboard/restaurant/events" className={styles.tabBtn}>
            <Calendar size={14} />
            <span>{t('restaurant.tabs.events')}</span>
          </Link>

          <Link
            href="/dashboard/restaurant/accounts"
            className={`${styles.tabBtn} ${styles.tabActive}`}
          >
            <Share2 size={14} />
            <span>{t('restaurant.tabs.accounts')}</span>
          </Link>
        </nav>

        {/* CONTENU ONGLET COMPTES (ÉCRAN 17) */}
        <main className={styles.mainContent}>
          <div className={styles.offersHeaderRow}>
            <div>
              <h2 className={styles.tabSectionTitle}>{t('restaurant.accounts.title')}</h2>
              <p className={styles.tabSectionSubtitle}>
                {t('restaurant.accounts.summary', {
                  connected: accounts.filter((a) => a.isConnected).length,
                  plural: accounts.filter((a) => a.isConnected).length > 1 ? 's' : '',
                  total: accounts.length,
                })}
              </p>
            </div>
          </div>

          {/* Liste des comptes sociaux */}
          <div className={styles.offersList}>
            {accounts.map((account) => (
              <RestaurantAccountCard
                key={account.id}
                account={account}
                onActionClick={handleActionClick}
                isLoading={loadingId === account.id}
              />
            ))}
          </div>
        </main>

        {/* Modale de Confirmation de Déconnexion */}
        {confirmAccount && (
          <div className={styles.confirmModalOverlay} role="dialog" aria-modal="true">
            <div className={styles.confirmModalCard}>
              <div className={styles.confirmIconCircle}>
                <AlertTriangle size={24} className={styles.alertIcon} />
              </div>

              <h3 className={styles.confirmTitle}>
                {t('restaurant.accounts.disconnectTitle', { name: confirmAccount.name })}
              </h3>

              <p className={styles.confirmMessage}>
                {t('restaurant.accounts.confirmPrefix')}{' '}
                <strong>{confirmAccount.username}</strong> {t('restaurant.accounts.confirmSuffix')}
              </p>

              <div className={styles.confirmActionsRow}>
                <button
                  type="button"
                  onClick={() => setConfirmAccount(null)}
                  className={styles.cancelConfirmBtn}
                >
                  {t('restaurant.accounts.cancel')}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDisconnect}
                  className={styles.destructiveBtn}
                >
                  {t('restaurant.accounts.confirmDisconnect')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Spacer pour Bottom Navigation */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
