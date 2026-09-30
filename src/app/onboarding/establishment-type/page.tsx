'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import Logo from '@/components/ui/Logo/Logo';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import EstablishmentTypeCard from '@/components/ui/EstablishmentTypeCard/EstablishmentTypeCard';
import { ESTABLISHMENT_TYPES } from '@/services/onboarding/establishment-types.data';
import styles from './establishment-type.module.css';

export default function EstablishmentTypePage() {
  const router = useRouter();

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/establishment-type');
      const stored = localStorage.getItem('getspecial_establishment_types');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedTypes(parsed);
          return;
        }
      }

      // Par défaut, pré-sélectionner Casual Dining pour le marché US
      setSelectedTypes(['casual_dining']);
    } catch {
      setSelectedTypes(['casual_dining']);
    }
  }, []);

  const handleToggle = (id: string) => {
    setErrorMsg(null);
    setSelectedTypes((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleNext = () => {
    if (selectedTypes.length === 0) {
      setErrorMsg('Please select at least one concept category to continue.');
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_establishment_types', JSON.stringify(selectedTypes));
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/hours');
    }

    router.push('/onboarding/hours');
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <button
            onClick={() => router.push('/onboarding/confirm')}
            className={styles.backButton}
            aria-label="Back to confirmation"
          >
            <ArrowLeft size={18} />
          </button>
          <Logo size="md" showTagline={false} />
          <div className={styles.stepIndicator}>
            <span className={styles.stepDotDone} />
            <span className={styles.stepDotDone} />
            <span className={styles.stepDotActive} />
          </div>
        </header>

        <main className={styles.mainContent}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>What type of establishment?</h1>
            <p className={styles.subtitle}>
              GetSpecial adapts sports, weather, and foot traffic signals to your unique concept.
            </p>
          </div>

          {errorMsg && (
            <div className={styles.errorBox}>
              <AlertCircle size={16} className={styles.errorIcon} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className={styles.grid}>
            {ESTABLISHMENT_TYPES.map((option) => (
              <EstablishmentTypeCard
                key={option.id}
                option={option}
                isSelected={selectedTypes.includes(option.id)}
                onToggle={handleToggle}
              />
            ))}
          </div>

          <footer className={styles.footer}>
            <PrimaryButton
              onClick={handleNext}
              disabled={selectedTypes.length === 0}
              icon={<ArrowRight size={18} />}
            >
              Next: Hours & Peak Times
            </PrimaryButton>

            <div className={styles.helperRow}>
              <Sparkles size={14} className={styles.sparkleIcon} />
              <span className={styles.helperText}>
                You can select multiple categories (e.g., Casual Dining + Sports Bar).
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
