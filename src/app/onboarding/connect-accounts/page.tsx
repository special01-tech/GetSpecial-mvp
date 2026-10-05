'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Share2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
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
 * Écran 8 : Connexion des comptes
 *
 * Conforme à la maquette :
 * - Titre : "Connectez vos comptes"
 * - Sous-titre
 * - Comptes listés : Facebook, Instagram, Google Business
 * - Pour chaque compte : logo, nom, statut connecté/non connecté, bouton Connecter
 * - Google Business avec badge spécifique (référencement local)
 * - Mention : "Vous pouvez continuer sans connecter de compte."
 * - Bouton "Suivant"
 */
export default function ConnectAccountsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [accounts, setAccounts] = useState<SocialAccountConfig[]>(DEFAULT_SOCIAL_ACCOUNTS);
  const [loadingPlatform, setLoadingPlatform] = useState<SocialPlatformId | null>(null);

  // Chargement des comptes précédemment connectés
  useEffect(() => {
    try {
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/connect-accounts');
      const stored = localStorage.getItem('getspecial_social_accounts');
      if (stored) {
        setAccounts(JSON.parse(stored));
      }
    } catch {
      // Conserver la liste par défaut
    }
  }, []);

  // Action Connecter / Déconnecter
  const handleToggleConnect = async (platformId: SocialPlatformId) => {
    setLoadingPlatform(platformId);

    // Simulation d'OAuth popup / redirection
    await new Promise((resolve) => setTimeout(resolve, 600));

    setAccounts((prev) => {
      const updated = prev.map((acc) => {
        if (acc.id === platformId) {
          const isCurrentlyConnected = acc.status === 'connected' || acc.status === 'verified';
          if (isCurrentlyConnected) {
            return {
              ...acc,
              status: 'disconnected' as const,
              accountHandle: undefined,
            };
          } else {
            return {
              ...acc,
              status: 'connected' as const,
              accountHandle:
                acc.id === 'instagram'
                  ? '@restaurant_officiel'
                  : acc.id === 'facebook'
                  ? 'facebook.com/restaurant'
                  : t('onboarding.connectAccounts.googleVerified'),
            };
          }
        }
        return acc;
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('getspecial_social_accounts', JSON.stringify(updated));
      }

      return updated;
    });

    setLoadingPlatform(null);
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
