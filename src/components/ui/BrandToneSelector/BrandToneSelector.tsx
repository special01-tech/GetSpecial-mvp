'use client';

import React from 'react';
import {
  Check,
  Sun,
  HeartHandshake,
  UtensilsCrossed,
  PartyPopper,
  Sparkles,
  Smile,
  LucideIcon,
} from 'lucide-react';
import {
  BrandToneId,
  AVAILABLE_BRAND_TONES,
} from '@/services/onboarding/brand-profile.types';
import { useLanguage } from '@/i18n';
import styles from './BrandToneSelector.module.css';

interface BrandToneSelectorProps {
  selectedTones: BrandToneId[];
  onToggleTone: (id: BrandToneId) => void;
  maxTones?: number;
}

const TONE_ICONS: Record<BrandToneId, LucideIcon> = {
  chaleureux: Sun,
  convivial: HeartHandshake,
  gourmand: UtensilsCrossed,
  festif: PartyPopper,
  chic_elegant: Sparkles,
  decontracte: Smile,
};

export default function BrandToneSelector({
  selectedTones,
  onToggleTone,
  maxTones = 3,
}: BrandToneSelectorProps) {
  const { t } = useLanguage();
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {AVAILABLE_BRAND_TONES.map((tone) => {
          const isSelected = selectedTones.includes(tone.id);
          const isDisabled = !isSelected && selectedTones.length >= maxTones;
          const IconComp = TONE_ICONS[tone.id] || Sparkles;

          return (
            <button
              key={tone.id}
              type="button"
              onClick={() => onToggleTone(tone.id)}
              disabled={isDisabled}
              className={`${styles.toneCard} ${isSelected ? styles.toneSelected : ''} ${
                isDisabled ? styles.toneDisabled : ''
              }`}
              aria-pressed={isSelected}
            >
              <div className={styles.cardHeader}>
                <span className={styles.iconWrapper}>
                  <IconComp size={18} strokeWidth={1.75} />
                </span>
                <div className={`${styles.checkCircle} ${isSelected ? styles.checkActive : ''}`}>
                  {isSelected && <Check size={11} strokeWidth={3} />}
                </div>
              </div>

              <div className={styles.cardBody}>
                <span className={styles.label}>
                  {t(`common.components.brandToneSelector.tones.${tone.id}.label`)}
                </span>
                <span className={styles.description}>
                  {t(`common.components.brandToneSelector.tones.${tone.id}.description`)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <p className={styles.counter}>
        {t('common.components.brandToneSelector.selectedCounter', {
          selected: selectedTones.length,
          max: maxTones,
        })}
      </p>
    </div>
  );
}
