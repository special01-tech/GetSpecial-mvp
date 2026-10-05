'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import Logo from '@/components/ui/Logo/Logo';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useLanguage } from '@/i18n';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import RestaurantCard from '@/components/ui/RestaurantCard/RestaurantCard';
import { RestaurantSearchResult } from '@/services/restaurant-search/restaurant-search.types';
import styles from './confirm.module.css';

/**
 * Écran 4 : Résultat de recherche restaurant (Validation du restaurant)
 *
 * Affiche :
 * - Titre : "Est-ce bien votre restaurant ?"
 * - RestaurantCard avec photo, nom, adresse, téléphone, horaires, statut ouvert/fermé, galerie
 * - Bouton "C'est bien celui-ci"
 * - Bouton "Non, ce n'est pas le bon"
 * - Gestion complète : loading, empty, error, et restaurant sélectionné
 * - Lors de la confirmation : sauvegarde et redirection vers l'étape Type d'établissement
 */
export default function ConfirmRestaurantPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [restaurant, setRestaurant] = useState<RestaurantSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/confirm');
      const stored = localStorage.getItem('getspecial_selected_restaurant');
      if (stored) {
        setRestaurant(JSON.parse(stored));
      } else {
        const newRestName = localStorage.getItem('getspecial_new_restaurant_name');
        if (newRestName) {
          setRestaurant({
            id: `rest_user_${Date.now()}`,
            name: newRestName,
            address: t('onboarding.confirm.fallbackAddress'),
            city: t('onboarding.confirm.fallbackCity'),
            country: 'FR',
            latitude: 48.8566,
            longitude: 2.3522,
            cuisineType: t('onboarding.confirm.fallbackCuisine'),
            openingHours: t('onboarding.confirm.fallbackHours'),
            isOpenNow: true,
            photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
            photoGallery: [],
          });
        } else {
          router.replace('/onboarding/search');
          return;
        }
      }
    } catch {
      setErrorMsg(t('onboarding.confirm.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Confirmation : C'est bien celui-ci
  const handleConfirm = () => {
    if (!restaurant) return;

    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_confirmed_restaurant', JSON.stringify(restaurant));
      localStorage.setItem('getspecial_selected_restaurant', JSON.stringify(restaurant));
      localStorage.setItem('getspecial_restaurant_id', restaurant.id);
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/establishment-type');
    }

    // Redirection vers l'étape suivante : Type d'établissement
    router.push('/onboarding/establishment-type');
  };

  // Rejet : Non, ce n'est pas le bon
  const handleReject = () => {
    router.push('/onboarding/search');
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header avec Logo & Navigation Retour */}
        <header className={styles.header}>
          <button
            onClick={() => router.push('/onboarding/search')}
            className={styles.backButton}
            aria-label={t('onboarding.confirm.backLabel')}
          >
            <ArrowLeft size={18} />
          </button>
          <Logo size="md" showTagline={false} />
          <div className={styles.stepIndicator}>
            <span className={styles.stepDotDone} />
            <span className={styles.stepDotActive} />
            <span className={styles.stepDot} />
          </div>
          <LanguageToggle compact />
        </header>

        {/* État Loading */}
        {isLoading && (
          <div className={styles.stateContainer}>
            <Loader2 size={36} className="spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
            <p className={styles.stateText}>{t('onboarding.confirm.loading')}</p>
          </div>
        )}

        {/* État Erreur */}
        {!isLoading && errorMsg && (
          <div className={styles.stateContainer}>
            <AlertCircle size={36} color="var(--color-error)" />
            <p className={styles.stateText}>{errorMsg}</p>
            <PrimaryButton onClick={() => router.push('/onboarding/search')}>
              {t('onboarding.confirm.newSearch')}
            </PrimaryButton>
          </div>
        )}

        {/* État Empty */}
        {!isLoading && !errorMsg && !restaurant && (
          <div className={styles.stateContainer}>
            <p className={styles.stateText}>{t('onboarding.confirm.emptyText')}</p>
            <PrimaryButton onClick={() => router.push('/onboarding/search')}>
              {t('onboarding.confirm.searchCta')}
            </PrimaryButton>
          </div>
        )}

        {/* État Normal : Restaurant chargé */}
        {!isLoading && !errorMsg && restaurant && (
          <main className={styles.mainContent}>
            <div className={styles.titleArea}>
              <h1 className={styles.title}>{t('onboarding.confirm.title')}</h1>
              <p className={styles.subtitle}>
                {t('onboarding.confirm.subtitle')}
              </p>
            </div>

            {/* Carte Restaurant complète avec galerie */}
            <div className={styles.cardWrapper}>
              <RestaurantCard restaurant={restaurant} />
            </div>

            {/* Actions : Confirmer ou Modifier */}
            <footer className={styles.actions}>
              <PrimaryButton
                onClick={handleConfirm}
                icon={<Check size={18} strokeWidth={2.5} />}
                className={styles.confirmBtn}
              >
                {t('onboarding.confirm.confirmCta')}
              </PrimaryButton>

              <button
                onClick={handleReject}
                className={styles.rejectBtn}
              >
                <ArrowLeft size={16} />
                <span>{t('onboarding.confirm.editCta')}</span>
              </button>
            </footer>
          </main>
        )}
      </div>
    </div>
  );
}
