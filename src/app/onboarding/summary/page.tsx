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
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useLanguage } from '@/i18n';
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

export default function OnboardingSummaryPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const DEFAULT_RECAP: RecapState = {
    restaurantName: t('onboarding.summary.defaultName'),
    type: t('onboarding.summary.defaultType'),
    specialties: t('onboarding.summary.defaultSpecialties'),
    hours: t('onboarding.summary.defaultHours'),
    country: t('onboarding.summary.defaultCountry'),
    hasTerrace: true,
    hasDelivery: false,
    ambiance: t('onboarding.summary.defaultAmbiance'),
  };

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
            restaurant: t('onboarding.summary.typeRestaurant'),
            bar: t('onboarding.summary.typeBar'),
            sports_bar: t('onboarding.summary.typeSportsBar'),
            brasserie: t('onboarding.summary.typeBrasserie'),
            cafe: t('onboarding.summary.typeCafe'),
            fast_food: t('onboarding.summary.typeFastFood'),
            pizzeria: t('onboarding.summary.typePizzeria'),
            autre: t('onboarding.summary.typeOther'),
          };
          currentType = parsedTypes.map((t) => typeLabels[t] || t).join(', ');
        }
      }

      if (storedBrand) {
        const parsedBrand = JSON.parse(storedBrand);
        if (parsedBrand.tones && parsedBrand.tones.length > 0) {
          const toneLabels: Record<string, string> = {
            chaleureux: t('onboarding.summary.toneWarm'),
            convivial: t('onboarding.summary.toneWelcoming'),
            gourmand: t('onboarding.summary.toneFoodie'),
            festif: t('onboarding.summary.toneLively'),
            chic_elegant: t('onboarding.summary.toneUpscale'),
            decontracte: t('onboarding.summary.toneCasual'),
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
            <span>{t('onboarding.summary.badgeDone')}</span>
          </div>
          <LanguageToggle compact />
        </header>

        <main className={styles.mainContent}>
          <div className={styles.titleArea}>
            <div className={styles.celebrationIconWrapper}>
              <Rocket size={24} className={styles.rocketIcon} />
            </div>
            <h1 className={styles.title}>{t('onboarding.summary.title')}</h1>
            <p className={styles.subtitle}>
              {t('onboarding.summary.subtitle')}
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
              <span className={styles.recapTitle}>{t('onboarding.summary.profileTitle')}</span>
              <span className={styles.liveTag}>{t('onboarding.summary.activeTag')}</span>
            </div>

            <div className={styles.itemsList}>
              <SummaryItem
                icon={Store}
                label={t('onboarding.summary.labelRestaurant')}
                value={recap.restaurantName}
              />
              <SummaryItem
                icon={Globe}
                label={t('onboarding.summary.labelCountry')}
                value={recap.country}
              />
              <SummaryItem
                icon={Tag}
                label={t('onboarding.summary.labelCategory')}
                value={recap.type}
              />
              <SummaryItem
                icon={Utensils}
                label={t('onboarding.summary.labelSpecialties')}
                value={recap.specialties}
              />
              <SummaryItem
                icon={Clock}
                label={t('onboarding.summary.labelHours')}
                value={recap.hours}
              />
              <SummaryItem
                icon={Sun}
                label={t('onboarding.summary.labelTerrace')}
                value={recap.hasTerrace ? t('onboarding.summary.yes') : t('onboarding.summary.no')}
                badge={recap.hasTerrace ? t('onboarding.summary.badgeWeather') : undefined}
                isPositive={recap.hasTerrace}
              />
              <SummaryItem
                icon={Bike}
                label={t('onboarding.summary.labelDelivery')}
                value={recap.hasDelivery ? t('onboarding.summary.yes') : t('onboarding.summary.no')}
                badge={recap.hasDelivery ? t('onboarding.summary.activeTag') : t('onboarding.summary.badgeDisabled')}
                isPositive={recap.hasDelivery}
              />
              <SummaryItem
                icon={Sparkles}
                label={t('onboarding.summary.labelVoice')}
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
              {isSubmitting ? t('onboarding.summary.launching') : t('onboarding.summary.launchCta')}
            </PrimaryButton>

            <p className={styles.footerDisclaimer}>
              {t('onboarding.summary.footerNote')}
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
