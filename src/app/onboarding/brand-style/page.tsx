'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Sparkles, Palette, PenTool, Check, AlertCircle } from 'lucide-react';
import Logo from '@/components/ui/Logo/Logo';
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
  { hex: '#1B4332', name: 'Vert Forêt' },
  { hex: '#D4A373', name: 'Terracotta' },
  { hex: '#FAEDCD', name: 'Ivoire' },
  { hex: '#2B2D42', name: 'Ardoise' },
  { hex: '#C2593F', name: 'Brique Rouge' },
  { hex: '#E76F51', name: 'Corail Doux' },
  { hex: '#264653', name: 'Bleu Océan' },
  { hex: '#E9C46A', name: 'Moutarde' },
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
          setErrorMsg('Veuillez conserver au minimum 1 tonalité.');
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
            aria-label="Retour aux horaires"
          >
            <ArrowLeft size={18} />
          </button>
          <Logo size="md" showTagline={false} />
          <div className={styles.stepBadge}>
            <Sparkles size={13} />
            <span>Étape 5</span>
          </div>
        </header>

        {/* Titre & Message IA */}
        <main className={styles.mainContent}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>On a analysé vos dernières publications.</h1>
            <p className={styles.subtitle}>
              L&apos;IA a capté l&apos;ADN de votre restaurant pour générer des posts fidèles à votre identité.
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
                <h2 className={styles.drawerTitle}>Personnaliser votre identité</h2>
                <span className={styles.drawerSub}>Ajustez les paramètres selon vos préférences</span>
              </div>

              {errorMsg && (
                <div className={styles.errorBox}>
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Tonalité de marque */}
              <div className={styles.fieldSection}>
                <label className={styles.fieldLabel}>Tonalités de marque (1 à 3 choix)</label>
                <BrandToneSelector
                  selectedTones={profile.tones}
                  onToggleTone={handleToggleTone}
                  maxTones={3}
                />
              </div>

              {/* 2. Palette de couleurs */}
              <div className={styles.fieldSection}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Couleurs de votre univers</label>
                  <span className={styles.fieldHelper}>Cliquez pour ajouter ou retirer</span>
                </div>
                <div className={styles.swatchesPalette}>
                  {PRESET_COLOR_SWATCHES.map((swatch) => {
                    const isSelected = profile.colors.some((c) => c.hex === swatch.hex);
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => handleToggleColor(swatch)}
                        className={`${styles.swatchBtn} ${isSelected ? styles.swatchActive : ''}`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.name}
                      >
                        {isSelected && <Check size={14} className={styles.swatchCheck} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Style rédactionnel */}
              <div className={styles.fieldSection}>
                <label className={styles.fieldLabel}>Style rédactionnel souhaité</label>
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
                          <span className={styles.editorialTitle}>{styleOpt.label}</span>
                          {isSelected && <Check size={14} className={styles.editorialCheck} />}
                        </div>
                        <span className={styles.editorialDesc}>{styleOpt.description}</span>
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
              Suivant
            </PrimaryButton>

            <p className={styles.footerDisclaimer}>
              Vos opportunités quotidiennes adopteront automatiquement ce ton.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
