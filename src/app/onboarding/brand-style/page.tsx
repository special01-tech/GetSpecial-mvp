'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Sparkles, Palette, PenTool, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/i18n';
import Logo from '@/components/ui/Logo/Logo';
import LanguageToggle from '@/components/ui/LanguageToggle';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import BrandProfile from '@/components/ui/BrandProfile/BrandProfile';
import BrandToneSelector from '@/components/ui/BrandToneSelector/BrandToneSelector';
import {
  BrandProfileData,
  BrandToneId,
  EditorialStyleId,
  DEFAULT_BRAND_PROFILE,
  AVAILABLE_EDITORIAL_STYLES,
} from '@/services/onboarding/brand-profile.types';
import styles from './brand-style.module.css';

const PRESET_COLOR_SWATCHES = [
  { hex: '#1B4332', id: 'presetForest' },
  { hex: '#D4A373', id: 'presetTerracotta' },
  { hex: '#FAEDCD', id: 'presetIvory' },
  { hex: '#2B2D42', id: 'presetSlate' },
  { hex: '#C2593F', id: 'presetBrick' },
  { hex: '#E76F51', id: 'presetCoral' },
  { hex: '#264653', id: 'presetOcean' },
  { hex: '#E9C46A', id: 'presetMustard' },
];

/**
 * Écran 7 : Style de marque
 *
 * Conforme à la maquette :
 * - Titre : "On a analysé vos dernières publications."
 * - Sous-titre
 * - Analyse automatique de la marque
 * - Section "Voix que j'ai trouvée" (ex: Chaleureux, Convivial)
 * - Section "Couleurs" (palette détectée)
 * - Bouton "Personnaliser" permettant de modifier :
 *   - ton de marque (BrandToneSelector)
 *   - couleurs
 *   - style rédactionnel
 * - Bouton "Suivant" avec sauvegarde
 */
export default function BrandStylePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<BrandProfileData>(DEFAULT_BRAND_PROFILE);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Chargement des données persistées s'il y a lieu
  useEffect(() => {
    try {
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/brand-style');
      const stored = localStorage.getItem('getspecial_brand_profile');
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch {
      // Conserver le profil par défaut
    }
  }, []);

  // Gestion des tonalités
  const handleToggleTone = (id: BrandToneId) => {
    setErrorMsg(null);
    setProfile((prev) => {
      const exists = prev.tones.includes(id);
      if (exists) {
        if (prev.tones.length <= 1) {
          setErrorMsg(t('onboarding.brandStyle.toneMinError'));
          return prev;
        }
        return { ...prev, tones: prev.tones.filter((t) => t !== id) };
      } else {
        return { ...prev, tones: [...prev.tones, id] };
      }
    });
  };

  // Gestion du style rédactionnel
  const handleSelectEditorial = (id: EditorialStyleId) => {
    setProfile((prev) => ({
      ...prev,
      editorialStyle: id,
    }));
  };

  // Gestion de l'ajout/remplacement d'une couleur
  const handleToggleColor = (color: { hex: string; name: string }) => {
    setProfile((prev) => {
      const exists = prev.colors.some((c) => c.hex === color.hex);
      if (exists) {
        if (prev.colors.length <= 2) return prev; // Garder au moins 2 couleurs
        return { ...prev, colors: prev.colors.filter((c) => c.hex !== color.hex) };
      } else {
        if (prev.colors.length >= 5) {
          return { ...prev, colors: [...prev.colors.slice(1), color] };
        }
        return { ...prev, colors: [...prev.colors, color] };
      }
    });
  };

  // Validation et suite de l'onboarding
  const handleNext = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_brand_profile', JSON.stringify(profile));
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/connect-accounts');
    }

    // Redirection vers l'étape 8 : Connexion des comptes
    router.push('/onboarding/connect-accounts');
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header avec Navigation Retour */}
        <header className={styles.header}>
          <button
            onClick={() => router.push('/onboarding/hours')}
            className={styles.backButton}
            aria-label={t('onboarding.brandStyle.backLabel')}
          >
            <ArrowLeft size={18} />
          </button>
          <Logo size="md" showTagline={false} />
          <div className={styles.stepBadge}>
            <Sparkles size={13} />
            <span>{t('onboarding.brandStyle.stepBadge')}</span>
          </div>
          <LanguageToggle compact />
        </header>

        {/* Titre & Message IA */}
        <main className={styles.mainContent}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>{t('onboarding.brandStyle.title')}</h1>
            <p className={styles.subtitle}>
              {t('onboarding.brandStyle.subtitle')}
            </p>
          </div>

          {/* Affichage de la synthèse de marque (BrandProfile) */}
          <BrandProfile
            profile={profile}
            onCustomizeClick={() => setIsCustomizing((prev) => !prev)}
            isCustomizing={isCustomizing}
          />

          {/* Tiroir / Section de Personnalisation */}
          {isCustomizing && (
            <div className={styles.customizeDrawer}>
              <div className={styles.drawerHeader}>
                <h2 className={styles.drawerTitle}>{t('onboarding.brandStyle.customizeTitle')}</h2>
                <span className={styles.drawerSub}>{t('onboarding.brandStyle.customizeSubtitle')}</span>
              </div>

              {errorMsg && (
                <div className={styles.errorBox}>
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Tonalité de marque */}
              <div className={styles.fieldSection}>
                <label className={styles.fieldLabel}>{t('onboarding.brandStyle.tonesLabel')}</label>
                <BrandToneSelector
                  selectedTones={profile.tones}
                  onToggleTone={handleToggleTone}
                  maxTones={3}
                />
              </div>

              {/* 2. Palette de couleurs */}
              <div className={styles.fieldSection}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>{t('onboarding.brandStyle.colorsLabel')}</label>
                  <span className={styles.fieldHelper}>{t('onboarding.brandStyle.colorsHint')}</span>
                </div>
                <div className={styles.swatchesPalette}>
                  {PRESET_COLOR_SWATCHES.map((swatch) => {
                    const isSelected = profile.colors.some((c) => c.hex === swatch.hex);
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() =>
                          handleToggleColor({ hex: swatch.hex, name: t(`onboarding.brandStyle.${swatch.id}`) })
                        }
                        className={`${styles.swatchBtn} ${isSelected ? styles.swatchActive : ''}`}
                        style={{ backgroundColor: swatch.hex }}
                        title={t(`onboarding.brandStyle.${swatch.id}`)}
                      >
                        {isSelected && <Check size={14} className={styles.swatchCheck} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Style rédactionnel */}
              <div className={styles.fieldSection}>
                <label className={styles.fieldLabel}>{t('onboarding.brandStyle.editorialLabel')}</label>
                <div className={styles.editorialGrid}>
                  {AVAILABLE_EDITORIAL_STYLES.map((styleOpt) => {
                    const isSelected = profile.editorialStyle === styleOpt.id;
                    return (
                      <button
                        key={styleOpt.id}
                        type="button"
                        onClick={() => handleSelectEditorial(styleOpt.id)}
                        className={`${styles.editorialCard} ${isSelected ? styles.editorialSelected : ''}`}
                      >
                        <div className={styles.editorialRow}>
                          <span className={styles.editorialTitle}>
                            {t(`onboarding.brandStyle.editorial.${styleOpt.id}.label`)}
                          </span>
                          {isSelected && <Check size={14} className={styles.editorialCheck} />}
                        </div>
                        <span className={styles.editorialDesc}>
                          {t(`onboarding.brandStyle.editorial.${styleOpt.id}.description`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer d'action */}
          <footer className={styles.footer}>
            <PrimaryButton
              onClick={handleNext}
              icon={<ArrowRight size={18} />}
            >
              {t('onboarding.brandStyle.next')}
            </PrimaryButton>

            <p className={styles.footerDisclaimer}>
              {t('onboarding.brandStyle.footerNote')}
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
