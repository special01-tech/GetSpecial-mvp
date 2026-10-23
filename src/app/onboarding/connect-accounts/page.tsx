'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Share2, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import Logo from '@/components/ui/Logo/Logo';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useLanguage } from '@/i18n';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import SocialAccountCard from '@/components/ui/SocialAccountCard/SocialAccountCard';
import {
  SocialAccountConfig,
  SocialPlatformId,
  DEFAULT_SOCIAL_ACCOUNTS,
} from '@/services/onboarding/social-accounts.types';
import styles from './connect-accounts.module.css';

/**
 * Écran : Connexion des comptes (OAuth Direct Réel)
 *
 * Conforme à la maquette et aux exigences de production :
 * - Intégration OAuth officielle directe (Google Business Profile, Meta / Facebook / Instagram)
 * - Traitement des retours d'autorisation OAuth via searchParams
 * - Affichage transparent des erreurs ou validations réelles
 * - Persistance locale et synchronisation avec le récapitulatif
 */
export default function ConnectAccountsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [accounts, setAccounts] = useState<SocialAccountConfig[]>(DEFAULT_SOCIAL_ACCOUNTS);
  const [loadingPlatform, setLoadingPlatform] = useState<SocialPlatformId | null>(null);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  // Chargement des comptes précédemment connectés & Détection retour OAuth
  useEffect(() => {
    try {
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/connect-accounts');

      let currentAccounts = [...DEFAULT_SOCIAL_ACCOUNTS];
      const stored = localStorage.getItem('getspecial_social_accounts');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentAccounts = parsed;
          }
        } catch {}
      }

      // Vérifier si retour d'autorisation OAuth
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const connectionStatus = urlParams.get('connection');
        const platform = urlParams.get('platform') as SocialPlatformId | null;
        const username = urlParams.get('username');
        const errorMsg = urlParams.get('message');

        if (connectionStatus === 'success' && platform) {
          const updated = currentAccounts.map((acc) => {
            if (acc.id === platform) {
              return {
                ...acc,
                status: 'connected' as const,
                accountHandle: username || 'Compte vérifié',
              };
            }
            return acc;
          });
          currentAccounts = updated;
          setAccounts(updated);
          localStorage.setItem('getspecial_social_accounts', JSON.stringify(updated));

          const displayName = platform === 'google_business' ? 'Google Business' : platform.toUpperCase();
          setSocialNotice(`🎉 Compte ${displayName}${username ? ` (${username})` : ''} connecté avec succès !`);
          window.history.replaceState({}, '', '/onboarding/connect-accounts');
          setTimeout(() => setSocialNotice(null), 5000);
        } else if (connectionStatus === 'error') {
          setAccounts(currentAccounts);
          setSocialError(`⚠️ Échec de connexion : ${errorMsg || 'Autorisation non accordée'}`);
          window.history.replaceState({}, '', '/onboarding/connect-accounts');
          setTimeout(() => setSocialError(null), 6000);
        } else {
          setAccounts(currentAccounts);
        }
      } else {
        setAccounts(currentAccounts);
      }
    } catch {
      // Conserver la liste par défaut
    }
  }, []);

  // Action réelle Connecter / Déconnecter
  const handleToggleConnect = async (platformId: SocialPlatformId) => {
    setSocialError(null);
    setSocialNotice(null);
    setLoadingPlatform(platformId);

    const targetAccount = accounts.find((a) => a.id === platformId);
    const isCurrentlyConnected =
      targetAccount?.status === 'connected' || targetAccount?.status === 'verified';

    if (isCurrentlyConnected) {
      // Déconnexion réelle
      try {
        const restId = localStorage.getItem('getspecial_restaurant_id') || 'rest_onboarding_temp';
        await fetch('/api/social-connections', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantId: restId, platform: platformId }),
        });
      } catch {}

      setAccounts((prev) => {
        const updated = prev.map((acc) => {
          if (acc.id === platformId) {
            return {
              ...acc,
              status: 'disconnected' as const,
              accountHandle: undefined,
            };
          }
          return acc;
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('getspecial_social_accounts', JSON.stringify(updated));
        }

        return updated;
      });

      setSocialNotice(`Compte ${platformId.toUpperCase()} dissocié.`);
      setTimeout(() => setSocialNotice(null), 3500);
      setLoadingPlatform(null);
    } else {
      // Initialiser la vraie redirection OAuth
      try {
        const restId = localStorage.getItem('getspecial_restaurant_id') || 'rest_onboarding_temp';
        const res = await fetch(
          `/api/social/connect?platform=${platformId}&restaurantId=${restId}&returnUrl=${encodeURIComponent('/onboarding/connect-accounts')}`
        );
        const json = await res.json();

        if (res.ok && json.success && json.data?.url) {
          // Redirection vers le fournisseur officiel (Google ou Meta)
          window.location.href = json.data.url;
        } else {
          throw new Error(
            json.error || json.message || `Impossible d’initialiser l'autorisation OAuth pour ${platformId}.`
          );
        }
      } catch (err: any) {
        setSocialError(err.message || 'Une erreur est survenue lors de la tentative de connexion.');
        setLoadingPlatform(null);
      }
    }
  };

  const handleNext = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/summary');
    }
    // Redirection vers l'étape 9 : Récapitulatif final
    router.push('/onboarding/summary');
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/summary');
    }
    // Possibilité de passer directement au récapitulatif
    router.push('/onboarding/summary');
  };

  const connectedCount = accounts.filter(
    (a) => a.status === 'connected' || a.status === 'verified'
  ).length;

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header avec Navigation Retour */}
        <header className={styles.header}>
          <button
            onClick={() => router.push('/onboarding/brand-style')}
            className={styles.backButton}
            aria-label={t('onboarding.connectAccounts.backLabel')}
          >
            <ArrowLeft size={18} />
          </button>
          <Logo size="md" showTagline={false} />
          <div className={styles.stepBadge}>
            <Share2 size={13} />
            <span>{t('onboarding.connectAccounts.stepBadge')}</span>
          </div>
          <LanguageToggle compact />
        </header>

        {/* Titre & Sous-titre */}
        <main className={styles.mainContent}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>{t('onboarding.connectAccounts.title')}</h1>
            <p className={styles.subtitle}>
              {t('onboarding.connectAccounts.subtitle')}
            </p>
          </div>

          {/* Alertes de retour OAuth */}
          {socialNotice && (
            <div className={styles.noticeBanner}>
              <CheckCircle2 size={16} />
              <span>{socialNotice}</span>
            </div>
          )}

          {socialError && (
            <div className={styles.errorBanner}>
              <AlertCircle size={16} />
              <span>{socialError}</span>
            </div>
          )}

          {/* Bandeau d'état récapitulatif */}
          <div className={styles.syncBanner}>
            <ShieldCheck size={16} className={styles.shieldIcon} />
            <span>
              {connectedCount > 0
                ? connectedCount > 1
                  ? t('onboarding.connectAccounts.syncReadyMany', { count: connectedCount })
                  : t('onboarding.connectAccounts.syncReadyOne', { count: connectedCount })
                : t('onboarding.connectAccounts.syncSecure')}
            </span>
          </div>

          {/* Liste des comptes sociaux */}
          <div className={styles.accountsList}>
            {accounts.map((acc) => (
              <SocialAccountCard
                key={acc.id}
                account={acc}
                onToggleConnect={handleToggleConnect}
                isLoading={loadingPlatform === acc.id}
              />
            ))}
          </div>

          {/* Mention : continuer sans compte */}
          <div className={styles.skipArea}>
            <button
              type="button"
              onClick={handleSkip}
              className={styles.skipButton}
            >
              {t('onboarding.connectAccounts.skipCta')}
            </button>
          </div>

          {/* Footer d'action */}
          <footer className={styles.footer}>
            <PrimaryButton
              onClick={handleNext}
              icon={<ArrowRight size={18} />}
            >
              {t('onboarding.connectAccounts.next')}
            </PrimaryButton>

            <div className={styles.helperNotice}>
              <Sparkles size={14} className={styles.sparkleIcon} />
              <span>{t('onboarding.connectAccounts.helperNote')}</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
