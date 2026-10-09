'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Share2,
  Bell,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
  Check,
} from 'lucide-react';
import { authClientService } from '@/services/auth/auth.client.service';
import LanguageToggle from '@/components/ui/LanguageToggle';
import RestaurantAccountCard from '@/components/ui/RestaurantAccountCard/RestaurantAccountCard';
import {
  ConnectedAccountData,
  INITIAL_CONNECTED_ACCOUNTS,
} from '@/services/restaurant/restaurant-accounts.data';
import { useLanguage } from '@/i18n';
import styles from './settings.module.css';

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPaused, setIsPaused] = useState(false);
  const [maxPostsPerDay, setMaxPostsPerDay] = useState('1');
  const [autoApprove, setAutoApprove] = useState(false);
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [notice, setNotice] = useState<string | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);

  // Gestion des comptes réseaux sociaux (OAuth Direct & Supabase)
  const [accounts, setAccounts] = useState<ConnectedAccountData[]>(INITIAL_CONNECTED_ACCOUNTS);
  const [confirmAccount, setConfirmAccount] = useState<ConnectedAccountData | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Synchronisation des comptes connectés depuis l'API Supabase
  const refreshAccountsFromApi = useCallback(async (restaurantId: string) => {
    try {
      const res = await fetch(`/api/social-connections?restaurantId=${restaurantId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const dbAccounts = json.data;
        setAccounts((prev) => {
          const merged = prev.map((acc) => {
            const found = dbAccounts.find((item: any) => item.platform === acc.id);
            if (found && found.status === 'connected') {
              return {
                ...acc,
                isConnected: true,
                username: found.username || `@${acc.id}_officiel`,
                pageId: found.outstandAccountId,
                lastSyncAt: found.lastSyncAt,
              };
            }
            return {
              ...acc,
              isConnected: false,
              username: 'Non connecté',
            };
          });
          if (typeof window !== 'undefined') {
            localStorage.setItem('getspecial_connected_accounts', JSON.stringify(merged));
          }
          return merged;
        });
      }
    } catch (err) {
      console.warn('Impossible de charger les connexions depuis Supabase:', err);
    }
  }, []);

  useEffect(() => {
    try {
      const paused = localStorage.getItem('getspecial_restaurant_paused') === 'true';
      setIsPaused(paused);

      const stored = localStorage.getItem('getspecial_selected_restaurant');
      let currentRestId = 'rest_demo_austin_1';
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setRestaurantName(parsed.name);
        if (parsed.id) currentRestId = parsed.id;
      }
      const restIdFromStorage = localStorage.getItem('getspecial_restaurant_id');
      if (restIdFromStorage) currentRestId = restIdFromStorage;

      // 1. Détection du retour d'autorisation OAuth dans l'URL (?connection=success ou ?connection=error)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const connectionStatus = urlParams.get('connection');
        const platform = urlParams.get('platform');
        const username = urlParams.get('username');
        const errorMsg = urlParams.get('message');

        if (connectionStatus === 'success' && platform) {
          const displayPlatform = platform === 'google_business' ? 'Google Business' : platform.toUpperCase();
          const accountHandle = username ? ` (${username})` : '';
          setNotice(`🎉 Compte ${displayPlatform}${accountHandle} relié avec succès via OAuth Direct !`);

          // Nettoyer les paramètres de l'URL pour garder une URL propre
          window.history.replaceState({}, '', '/dashboard/settings');
          setTimeout(() => setNotice(null), 4500);
        } else if (connectionStatus === 'error') {
          setNotice(`⚠️ Échec de connexion OAuth : ${errorMsg || 'Autorisation non accordée'}`);
          window.history.replaceState({}, '', '/dashboard/settings');
          setTimeout(() => setNotice(null), 4500);
        }
      }

      // 2. Chargement des comptes en mémoire locale
      const storedAcc = localStorage.getItem('getspecial_connected_accounts');
      if (storedAcc) {
        try {
          setAccounts(JSON.parse(storedAcc));
        } catch {}
      }

      // 3. Rafraîchissement en direct avec la table Supabase social_accounts
      refreshAccountsFromApi(currentRestId);
    } catch {
      // Ignorer
    }
  }, [refreshAccountsFromApi]);

  // Action Connecter / Déconnecter
  const handleActionClick = async (account: ConnectedAccountData) => {
    if (account.isConnected) {
      // Si déjà connecté : ouvrir modale de confirmation avant déconnexion
      setConfirmAccount(account);
    } else {
      // Si non connecté : Initier le flux OAuth Direct (HMAC PKCE -> Redirection officielle)
      setLoadingId(account.id);
      setChannelError(null);
      const restaurantId =
        localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1';

      try {
        const res = await fetch(
          `/api/social/connect?platform=${account.id}&restaurantId=${restaurantId}&returnUrl=/dashboard/settings`
        );
        const json = await res.json();

        if (res.ok && json.success && json.data?.url) {
          // Redirection vers le fournisseur officiel (Google, Meta, TikTok)
          window.location.href = json.data.url;
        } else {
          throw new Error(json.error || json.message || 'Impossible de lancer la connexion OAuth.');
        }
      } catch (err: any) {
        setChannelError(err.message || 'Une erreur est survenue lors de la tentative de connexion.');
        setLoadingId(null);
      }
    }
  };

  // Confirmation de la déconnexion
  const handleConfirmDisconnect = async () => {
    if (!confirmAccount) return;
    setLoadingId(confirmAccount.id);
    const target = confirmAccount;
    setConfirmAccount(null);

    const restaurantId =
      localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1';

    try {
      await fetch('/api/social-connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          platform: target.id,
        }),
      });

      const updated = accounts.map((acc) =>
        acc.id === target.id
          ? { ...acc, isConnected: false, username: 'Non connecté' }
          : acc
      );

      setAccounts(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('getspecial_connected_accounts', JSON.stringify(updated));
      }

      setNotice(
        `Compte ${target.name} déconnecté. Vos futures publications ne seront plus diffusées sur ce canal.`
      );
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setNotice(`Erreur lors de la déconnexion : ${err.message}`);
      setTimeout(() => setNotice(null), 3500);
    } finally {
      setLoadingId(null);
    }
  };

  const toggleEmergencyPause = async () => {
    const newState = !isPaused;
    setIsPaused(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_restaurant_paused', String(newState));
      const restaurantId = localStorage.getItem('getspecial_restaurant_id') || 'rest-demo-1';
      try {
        await fetch('/api/restaurants/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantId, isPaused: newState }),
        });
      } catch (err) {
        console.warn('Could not sync pause state:', err);
      }
    }
    setNotice(
      newState
        ? t('settings.pauseOn')
        : t('settings.pauseOff')
    );
    setTimeout(() => setNotice(null), 4000);
  };

  const handleLogout = async () => {
    await authClientService.logout();
    router.push('/login');
  };

  return (
    <div className={styles.settingsWrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('settings.header.title')}</h1>
        <p className={styles.subtitle}>
          {t('settings.header.subtitle', { name: restaurantName })}
        </p>
      </header>

      {notice && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          background: notice.startsWith('⚠️') ? 'rgba(239, 68, 68, 0.12)' : isPaused ? 'rgba(185, 56, 56, 0.12)' : 'rgba(22, 163, 74,  0.12)',
          color: notice.startsWith('⚠️') ? '#DC2626' : isPaused ? 'var(--color-error)' : 'var(--color-success)',
          marginBottom: '1.5rem',
          fontWeight: 600,
          fontSize: '0.9rem',
        }}>
          {notice}
        </div>
      )}

      {/* Disjoncteur d'urgence */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <ShieldAlert className={styles.sectionIcon} size={22} />
          <h2 className={styles.sectionTitle}>{t('settings.emergency.title')}</h2>
        </div>
        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>
              {isPaused ? t('settings.emergency.paused') : t('settings.emergency.normal')}
            </div>
            <div className={styles.rowDescription}>
              {t('settings.emergency.description')}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleEmergencyPause}
            className={isPaused ? styles.pauseToggleActive : styles.pauseToggleIdle}
          >
            {isPaused ? t('settings.emergency.resume') : t('settings.emergency.pause')}
          </button>
        </div>
      </section>

      {/* Canaux Réseaux Sociaux (OAuth Direct & Supabase) */}
      <section id="channels" className={styles.section}>
        <div className={styles.sectionHeader}>
          <Share2 className={styles.sectionIcon} size={22} />
          <h2 className={styles.sectionTitle}>Comptes & Réseaux Sociaux (OAuth Direct)</h2>
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', margin: '0 0 1rem 0' }}>
          Connectez directement vos comptes officiels Meta (Facebook & Instagram), Google Business ou TikTok pour automatiser la diffusion de vos campagnes.
        </p>

        {channelError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              background: 'rgba(220, 38, 38, 0.08)',
              border: '1.5px solid rgba(220, 38, 38, 0.25)',
              borderRadius: '10px',
              color: '#DC2626',
              fontSize: '0.88rem',
              marginBottom: '1.25rem',
              lineHeight: 1.45,
            }}
          >
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                Échec de la connexion
              </div>
              <div>{channelError}</div>
            </div>
            <button
              onClick={() => setChannelError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#DC2626',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 700,
                padding: '0 4px',
                lineHeight: 1,
              }}
              title="Fermer"
            >
              ✕
            </button>
          </div>
        )}

        <div className={styles.accountsGrid}>
          {accounts.map((account) => (
            <RestaurantAccountCard
              key={account.id}
              account={account}
              onActionClick={handleActionClick}
              isLoading={loadingId === account.id}
            />
          ))}
        </div>
      </section>

      {/* Fréquence de publication */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Radio className={styles.sectionIcon} size={22} />
          <h2 className={styles.sectionTitle}>{t('settings.frequency.title')}</h2>
        </div>
        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>{t('settings.frequency.maxPosts')}</div>
            <div className={styles.rowDescription}>
              {t('settings.frequency.description')}
            </div>
          </div>
          <select
            value={maxPostsPerDay}
            onChange={(e) => {
              setMaxPostsPerDay(e.target.value);
              setNotice(t('settings.frequency.saved', { count: e.target.value }));
              setTimeout(() => setNotice(null), 3000);
            }}
            className={styles.select}
          >
            <option value="1">1 post / jour (Recommandé)</option>
            <option value="2">2 posts / jour</option>
            <option value="3">3 posts / jour</option>
          </select>
        </div>
      </section>

      {/* Validation automatique */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Sliders className={styles.sectionIcon} size={22} />
          <h2 className={styles.sectionTitle}>{t('settings.autoApprove.title')}</h2>
        </div>
        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>{t('settings.autoApprove.label')}</div>
            <div className={styles.rowDescription}>
              {t('settings.autoApprove.description')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !autoApprove;
              setAutoApprove(next);
              setNotice(
                next
                  ? t('settings.autoApprove.noticeEnabled')
                  : t('settings.autoApprove.noticeDisabled')
              );
              setTimeout(() => setNotice(null), 3000);
            }}
            className={autoApprove ? styles.switchOn : styles.switchOff}
            aria-pressed={autoApprove}
            aria-label={t('settings.autoApprove.label')}
          >
            <span className={styles.switchHandle} />
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Bell className={styles.sectionIcon} size={22} />
          <h2 className={styles.sectionTitle}>{t('settings.notifications.title')}</h2>
        </div>
        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>{t('settings.notifications.emailReports')}</div>
            <div className={styles.rowDescription}>
              {t('settings.notifications.emailReportsDesc')}
            </div>
          </div>
          <button
            type="button"
            className={styles.switchOn}
            aria-pressed="true"
            aria-label={t('settings.notifications.emailReports')}
          >
            <span className={styles.switchHandle} />
          </button>
        </div>
      </section>

      {/* Sélecteur de langue */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Share2 className={styles.sectionIcon} size={22} />
          <h2 className={styles.sectionTitle}>{t('settings.language.title')}</h2>
        </div>
        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>{t('settings.language.label')}</div>
            <div className={styles.rowDescription}>
              {t('settings.language.description')}
            </div>
          </div>
          <LanguageToggle />
        </div>
      </section>

      {/* Déconnexion */}
      <div className={styles.logoutWrapper}>
        <button
          type="button"
          onClick={handleLogout}
          className={styles.logoutBtn}
        >
          <LogOut size={18} />
          <span>{t('settings.logout')}</span>
        </button>
      </div>

      {/* Modale de Confirmation de Déconnexion */}
      {confirmAccount && (
        <div className={styles.confirmModalOverlay} role="dialog" aria-modal="true">
          <div className={styles.confirmModalCard}>
            <div className={styles.confirmIconCircle}>
              <AlertTriangle size={24} className={styles.alertIcon} />
            </div>

            <h3 className={styles.confirmTitle}>
              Déconnecter {confirmAccount.name} ?
            </h3>

            <p className={styles.confirmMessage}>
              Êtes-vous sûr de vouloir déconnecter ce compte ? Vos futures campagnes IA ne pourront plus être publiées automatiquement sur ce réseau.
            </p>

            <div className={styles.confirmActionsRow}>
              <button
                type="button"
                onClick={() => setConfirmAccount(null)}
                className={styles.cancelConfirmBtn}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmDisconnect}
                className={styles.destructiveBtn}
              >
                Confirmer la déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
