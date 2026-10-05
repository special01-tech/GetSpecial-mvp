'use client';

import React from 'react';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  Sun,
  HeartHandshake,
  UtensilsCrossed,
  PartyPopper,
  Smile,
  LucideIcon,
} from 'lucide-react';
import {
  BrandProfileData,
  BrandToneId,
  AVAILABLE_BRAND_TONES,
  AVAILABLE_EDITORIAL_STYLES,
} from '@/services/onboarding/brand-profile.types';
import { useLanguage } from '@/i18n';
import styles from './BrandProfile.module.css';

interface BrandProfileProps {
  profile: BrandProfileData;
  onCustomizeClick: () => void;
  isCustomizing?: boolean;
}

const TONE_ICONS: Record<BrandToneId, LucideIcon> = {
  chaleureux: Sun,
  convivial: HeartHandshake,
  gourmand: UtensilsCrossed,
  festif: PartyPopper,
  chic_elegant: Sparkles,
  decontracte: Smile,
};

/** Correspondance hexadécimal → clé de dictionnaire des couleurs prédéfinies */
const PRESET_HEX_TO_KEY: Record<string, string> = {
  '#1B4332': 'presetForest',
  '#D4A373': 'presetTerracotta',
  '#FAEDCD': 'presetIvory',
  '#2B2D42': 'presetSlate',
  '#C2593F': 'presetBrick',
  '#E76F51': 'presetCoral',
  '#264653': 'presetOcean',
  '#E9C46A': 'presetMustard',
};

export default function BrandProfile({
  profile,
  onCustomizeClick,
  isCustomizing = false,
}: BrandProfileProps) {
  // Retrouver les objets tones sélectionnés
  const { t } = useLanguage();
  const selectedToneObjects = AVAILABLE_BRAND_TONES.filter((tone) =>
    profile.tones.includes(tone.id)
  );

  const selectedEditorialObject = AVAILABLE_EDITORIAL_STYLES.find(
    (e) => e.id === profile.editorialStyle
  );

  // Noms traduits des couleurs prédéfinies (repli : nom stocké dans les données)
  const getPresetColorName = (hex: string): string | undefined => {
    const key = PRESET_HEX_TO_KEY[hex.toUpperCase()];
    return key ? t(`onboarding.brandStyle.${key}`) : undefined;
  };

  return (
    <div className={styles.container}>
      {/* Badge Analyse IA */}
      <div className={styles.aiBadgeRow}>
        <div className={styles.aiBadge}>
          <Sparkles size={14} className={styles.aiIcon} />
          <span>{t('common.components.brandProfile.analysisDone')}</span>
        </div>
        {profile.confidenceScore && (
          <span className={styles.confidenceText}>
            {t('common.components.brandProfile.confidenceLabel', {
              score: profile.confidenceScore,
            })}
          </span>
        )}
      </div>

      {/* Section 1 : Voix que j'ai trouvée */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <span className={styles.sectionTitle}>{t('common.components.brandProfile.foundVoiceTitle')}</span>
          <button
            type="button"
            onClick={onCustomizeClick}
            className={styles.customizeBtn}
          >
            <Sliders size={13} />
            <span>
              {isCustomizing
                ? t('common.components.brandProfile.hide')
                : t('common.components.brandProfile.customize')}
            </span>
          </button>
        </div>

        <div className={styles.tonesList}>
          {selectedToneObjects.map((tone) => {
            const IconComp = TONE_ICONS[tone.id] || Sparkles;
            return (
              <div key={tone.id} className={styles.tonePill}>
                <span className={styles.toneIconBox}>
                  <IconComp size={14} strokeWidth={1.75} />
                </span>
                <span className={styles.toneLabel}>
                  {t(`common.components.brandToneSelector.tones.${tone.id}.label`)}
                </span>
                <CheckCircle2 size={13} className={styles.checkIcon} />
              </div>
            );
          })}
        </div>

        {selectedEditorialObject && (
          <div className={styles.editorialSub}>
            <span className={styles.editorialLabel}>{t('common.components.brandProfile.editorialLabel')}</span>
            <span className={styles.editorialValue}>
              {t(`onboarding.brandStyle.editorial.${selectedEditorialObject.id}.label`)}
            </span>
          </div>
        )}
      </div>

      {/* Section 2 : Couleurs détectées */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionTop}>
          <span className={styles.sectionTitle}>{t('common.components.brandProfile.colorsTitle')}</span>
          <span className={styles.colorCount}>
            {t('common.components.brandProfile.colorCount', {
              count: profile.colors.length,
            })}
          </span>
        </div>

        <div className={styles.paletteGrid}>
          {profile.colors.map((color, idx) => {
            const colorName = getPresetColorName(color.hex) ?? color.name;
            return (
              <div key={idx} className={styles.colorItem}>
                <div
                  className={styles.colorSwatch}
                  style={{ backgroundColor: color.hex }}
                  title={`${colorName} (${color.hex})`}
                />
                <span className={styles.colorName}>{colorName}</span>
                <span className={styles.colorHex}>{color.hex}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
