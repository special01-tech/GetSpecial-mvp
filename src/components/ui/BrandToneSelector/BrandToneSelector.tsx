'use client';

import React from 'react';
import { Check } from 'lucide-react';
import {
  BrandToneId,
  AVAILABLE_BRAND_TONES,
} from '@/services/onboarding/brand-profile.types';
import styles from './BrandToneSelector.module.css';

interface BrandToneSelectorProps {
  selectedTones: BrandToneId[];
  onToggleTone: (id: BrandToneId) => void;
  maxTones?: number;
}

export default function BrandToneSelector({
  selectedTones,
  onToggleTone,
  maxTones = 3,
}: BrandToneSelectorProps) {
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {AVAILABLE_BRAND_TONES.map((tone) => {
          const isSelected = selectedTones.includes(tone.id);
          const isDisabled = !isSelected && selectedTones.length >= maxTones;

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
                <span className={styles.emoji}>{tone.emoji}</span>
                <div className={`${styles.checkCircle} ${isSelected ? styles.checkActive : ''}`}>
                  {isSelected && <Check size={11} strokeWidth={3} />}
                </div>
              </div>

              <div className={styles.cardBody}>
                <span className={styles.label}>{tone.label}</span>
                <span className={styles.description}>{tone.description}</span>
              </div>
            </button>
          );
        })}
      </div>
      <p className={styles.counter}>
        {selectedTones.length} / {maxTones} tonalités sélectionnées
      </p>
    </div>
  );
}
