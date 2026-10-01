'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Utensils,
  Zap,
  Truck,
  Wine,
  Coffee,
  Croissant,
  UploadCloud,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import styles from './onboarding.module.css';

interface RestaurantTypeChoice {
  id: string;
  name: string;
  emoji: string;
  icon: React.ComponentType<{ size?: number }>;
}

const RESTAURANT_TYPES: RestaurantTypeChoice[] = [
  { id: 'restaurant', name: 'Restaurant traditionnel', emoji: '🍽️', icon: Utensils },
  { id: 'fastfood', name: 'Fast-food / Snack', emoji: '🍔', icon: Zap },
  { id: 'foodtruck', name: 'Food truck', emoji: '🚚', icon: Truck },
  { id: 'bar', name: 'Bar / Lounge', emoji: '🍸', icon: Wine },
  { id: 'cafe', name: 'Café / Brunch', emoji: '☕', icon: Coffee },
  { id: 'bakery', name: 'Boulangerie / Traiteur', emoji: '🥐', icon: Croissant },
];

const GOAL_OPTIONS = [
  { id: 'more_clients', label: "🎯 Attirer plus de clients au quotidien" },
  { id: 'off_peak', label: "📉 Remplir certains jours creux" },
  { id: 'delivery', label: "🛵 Développer la livraison & à emporter" },
  { id: 'happy_hour', label: "🍸 Booster l'Happy Hour & les soirées" },
  { id: 'promote_dishes', label: "🍲 Faire découvrir de nouveaux plats" },
  { id: 'brand_awareness', label: "✨ Augmenter la notoriété sur Instagram/Facebook" },
];

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Lundi' },
  { id: 'tuesday', label: 'Mardi' },
  { id: 'wednesday', label: 'Mercredi' },
  { id: 'thursday', label: 'Jeudi' },
  { id: 'friday', label: 'Vendredi' },
  { id: 'saturday', label: 'Samedi' },
  { id: 'sunday', label: 'Dimanche' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Étape 1 : Identité
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedType, setSelectedType] = useState('restaurant');

  // Étape 2 : Menu & Identité visuelle
  const [menuFileName, setMenuFileName] = useState<string | null>(null);
  const [instagramHandle, setInstagramHandle] = useState('');
  const [facebookHandle, setFacebookHandle] = useState('');
  const [tone, setTone] = useState('Convivial');

  // Étape 3 : Ambitions & Objectifs
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['more_clients']);
  const [offPeakDays, setOffPeakDays] = useState<string[]>(['monday', 'tuesday']);

  // Étape 4 : Progression IA
  const [analysisStep, setAnalysisStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleDay = (id: string) => {
    setOffPeakDays((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      setErrorMsg("Veuillez renseigner le nom de votre établissement.");
      return;
    }
    if (step === 1 && !address.trim()) {
      setErrorMsg("Veuillez renseigner la ville ou l'adresse de votre établissement.");
      return;
    }

    setErrorMsg(null);
    if (step < 3) {
      setStep((prev) => (prev + 1) as 2 | 3);
    } else if (step === 3) {
      submitOnboarding();
    }
  };

  const submitOnboarding = async () => {
    setStep(4);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type: selectedType,
          address,
          tone,
          goals: selectedGoals,
          offPeakDays: selectedGoals.includes('off_peak') ? offPeakDays : [],
          instagramHandle: instagramHandle.trim() || null,
          facebookHandle: facebookHandle.trim() || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de l'enregistrement");
      }

      // Séquence d'animation montrant le travail d'ingestion de l'IA
      setTimeout(() => setAnalysisStep(2), 900);
      setTimeout(() => setAnalysisStep(3), 1800);
      setTimeout(() => setAnalysisStep(4), 2600);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 3500);
    } catch (err: any) {
      console.error('Erreur onboarding:', err);
      setErrorMsg(err.message || "Une erreur est survenue. Veuillez réessayer.");
      setStep(3);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Brand Header */}
      <div className={styles.brandHeader}>
        <div className={styles.logoIcon}>G</div>
        <span className={styles.logoText}>GetSpecial</span>
      </div>

      <div className={styles.container}>
        {/* Header Stepper Indicator */}
        {step < 4 && (
          <div className={styles.stepperHeader}>
            <div className={`${styles.stepIndicator} ${step >= 1 ? styles.stepIndicatorActive : ''}`}>
              <span className={`${styles.stepNumber} ${step >= 1 ? styles.stepNumberActive : ''}`}>
                1
              </span>
              <span>Établissement</span>
            </div>

            <span className={styles.stepDivider} />

            <div className={`${styles.stepIndicator} ${step >= 2 ? styles.stepIndicatorActive : ''}`}>
              <span className={`${styles.stepNumber} ${step >= 2 ? styles.stepNumberActive : ''}`}>
                2
              </span>
              <span>Menu & Style</span>
            </div>

            <span className={styles.stepDivider} />

            <div className={`${styles.stepIndicator} ${step >= 3 ? styles.stepIndicatorActive : ''}`}>
              <span className={`${styles.stepNumber} ${step >= 3 ? styles.stepNumberActive : ''}`}>
                3
              </span>
              <span>Ambitions</span>
            </div>
          </div>
        )}

        <div className={styles.card}>
          {/* ÉTAPE 1 : Identité */}
          {step === 1 && (
            <>
              <h1 className={styles.title}>Parlez-nous de votre restaurant 🍽️</h1>
              <p className={styles.subtitle}>
                Moins de 90 secondes suffisent à votre copilote pour comprendre qui vous êtes.
              </p>

              {errorMsg && (
                <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '16px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Nom de l&apos;établissement</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Le Comptoir, Bistro des Halles, Burger Shack..."
                  className={styles.input}
                  autoFocus
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Ville ou adresse de l&apos;établissement</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Cotonou, Paris 11e, Abidjan Plateau, Lyon..."
                  className={styles.input}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Type d&apos;établissement</label>
                <div className={styles.typeGrid}>
                  {RESTAURANT_TYPES.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedType(t.id)}
                      className={`${styles.typeCard} ${selectedType === t.id ? styles.typeCardActive : ''}`}
                    >
                      <span className={styles.typeEmoji}>{t.emoji}</span>
                      <span className={styles.typeName}>{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ÉTAPE 2 : Menu & Univers */}
          {step === 2 && (
            <>
              <h1 className={styles.title}>Montrez-nous votre univers 📸</h1>
              <p className={styles.subtitle}>
                Pas besoin de tout taper : déposez votre carte ou donnez votre profil social.
              </p>

              {/* Dropzone Menu */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Votre carte ou menu (PDF ou photo)</label>
                <label className={styles.dropzone}>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setMenuFileName(f.name);
                    }}
                  />
                  <UploadCloud size={32} color="#FF5C00" />
                  <span className={styles.dropzoneTitle}>
                    {menuFileName ? `Fichier prêt : ${menuFileName}` : 'Glissez votre menu ou cliquez pour importer'}
                  </span>
                  <span className={styles.dropzoneHint}>
                    {menuFileName
                      ? "L'IA analysera vos spécialités dès la validation"
                      : 'PDF, JPG ou PNG • GetSpecial en extrait vos plats phares'}
                  </span>
                </label>
              </div>

              {/* Réseaux sociaux */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Vos comptes sociaux (optionnel)</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    placeholder="Instagram (ex: @mon_resto)"
                    className={styles.input}
                  />
                  <input
                    type="text"
                    value={facebookHandle}
                    onChange={(e) => setFacebookHandle(e.target.value)}
                    placeholder="Page Facebook"
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Tonalité */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Ton de communication préféré</label>
                <div className={styles.chipsRow}>
                  {['Convivial', 'Festif', 'Gourmet & Passionné', 'Dynamique & Rapide', 'Élégant'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`${styles.chip} ${tone === t ? styles.chipActive : ''}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ÉTAPE 3 : Objectifs marketing */}
          {step === 3 && (
            <>
              <h1 className={styles.title}>Qu&apos;est-ce que vous voulez développer ? 🎯</h1>
              <p className={styles.subtitle}>
                Cochez ce qui compte pour vous. Votre copilote calibrera ses opportunités en priorité dessus.
              </p>

              {errorMsg && (
                <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '16px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Vos objectifs actuels (cliquez pour sélectionner)</label>
                <div className={styles.chipsRow} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {GOAL_OPTIONS.map((g) => {
                    const isSelected = selectedGoals.includes(g.id);
                    return (
                      <div
                        key={g.id}
                        onClick={() => toggleGoal(g.id)}
                        className={`${styles.chip} ${isSelected ? styles.chipActive : ''}`}
                        style={{ padding: '12px 18px', width: '100%', justifyContent: 'flex-start' }}
                      >
                        <CheckCircle2 size={16} color={isSelected ? '#FF5C00' : 'rgba(255,255,255,0.2)'} />
                        <span>{g.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedGoals.includes('off_peak') && (
                <div className={styles.fieldGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.label}>Quels sont vos jours les plus calmes ?</label>
                  <div className={styles.chipsRow}>
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = offPeakDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleDay(d.id)}
                          className={`${styles.chip} ${isSelected ? styles.chipActive : ''}`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ÉTAPE 4 : Apprentissage IA */}
          {step === 4 && (
            <div className={styles.learningBox}>
              <div className={styles.loaderSpinner} />
              <h2 className={styles.title} style={{ fontSize: '1.4rem' }}>
                GetSpecial configure votre copilote marketing ✨
              </h2>
              <p className={styles.subtitle} style={{ marginBottom: '16px' }}>
                Analyse du contexte, de la météo et préparation de votre tableau de bord...
              </p>

              <div className={styles.checklist}>
                <div className={`${styles.checkItem} ${analysisStep >= 1 ? styles.checkItemDone : ''}`}>
                  <span className={`${styles.checkIcon} ${analysisStep >= 1 ? styles.checkIconDone : styles.checkIconPending}`}>
                    ✓
                  </span>
                  <span>Fiche établissement & géolocalisation enregistrées</span>
                </div>

                <div className={`${styles.checkItem} ${analysisStep >= 2 ? styles.checkItemDone : ''}`}>
                  <span className={`${styles.checkIcon} ${analysisStep >= 2 ? styles.checkIconDone : styles.checkIconPending}`}>
                    ✓
                  </span>
                  <span>Analyse météo locale en direct via Open-Meteo</span>
                </div>

                <div className={`${styles.checkItem} ${analysisStep >= 3 ? styles.checkItemDone : ''}`}>
                  <span className={`${styles.checkIcon} ${analysisStep >= 3 ? styles.checkIconDone : styles.checkIconPending}`}>
                    ✓
                  </span>
                  <span>Calibration du ton marketing ({tone}) & offres</span>
                </div>

                <div className={`${styles.checkItem} ${analysisStep >= 4 ? styles.checkItemDone : ''}`}>
                  <span className={`${styles.checkIcon} ${analysisStep >= 4 ? styles.checkIconDone : styles.checkIconPending}`}>
                    ✓
                  </span>
                  <span>3 opportunités sur-mesure prêtes pour aujourd&apos;hui !</span>
                </div>
              </div>
            </div>
          )}

          {/* Boutons de navigation */}
          {step < 4 && (
            <div className={styles.actionsRow}>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => (prev - 1) as 1 | 2)}
                  className={styles.btnSecondary}
                >
                  <ArrowLeft size={14} />
                  <span>Retour</span>
                </button>
              ) : (
                <div />
              )}

              <button type="button" onClick={handleNext} className={styles.btnPrimary}>
                <span>{step === 3 ? 'Activer mon copilote ✨' : 'Continuer →'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
