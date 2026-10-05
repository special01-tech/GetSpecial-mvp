'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Eye, Sparkles, ArrowRight } from 'lucide-react';
import Logo from '@/components/ui/Logo/Logo';
import BenefitItem from '@/components/ui/BenefitItem/BenefitItem';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import RestaurantVisual from '@/components/ui/RestaurantVisual/RestaurantVisual';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useLanguage } from '@/i18n';
import styles from './page.module.css';

/**
 * Écran 1 : Splash / Accueil GetSpecial
 *
 * Écran de bienvenue mobile & desktop respectant scrupuleusement la charte :
 * - Fond ivoire / blanc très épuré (#F2F2F2)
 * - Identité vert forêt (#FF5A00)
 * - Typographie moderne et soignée
 * - 3 bénéfices clairs
 * - Visuel restaurant avec badge flottant
 * - CTA "Commencer" guidant vers l'inscription / login
 */
export default function SplashPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState(false);

  React.useEffect(() => {
    try {
      const isCompleted = localStorage.getItem('getspecial_onboarding_completed') === 'true';
      setHasCompletedOnboarding(isCompleted);
    } catch {
      // Ignorer
    }
  }, []);

  const handleStart = () => {
    // Navigation vers le flux d'onboarding / authentification
    router.push('/login');
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header Branding */}
        <header className={styles.header}>
          <Logo size="md" showTagline={false} />
          <LanguageToggle compact />
        </header>

        {/* Corps principal : visuel + message */}
        <main className={styles.mainContent}>
          {/* Illustration / Photo de restaurant */}
          <div className={styles.visualSection}>
            <RestaurantVisual
              imageUrl="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
              badgeText={t('common.splash.badge')}
            />
          </div>

          {/* Accroche & Slogan */}
          <div className={styles.heroSection}>
            <h1 className={styles.slogan}>{t('common.splash.slogan')}</h1>
            <p className={styles.subtext}>{t('common.splash.subtext')}</p>
          </div>

          {/* Les 3 Bénéfices */}
          <div className={styles.benefitsGrid}>
            <BenefitItem
              icon={Users}
              title={t('common.splash.benefit1Title')}
              description={t('common.splash.benefit1Desc')}
            />
            <BenefitItem
              icon={Eye}
              title={t('common.splash.benefit2Title')}
              description={t('common.splash.benefit2Desc')}
            />
            <BenefitItem
              icon={Sparkles}
              title={t('common.splash.benefit3Title')}
              description={t('common.splash.benefit3Desc')}
            />
          </div>
        </main>

        {/* Footer Actions */}
        <footer className={styles.footer}>
          <PrimaryButton
            onClick={handleStart}
            icon={<ArrowRight size={18} />}
          >
            {hasCompletedOnboarding ? t('common.splash.createNew') : t('common.splash.start')}
          </PrimaryButton>

          {hasCompletedOnboarding && (
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              style={{
                marginTop: '12px',
                background: 'transparent',
                border: '1px solid #E5E5E5',
                borderRadius: '10px',
                padding: '10px 18px',
                color: '#FF5A00',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              {t('common.splash.goToDashboard')}
            </button>
          )}

          <p className={styles.disclaimer}>{t('common.splash.disclaimer')}</p>
        </footer>
      </div>
    </div>
  );
}
