'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock, Flame, Check, Sparkles } from 'lucide-react';
import Logo from '@/components/ui/Logo/Logo';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import OpeningHoursEditor from '@/components/ui/OpeningHoursEditor/OpeningHoursEditor';
import {
  DayKey,
  DaySchedule,
  PeakTimeOption,
  DEFAULT_WEEK_SCHEDULE,
} from '@/services/onboarding/schedule.types';
import styles from './hours.module.css';

const DAYS_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const PEAK_TIME_OPTIONS: { id: PeakTimeOption; label: string; subtitle: string }[] = [
  {
    id: 'lunch_rush',
    label: 'Lunch Rush',
    subtitle: 'Boost weekday office lunch specials & quick meals',
  },
  {
    id: 'happy_hour',
    label: 'Happy Hour',
    subtitle: 'After-work craft drinks & half-price appetizers (4-7 PM)',
  },
  {
    id: 'dinner_rush',
    label: 'Dinner Rush',
    subtitle: 'Full dining room, prime reservations & weekend sports crowd',
  },
];

export default function OpeningHoursPage() {
  const router = useRouter();

  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(DEFAULT_WEEK_SCHEDULE);
  const [selectedPeakTimes, setSelectedPeakTimes] = useState<PeakTimeOption[]>(['happy_hour', 'dinner_rush']);

  useEffect(() => {
    try {
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/hours');
      const storedSchedule = localStorage.getItem('getspecial_opening_hours');
      if (storedSchedule) {
        setSchedule(JSON.parse(storedSchedule));
      }
      const storedPeaks = localStorage.getItem('getspecial_peak_times');
      if (storedPeaks) {
        setSelectedPeaks(JSON.parse(storedPeaks));
      }
    } catch {
      // Ignorer
    }
  }, []);

  const setSelectedPeaks = (peaks: PeakTimeOption[]) => {
    setSelectedPeakTimes(peaks);
  };

  const handleDayChange = (updated: DaySchedule) => {
    setSchedule((prev) => ({
      ...prev,
      [updated.dayKey]: updated,
    }));
  };

  const togglePeakTime = (id: PeakTimeOption) => {
    setSelectedPeakTimes((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_opening_hours', JSON.stringify(schedule));
      localStorage.setItem('getspecial_peak_times', JSON.stringify(selectedPeakTimes));
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/brand-style');
    }

    router.push('/onboarding/brand-style');
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <button
            onClick={() => router.push('/onboarding/establishment-type')}
            className={styles.backButton}
            aria-label="Back to establishment type"
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
            <h1 className={styles.title}>Hours & Peak Times</h1>
            <p className={styles.subtitle}>
              Configure your service hours so GetSpecial schedules campaigns right when your diners are deciding where to eat.
            </p>
          </div>

          <section className={styles.scheduleCard}>
            <div className={styles.scheduleHeader}>
              <div className={styles.cardHeaderLeft}>
                <Clock size={16} className={styles.headerIcon} />
                <span className={styles.scheduleTitle}>Weekly Operating Hours</span>
              </div>
              <span className={styles.timeZoneBadge}>Auto-synced</span>
            </div>

            <div className={styles.daysList}>
              {DAYS_ORDER.map((dayKey) => {
                const day = schedule[dayKey];
                if (!day) return null;
                return (
                  <OpeningHoursEditor
                    key={dayKey}
                    day={day}
                    onChange={handleDayChange}
                  />
                );
              })}
            </div>
          </section>

          <section className={styles.peakTimesSection}>
            <div className={styles.peakHeader}>
              <Flame size={16} className={styles.flameIcon} />
              <h2 className={styles.peakTitle}>When do you want to drive more covers?</h2>
            </div>
            <p className={styles.peakSubtitle}>
              Select the rush periods where you want the highest table turnover or promotion.
            </p>

            <div className={styles.peakGrid}>
              {PEAK_TIME_OPTIONS.map((opt) => {
                const isSelected = selectedPeakTimes.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => togglePeakTime(opt.id)}
                    className={`${styles.peakCard} ${isSelected ? styles.peakCardSelected : ''}`}
                  >
                    <div className={styles.peakCardContent}>
                      <span className={styles.peakLabel}>{opt.label}</span>
                      <span className={styles.peakDesc}>{opt.subtitle}</span>
                    </div>
                    {isSelected && (
                      <div className={styles.peakCheckBadge}>
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <footer className={styles.footer}>
            <PrimaryButton onClick={handleNext} icon={<ArrowRight size={18} />}>
              Next: Brand Voice & Style
            </PrimaryButton>

            <div className={styles.helperRow}>
              <Sparkles size={14} className={styles.sparkleIcon} />
              <span className={styles.helperText}>
                You can adjust individual shifts anytime in your restaurant settings.
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
