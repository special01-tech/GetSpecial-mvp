'use client';

import React from 'react';
import { Sparkles, Sliders, CheckCircle2 } from 'lucide-react';
import {
  BrandProfileData,
  AVAILABLE_BRAND_TONES,
  AVAILABLE_EDITORIAL_STYLES,
} from '@/services/onboarding/brand-profile.types';
import styles from './BrandProfile.module.css';

interface BrandProfileProps {
  profile: BrandProfileData;
  onCustomizeClick: () => void;
  isCustomizing?: boolean;
}

export default function BrandProfile({
  profile,
  onCustomizeClick,
  isCustomizing = false,
}: BrandProfileProps) {
  // Retrouver les objets tones sélectionnés
  const selectedToneObjects = AVAILABLE_BRAND_TONES.filter((t) =>
    profile.tones.includes(t.id)
  );

  const selectedEditorialObject = AVAILABLE_EDITORIAL_STYLES.find(
    (e) => e.id === profile.editorialStyle
  );

  return (
    <div className={styles.container}>
      {/* Badge Analyse IA */}
      <div className={styles.aiBadgeRow}>
        <div className={styles.aiBadge}>
          <Sparkles size={14} className={styles.aiIcon} />
          <span>Analyse automatique terminée</span>
        </div>
        {profile.confidenceScore && (
          <span className={styles.confidenceText}>
            Indice de confiance : {profile.confidenceScore}%
          </span>
        )}
      </div>

      {/* Section 1 : Voix que j'ai trouvée */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <span className={styles.sectionTitle}>Voix que j&apos;ai trouvée</span>
          <button
            type="button"
            onClick={onCustomizeClick}
            className={styles.customizeBtn}
          >
            <Sliders size={13} />
            <span>{isCustomizing ? 'Masquer' : 'Personnaliser'}</span>
          </button>
        </div>

        <div className={styles.tonesList}>
          {selectedToneObjects.map((tone) => (
            <div key={tone.id} className={styles.tonePill}>
              <span className={styles.toneEmoji}>{tone.emoji}</span>
              <span className={styles.toneLabel}>{tone.label}</span>
              <CheckCircle2 size={13} className={styles.checkIcon} />
            </div>
          ))}
        </div>

        {selectedEditorialObject && (
          <div className={styles.editorialSub}>
            <span className={styles.editorialLabel}>Style rédactionnel :</span>
            <span className={styles.editorialValue}>{selectedEditorialObject.label}</span>
          </div>
        )}
      </div>

      {/* Section 2 : Couleurs détectées */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <span className={styles.sectionTitle}>Couleurs détectées</span>
          <span className={styles.colorCount}>{profile.colors.length} teintes identifiées</span>
        </div>

        <div className={styles.paletteGrid}>
          {profile.colors.map((color, idx) => (
            <div key={idx} className={styles.colorItem}>
              <div
                className={styles.colorSwatch}
                style={{ backgroundColor: color.hex }}
                title={`${color.name} (${color.hex})`}
              />
              <span className={styles.colorName}>{color.name}</span>
              <span className={styles.colorHex}>{color.hex}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
