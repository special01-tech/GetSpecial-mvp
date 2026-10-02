'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Tag,
  Utensils,
  Clock,
  Sun,
  Bike,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Loader2,
  AlertCircle,
  Globe,
} from 'lucide-react';
import Logo from '@/components/ui/Logo/Logo';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import SummaryItem from '@/components/ui/SummaryItem/SummaryItem';
import { getCountryDisplayName } from '@/services/country/countries.data';
import { RestaurantSearchResult } from '@/services/restaurant-search/restaurant-search.types';
import styles from './summary.module.css';

interface RecapState {
  restaurantName: string;
  type: string;
  specialties: string;
  hours: string;
  country: string;
  hasTerrace: boolean;
  hasDelivery: boolean;
  ambiance: string;
}

const DEFAULT_RECAP: RecapState = {
  restaurantName: 'Mon Établissement',
  type: 'Restaurant',
  specialties: 'Spécialités de la maison',
  hours: '11:30 - 23:00 • Lun - Dim',
  country: 'France',
  hasTerrace: true,
  hasDelivery: false,
  ambiance: 'Convivial & Chaleureux',
};

export default function OnboardingSummaryPage() {
  const router = useRouter();

  const [recap, setRecap] = useState<RecapState>(DEFAULT_RECAP);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/summary');

      const storedRestaurant = localStorage.getItem('getspecial_selected_restaurant');
      const storedTypes = localStorage.getItem('getspecial_establishment_types');
      const storedBrand = localStorage.getItem('getspecial_brand_profile');
      const storedHours = localStorage.getItem('getspecial_opening_hours');

      let currentName = DEFAULT_RECAP.restaurantName;
      let currentSpecialties = DEFAULT_RECAP.specialties;
      let currentType = DEFAULT_RECAP.type;
      let currentAmbiance = DEFAULT_RECAP.ambiance;
      let currentHours = DEFAULT_RECAP.hours;
      let currentCountry = DEFAULT_RECAP.country;

      if (storedRestaurant) {
        const parsed: RestaurantSearchResult = JSON.parse(storedRestaurant);
        if (parsed.name) currentName = parsed.name;
        if (parsed.cuisineType) currentSpecialties = parsed.cuisineType;
        if (parsed.openingHours) currentHours = parsed.openingHours;
        if (parsed.country) currentCountry = getCountryDisplayName(parsed.country);
      }

      if (storedTypes) {
        const parsedTypes: string[] = JSON.parse(storedTypes);
        if (parsedTypes.length > 0) {
          const typeLabels: Record<string, string> = {
            restaurant: 'Restaurant',
            bar: 'Bar & Lounge',
            sports_bar: 'Sports Bar',
            brasserie: 'Bistro',
            cafe: 'Café & Coffee Shop',
            fast_food: 'Fast Casual',
            pizzeria: 'Pizzeria',
            autre: 'Eatery',
          };
          currentType = parsedTypes.map((t) => typeLabels[t] || t).join(', ');
        }
      }

      if (storedBrand) {
        const parsedBrand = JSON.parse(storedBrand);
        if (parsedBrand.tones && parsedBrand.tones.length > 0) {
          const toneLabels: Record<string, string> = {
            chaleureux: 'Warm & Friendly',
            convivial: 'Welcoming',
            gourmand: 'Foodie & Craft',
            festif: 'Lively & Upbeat',
            chic_elegant: 'Sophisticated & Upscale',
            decontracte: 'Casual & Relaxed',
          };
          currentAmbiance = parsedBrand.tones.map((t: string) => toneLabels[t] || t).join(', ');
        }
      }

      setRecap({
        restaurantName: currentName,
        type: currentType,
        specialties: currentSpecialties,
        hours: currentHours,
        country: currentCountry,
        hasTerrace: true,
        hasDelivery: false,
        ambiance: currentAmbiance,
      });
    } catch {
      // Ignorer
    }
  }, []);

  const handleStartAssistant = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const storedRestaurant = localStorage.getItem('getspecial_selected_restaurant');
      const storedTypes = localStorage.getItem('getspecial_establishment_types');
      const storedBrand = localStorage.getItem('getspecial_brand_profile');
      const storedHours = localStorage.getItem('getspecial_opening_hours');
      const storedUser = localStorage.getItem('getspecial_auth_user');

      const parsedRest = storedRestaurant ? JSON.parse(storedRestaurant) : null;
      const parsedTypes = storedTypes ? JSON.parse(storedTypes) : ['restaurant'];
      const parsedBrand = storedBrand ? JSON.parse(storedBrand) : null;
      const parsedHours = storedHours ? JSON.parse(storedHours) : null;
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      const addressParts = [
        parsedRest?.address,
        parsedRest?.city,
        parsedRest?.postalCode,
        parsedRest?.country,
      ].filter(Boolean);
      const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Adresse du restaurant';

      // 1. Sauvegarde réelle en base via POST /api/restaurants
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recap.restaurantName,
          type: parsedTypes[0] || 'restaurant',
          address: formattedAddress,
          latitude: parsedRest?.latitude || 48.8566,
          longitude: parsedRest?.longitude || 2.3522,
          country: parsedRest?.country || 'FR',
          userId: parsedUser?.id || undefined,
          openingHours: parsedHours || { general: recap.hours },
          specialties: [recap.specialties],
          tone: parsedBrand?.tones?.[0] || 'friendly',
          hasTerrace: recap.hasTerrace,
          hasDelivery: recap.hasDelivery,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.data?.id) {
          localStorage.setItem('getspecial_restaurant_id', json.data.id);
          localStorage.setItem('getspecial_created_restaurant', JSON.stringify(json.data));
        }
      }
    } catch (err) {
      console.warn('[ONBOARDING_FINALIZE_WARNING] Network or database warning during creation:', err);
    }

    // 2. Marquer l'onboarding comme définitivement terminé
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_onboarding_completed', 'true');
      localStorage.setItem('getspecial_restaurant_status', 'active');
      localStorage.removeItem('getspecial_onboarding_step');
      localStorage.setItem(
        'getspecial_final_recap',
        JSON.stringify({
          ...recap,
          completedAt: new Date().toISOString(),
        })
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 600));
    router.replace('/dashboard');
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Logo size="md" showTagline={false} />
          <div className={styles.successBadge}>
            <CheckCircle2 size={14} className={styles.checkIcon} />
            <span>Setup Complete</span>
          </div>
        </header>

        <main className={styles.mainContent}>
          <div className={styles.titleArea}>
            <div className={styles.celebrationIconWrapper}>
              <Rocket size={24} className={styles.rocketIcon} />
            </div>
            <h1 className={styles.title}>All set! Ready to launch.</h1>
            <p className={styles.subtitle}>
              Here is your marketing profile. GetSpecial will now monitor local weather, sports, and foot traffic to boost your tables.
            </p>
          </div>

          {errorMessage && (
            <div style={{ color: 'var(--color-danger, #ef4444)', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <section className={styles.recapCard}>
            <div className={styles.recapHeader}>
              <span className={styles.recapTitle}>Restaurant Profile</span>
              <span className={styles.liveTag}>Active</span>
            </div>

            <div className={styles.itemsList}>
              <SummaryItem
                icon={Store}
                label="Restaurant"
                value={recap.restaurantName}
              />
              <SummaryItem
                icon={Globe}
                label="Country / Region"
                value={recap.country}
              />
              <SummaryItem
                icon={Tag}
                label="Category"
                value={recap.type}
              />
              <SummaryItem
                icon={Utensils}
                label="Specialties"
                value={recap.specialties}
              />
              <SummaryItem
                icon={Clock}
                label="Hours"
                value={recap.hours}
              />
              <SummaryItem
                icon={Sun}
                label="Patio / Terrace"
                value={recap.hasTerrace ? 'Yes' : 'No'}
                badge={recap.hasTerrace ? 'Weather-aware' : undefined}
                isPositive={recap.hasTerrace}
              />
              <SummaryItem
                icon={Bike}
                label="Delivery"
                value={recap.hasDelivery ? 'Yes' : 'No'}
                badge={recap.hasDelivery ? 'Active' : 'Disabled'}
                isPositive={recap.hasDelivery}
              />
              <SummaryItem
                icon={Sparkles}
                label="Brand Voice"
                value={recap.ambiance}
              />
            </div>
          </section>

          <footer className={styles.footer}>
            <PrimaryButton
              onClick={handleStartAssistant}
              disabled={isSubmitting}
              icon={
                isSubmitting ? (
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <ArrowRight size={18} />
                )
              }
            >
              {isSubmitting ? 'Starting AI Engine...' : 'Launch GetSpecial'}
            </PrimaryButton>

            <p className={styles.footerDisclaimer}>
              Your daily smart marketing recommendations will update each morning.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
