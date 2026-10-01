'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Eye, Sparkles, ArrowRight } from 'lucide-react';
import Logo from '@/components/ui/Logo/Logo';
import BenefitItem from '@/components/ui/BenefitItem/BenefitItem';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import RestaurantVisual from '@/components/ui/RestaurantVisual/RestaurantVisual';
import styles from './page.module.css';

/**
 * Écran 1 : Splash / Accueil GetSpecial
 *
 * Écran de bienvenue mobile & desktop respectant scrupuleusement la charte :
 * - Fond ivoire / blanc très épuré (#FAFAF7)
 * - Identité vert forêt (#1B4332)
 * - Typographie moderne et soignée
 * - 3 bénéfices clairs
 * - Visuel restaurant avec badge flottant
 * - CTA "Commencer" guidant vers l'inscription / login
 */
export default function SplashPage() {
  const router = useRouter();

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
        </header>

        {/* Corps principal : visuel + message */}
        <main className={styles.mainContent}>
          {/* Illustration / Photo de restaurant */}
          <div className={styles.visualSection}>
            <RestaurantVisual
              imageUrl="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
              badgeText="Aujourd'hui • Terrasse pleine grâce au soleil"
            />
          </div>

          {/* Accroche & Slogan */}
          <div className={styles.heroSection}>
            <h1 className={styles.slogan}>
              Votre assistant marketing pour un restaurant qui fait parler de lui.
            </h1>
            <p className={styles.subtext}>
              Transformez chaque jour la météo, les événements et vos spécialités en clients à table.
            </p>
          </div>

          {/* Les 3 Bénéfices */}
          <div className={styles.benefitsGrid}>
            <BenefitItem
              icon={Users}
              title="Plus de clients"
              description="Remplissez vos tables aux heures creuses"
            />
            <BenefitItem
              icon={Eye}
              title="Plus de visibilité"
              description="Présence active et ultra-ciblée sur vos réseaux"
            />
            <BenefitItem
              icon={Sparkles}
              title="Moins d'efforts"
              description="Opportunités et posts rédigés en 1 clic"
            />
          </div>
        </main>

        {/* Footer Actions */}
        <footer className={styles.footer}>
          <PrimaryButton
            onClick={handleStart}
            icon={<ArrowRight size={18} />}
          >
            {hasCompletedOnboarding ? 'Créer un nouveau restaurant' : 'Commencer'}
          </PrimaryButton>

          {hasCompletedOnboarding && (
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              style={{
                marginTop: '12px',
                background: 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                padding: '10px 18px',
                color: '#1B4332',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Accéder à mon tableau de bord actif →
            </button>
          )}

          <p className={styles.disclaimer}>
            Sans engagement • Configuration en 2 minutes
          </p>
        </footer>
      </div>
    </div>
  );
}
