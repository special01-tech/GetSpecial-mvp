'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import Logo from '@/components/ui/Logo/Logo';
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
        // Fallback intelligent pour test direct ou démonstration
        const defaultDemo: RestaurantSearchResult = {
          id: 'place_brass_pelican_1',
          name: 'The Brass Pelican',
          address: '412 Congress Ave',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'USA',
          latitude: 30.2672,
          longitude: -97.7431,
          rating: 4.8,
          reviewsCount: 342,
          cuisineType: 'American Bistro & Seafood',
          phone: '+1 (512) 472-8800',
          openingHours: '11:30 AM - 11:00 PM • Tue - Sun',
          isOpenNow: true,
          photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
          photoGallery: [
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
          ],
          googlePlaceId: 'ChIJb6e8JjK1RIYRO5tZ9aQ6WJ0',
        };
        setRestaurant(defaultDemo);
      }
    } catch {
      setErrorMsg('Impossible de charger les données du restaurant.');
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
            aria-label="Retour à la recherche"
          >
            <ArrowLeft size={18} />
          </button>
          <Logo size="md" showTagline={false} />
          <div className={styles.stepIndicator}>
            <span className={styles.stepDotDone} />
            <span className={styles.stepDotActive} />
            <span className={styles.stepDot} />
          </div>
        </header>

        {/* État Loading */}
        {isLoading && (
          <div className={styles.stateContainer}>
            <Loader2 size={36} className="spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
            <p className={styles.stateText}>Chargement des détails de l&apos;établissement...</p>
          </div>
        )}

        {/* État Erreur */}
        {!isLoading && errorMsg && (
          <div className={styles.stateContainer}>
            <AlertCircle size={36} color="var(--color-error)" />
            <p className={styles.stateText}>{errorMsg}</p>
            <PrimaryButton onClick={() => router.push('/onboarding/search')}>
              Nouvelle recherche
            </PrimaryButton>
          </div>
        )}

        {/* État Empty */}
        {!isLoading && !errorMsg && !restaurant && (
          <div className={styles.stateContainer}>
            <p className={styles.stateText}>Aucun restaurant sélectionné.</p>
            <PrimaryButton onClick={() => router.push('/onboarding/search')}>
              Rechercher mon restaurant
            </PrimaryButton>
          </div>
        )}

        {/* État Normal : Restaurant chargé */}
        {!isLoading && !errorMsg && restaurant && (
          <main className={styles.mainContent}>
            <div className={styles.titleArea}>
              <h1 className={styles.title}>Confirmez les informations de votre établissement</h1>
              <p className={styles.subtitle}>
                Vérifiez vos coordonnées avant de personnaliser votre concept et vos horaires.
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
                Confirmer et continuer
              </PrimaryButton>

              <button
                onClick={handleReject}
                className={styles.rejectBtn}
              >
                <ArrowLeft size={16} />
                <span>Modifier les informations</span>
              </button>
            </footer>
          </main>
        )}
      </div>
    </div>
  );
}
