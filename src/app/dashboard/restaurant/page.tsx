'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Store,
  Tag,
  Calendar,
  Sparkles,
  Clock,
  Sun,
  Truck,
  Edit2,
  Check,
  CheckCircle2,
  Moon,
  SunMedium,
  MapPin,
  Phone,
  Coffee,
  Plus,
  Trash2,
  Globe,
  ExternalLink,
  Users,
  Euro,
  UtensilsCrossed,
  Layers,
  Copy,
  SlidersHorizontal,
  Navigation,
  X,
  Palette,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import {
  RestaurantProfileData,
  INITIAL_RESTAURANT_PROFILE,
  OffPeakSlot,
} from '@/services/restaurant/restaurant-profile.data';
import styles from './restaurant.module.css';

/**
 * Normalise les horaires d'ouverture pour l'interface
 */
function normalizeOpeningHours(raw: any) {
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object' && 'day' in raw[0]) {
    return raw;
  }
  return INITIAL_RESTAURANT_PROFILE.openingHours;
}

const TONE_PRESETS = [
  'Chaleureux & Convivial',
  'Gourmand & Généreux',
  'Élégant & Raffiné',
  'Branché & Festif',
  'Traditionnel & Terroir',
  'Moderne & Éco-engagé',
];

const PRESET_OFFPEAK_SLOTS: Omit<OffPeakSlot, 'id'>[] = [
  {
    name: 'Après-midi calme',
    timeStart: '15:00',
    timeEnd: '18:30',
    days: 'Du Lundi au Vendredi',
  },
  {
    name: 'Happy Hour / Début de soirée',
    timeStart: '17:30',
    timeEnd: '19:30',
    days: 'Du Mardi au Samedi',
  },
  {
    name: 'Service Tardif',
    timeStart: '22:00',
    timeEnd: '23:30',
    days: 'Du Jeudi au Samedi',
  },
  {
    name: 'Dimanche Cocooning',
    timeStart: '18:30',
    timeEnd: '21:30',
    days: 'Dimanche',
  },
];

const DAYS_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/**
 * Mon Resto — Profil de l'établissement, Horaires d'ouverture & Heures creuses
 * Remasterisé UX-First & Mobile-Oriented
 */
export default function MyRestaurantPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<RestaurantProfileData>(INITIAL_RESTAURANT_PROFILE);

  // Modes d'édition par section
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingServices, setIsEditingServices] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);

  // Filtre / Navigation rapide par pilules pour mobile
  const [activeSectionFilter, setActiveSectionFilter] = useState<
    'all' | 'identity' | 'specialties' | 'services' | 'hours' | 'offpeak'
  >('all');

  // Spécialités
  const [newSpecialtyInput, setNewSpecialtyInput] = useState('');

  // Création créneau heures creuses
  const [isAddingOffPeak, setIsAddingOffPeak] = useState(false);
  const [newSlotName, setNewSlotName] = useState('Après-midi calme');
  const [newSlotStart, setNewSlotStart] = useState('15:00');
  const [newSlotEnd, setNewSlotEnd] = useState('18:30');
  const [newSlotDays, setNewSlotDays] = useState('Du Lundi au Vendredi');

  // Thème sombre & notifications
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Détection du jour courant
  const todayDayName = useMemo(() => {
    const dayIdx = new Date().getDay();
    return DAYS_NAMES[dayIdx] || 'Lundi';
  }, []);

  // Calcul du score d'optimisation IA de la fiche (0 à 100%)
  const completionScore = useMemo(() => {
    let score = 20; // Base profil existant
    if (profile.name && profile.name !== 'Mon Restaurant') score += 10;
    if (profile.type) score += 10;
    if (profile.address && profile.city) score += 15;
    if (profile.phone) score += 10;
    if (profile.website) score += 5;
    if (profile.specialties && profile.specialties.length > 0) score += 10;
    if (profile.hasTerrace || profile.hasDelivery) score += 5;
    if (profile.capacityCovers || profile.averageTicket) score += 5;
    if (profile.hasOffPeak && (profile.offPeakSlots || []).length > 0) score += 10;
    return Math.min(100, score);
  }, [profile]);

  // Horaires aujourd'hui
  const todaySchedule = useMemo(() => {
    return profile.openingHours.find((h) => h.day.toLowerCase() === todayDayName.toLowerCase());
  }, [profile.openingHours, todayDayName]);

  // Charger profil depuis l'API et local storage
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('getspecial_theme');
      if (storedTheme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }

      // Synchronisation en direct avec l'API
      const restaurantId = localStorage.getItem('getspecial_restaurant_id') || 'current';

      fetch(`/api/restaurants/${restaurantId}/profile`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            const r = json.data;
            if (r.id) {
              localStorage.setItem('getspecial_restaurant_id', r.id);
            }
            const prof = r.profile || {};
            setProfile((prev) => ({
              ...prev,
              id: r.id,
              name: r.name || prev.name,
              type: r.type || prev.type,
              address: r.address || prev.address,
              city: r.city || '',
              postalCode: r.postalCode || '',
              phone: r.phone || '',
              website: r.website || '',
              specialties: Array.isArray(r.specialties) ? r.specialties : prev.specialties || [],
              tone: prof.tone || prev.tone,
              colors:
                Array.isArray(prof.brandColors) && prof.brandColors.length > 0
                  ? prof.brandColors
                  : prev.colors,
              hasTerrace: prof.hasTerrace !== undefined ? prof.hasTerrace : prev.hasTerrace,
              hasDelivery: prof.hasDelivery !== undefined ? prof.hasDelivery : prev.hasDelivery,
              capacityCovers: prof.capacityCovers ?? null,
              averageTicket: prof.averageTicket ?? null,
              baselineCovers: prof.baselineCovers ?? 15,
              hasOffPeak: prof.customRules?.hasOffPeak ?? prev.hasOffPeak,
              offPeakSlots: prof.customRules?.offPeakSlots ?? prev.offPeakSlots,
              openingHours: normalizeOpeningHours(r.openingHours),
            }));
          }
        })
        .catch((err) => {
          console.warn('Could not fetch restaurant profile from API:', err);
        });
    } catch {
      // Ignorer
    }
  }, []);

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (typeof window !== 'undefined') {
      if (nextMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('getspecial_theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
    setSavedNotice(
      nextMode ? t('restaurant.profile.darkEnabled') : t('restaurant.profile.lightEnabled')
    );
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const saveProfile = async (updated: RestaurantProfileData, notice: string) => {
    setProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_restaurant_full_profile', JSON.stringify(updated));
      const restaurantId =
        updated.id || localStorage.getItem('getspecial_restaurant_id') || 'current';
      try {
        const res = await fetch(`/api/restaurants/${restaurantId}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: updated.name,
            type: updated.type,
            address: updated.address,
            city: updated.city,
            postalCode: updated.postalCode,
            phone: updated.phone,
            website: updated.website,
            openingHours: updated.openingHours,
            specialties: updated.specialties || [],
            tone: updated.tone,
            hasTerrace: updated.hasTerrace,
            hasDelivery: updated.hasDelivery,
            capacityCovers:
              updated.capacityCovers !== null &&
              updated.capacityCovers !== undefined &&
              (updated.capacityCovers as any) !== ''
                ? Number(updated.capacityCovers)
                : null,
            averageTicket:
              updated.averageTicket !== null &&
              updated.averageTicket !== undefined &&
              (updated.averageTicket as any) !== ''
                ? Number(updated.averageTicket)
                : null,
            brandColors: updated.colors,
            customRules: {
              hasOffPeak: updated.hasOffPeak,
              offPeakSlots: updated.offPeakSlots,
            },
          }),
        });
        const json = await res.json();
        if (json.success && json.data?.id) {
          localStorage.setItem('getspecial_restaurant_id', json.data.id);
        }
      } catch (err) {
        console.warn('Could not sync profile update to backend:', err);
      }
    }
    setSavedNotice(notice);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  // Gestion des Spécialités
  const handleAddSpecialty = () => {
    const val = newSpecialtyInput.trim();
    if (!val) return;
    const current = profile.specialties || [];
    if (current.includes(val)) return;
    const updated = { ...profile, specialties: [...current, val] };
    saveProfile(updated, `Spécialité « ${val} » ajoutée.`);
    setNewSpecialtyInput('');
  };

  const handleRemoveSpecialty = (item: string) => {
    const current = profile.specialties || [];
    const updated = { ...profile, specialties: current.filter((s) => s !== item) };
    saveProfile(updated, `Spécialité « ${item} » retirée.`);
  };

  // Toggles rapides
  const handleToggleTerrace = () => {
    const updated = { ...profile, hasTerrace: !profile.hasTerrace };
    saveProfile(
      updated,
      updated.hasTerrace ? t('restaurant.profile.terraceOn') : t('restaurant.profile.terraceOff')
    );
  };

  const handleToggleDelivery = () => {
    const updated = { ...profile, hasDelivery: !profile.hasDelivery };
    saveProfile(
      updated,
      updated.hasDelivery ? t('restaurant.profile.deliveryOn') : t('restaurant.profile.deliveryOff')
    );
  };

  const handleToggleOffPeak = () => {
    const nextState = !profile.hasOffPeak;
    const updated = { ...profile, hasOffPeak: nextState };
    saveProfile(
      updated,
      nextState
        ? 'Heures creuses activées pour vos campagnes IA.'
        : 'Heures creuses désactivées.'
    );
  };

  // Gestion des horaires
  const handleHourChange = (index: number, field: 'lunch' | 'dinner', value: string) => {
    const newHours = [...profile.openingHours];
    newHours[index] = { ...newHours[index], [field]: value };
    setProfile({ ...profile, openingHours: newHours });
  };

  const handleToggleDayOpen = (index: number) => {
    const newHours = [...profile.openingHours];
    const current = newHours[index];
    newHours[index] = {
      ...current,
      isOpen: !current.isOpen,
      lunch: !current.isOpen ? '12:00 - 14:30' : t('restaurant.profile.closed'),
      dinner: !current.isOpen ? '19:00 - 22:30' : t('restaurant.profile.closed'),
    };
    setProfile({ ...profile, openingHours: newHours });
  };

  // Raccourci UX Magique : Appliquer les horaires du Lundi à tous les jours ouverts
  const handleApplyHoursToAllOpenDays = () => {
    const refDay = profile.openingHours.find((h) => h.isOpen) || profile.openingHours[0];
    if (!refDay) return;
    const newHours = profile.openingHours.map((h) => {
      if (h.isOpen) {
        return { ...h, lunch: refDay.lunch, dinner: refDay.dinner };
      }
      return h;
    });
    const updated = { ...profile, openingHours: newHours };
    saveProfile(updated, `Horaires de ${refDay.day} appliqués à tous les jours ouverts.`);
  };

  // Ajout / Suppression d'heures creuses
  const handleAddOffPeakSlot = (preset?: Omit<OffPeakSlot, 'id'>) => {
    const slotToAdd: OffPeakSlot = preset
      ? {
          id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          ...preset,
        }
      : {
          id: `slot_${Date.now()}`,
          name: newSlotName.trim() || 'Période calme',
          timeStart: newSlotStart,
          timeEnd: newSlotEnd,
          days: newSlotDays.trim() || 'Du Lundi au Vendredi',
        };

    const currentSlots = profile.offPeakSlots || [];
    const updated = {
      ...profile,
      hasOffPeak: true,
      offPeakSlots: [...currentSlots, slotToAdd],
    };
    saveProfile(updated, `Créneau « ${slotToAdd.name} » ajouté.`);
    setIsAddingOffPeak(false);
  };

  const handleDeleteOffPeakSlot = (slotId: string) => {
    const currentSlots = profile.offPeakSlots || [];
    const updated = {
      ...profile,
      offPeakSlots: currentSlots.filter((s) => s.id !== slotId),
    };
    saveProfile(updated, 'Créneau supprimé.');
  };

  // Remplacement de couleur de marque principale
  const handleColorChange = (index: number, newColor: string) => {
    const newColors = [...profile.colors];
    newColors[index] = newColor;
    setProfile({ ...profile, colors: newColors });
  };

  // Un mode d'édition est-il actuellement actif ?
  const isAnyEditingActive = isEditingInfo || isEditingServices || isEditingHours;

  const handleSaveAllActiveEdits = () => {
    saveProfile(profile, 'Toutes les modifications ont été enregistrées.');
    setIsEditingInfo(false);
    setIsEditingServices(false);
    setIsEditingHours(false);
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* ========================================================= */}
        {/* EN-TÊTE PRINCIPAL : Mon Resto                             */}
        {/* ========================================================= */}
        <header className={styles.header}>
          <div className={styles.headerTexts}>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.pageMainTitle}>Mon Resto</h1>
              <div className={styles.liveAiStatus}>
                <span className={styles.liveDot} />
                <span>IA Prête & Active</span>
              </div>
            </div>
            <p className={styles.pageMainSubtitle}>
              Identité de marque, services et horaires pris en compte pour la génération marketing.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className={styles.themeToggleBtn}
            title={isDarkMode ? t('restaurant.profile.themeToLight') : t('restaurant.profile.themeToDark')}
            aria-label="Basculer le thème"
          >
            {isDarkMode ? (
              <>
                <SunMedium size={15} className={styles.sunIcon} />
                <span>Clair</span>
              </>
            ) : (
              <>
                <Moon size={15} className={styles.moonIcon} />
                <span>Sombre</span>
              </>
            )}
          </button>
        </header>

        {/* Notice temporaire de confirmation */}
        {savedNotice && (
          <div className={styles.savedNotice}>
            <CheckCircle2 size={16} />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* CARTE HERO ÉTABLISSEMENT : Fiche Pro Haute Fidélité       */}
        {/* ========================================================= */}
        <div className={styles.heroCard}>
          <div className={styles.heroHeaderRow}>
            <div className={styles.heroLeft}>
              <div className={styles.storeAvatar}>
                <Store size={28} className={styles.storeIcon} />
              </div>
              <div className={styles.heroMeta}>
                <div className={styles.heroNameRow}>
                  <h2 className={styles.restaurantNameTitle}>{profile.name}</h2>
                  <span className={styles.restaurantTypeBadge}>{profile.type}</span>
                </div>

                <div className={styles.heroAddressRow}>
                  {(profile.address || profile.city) ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [profile.address, profile.postalCode, profile.city].filter(Boolean).join(' ')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ouvrir dans Google Maps"
                    >
                      <MapPin size={13} color="#FF5A00" />
                      <span>{[profile.address, profile.postalCode, profile.city].filter(Boolean).join(', ')}</span>
                    </a>
                  ) : (
                    <span>
                      <MapPin size={13} color="#94A3B8" />
                      <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Adresse non renseignée</span>
                    </span>
                  )}

                  {todaySchedule && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <Clock size={13} color={todaySchedule.isOpen ? '#10B981' : '#EF4444'} />
                      <span style={{ color: todaySchedule.isOpen ? '#059669' : '#DC2626' }}>
                        {todaySchedule.isOpen ? `Aujourd’hui : ${todaySchedule.lunch}` : 'Fermé aujourd’hui'}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.heroRight}>
              <div className={styles.tonePill}>
                <Sparkles size={12} className={styles.toneIcon} />
                <span>Ton : {profile.tone}</span>
              </div>
            </div>
          </div>

          {/* Jauge de Complétion & Impact IA */}
          <div className={styles.profileCompletionBox}>
            <div className={styles.completionLabelRow}>
              <span className={styles.completionTitle}>
                <Sparkles size={13} color="#FF5A00" />
                <span>Optimisation IA de la fiche</span>
              </span>
              <span className={styles.completionPercent}>{completionScore}%</span>
            </div>
            <div className={styles.completionBarTrack}>
              <div className={styles.completionBarFill} style={{ width: `${completionScore}%` }} />
            </div>
            <p className={styles.completionHint}>
              {completionScore >= 80
                ? '🌟 Fiche très complète : vos visuels et textes générés correspondront exactement à votre restaurant.'
                : '💡 Remplissez votre adresse, vos spécialités et vos horaires pour booster la pertinence de l’IA.'}
            </p>
          </div>

          {/* Boutons d'actions tactiles rapides */}
          <div className={styles.heroQuickActions}>
            {profile.phone ? (
              <a href={`tel:${profile.phone}`} className={styles.quickActionChip} title="Appeler">
                <Phone size={13} color="#FF5A00" />
                <span>{profile.phone}</span>
              </a>
            ) : null}

            {profile.website ? (
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.quickActionChip}
              >
                <Globe size={13} color="#FF5A00" />
                <span>Site web</span>
                <ExternalLink size={11} />
              </a>
            ) : null}

            {(profile.address || profile.city) ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  [profile.address, profile.postalCode, profile.city].filter(Boolean).join(' ')
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.quickActionChip}
              >
                <Navigation size={13} color="#FF5A00" />
                <span>Itinéraire</span>
              </a>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setIsEditingInfo(!isEditingInfo);
                setActiveSectionFilter('identity');
              }}
              className={styles.quickActionChip}
            >
              <Edit2 size={13} color="#FF5A00" />
              <span>Modifier la fiche</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* N1 : NAVIGATION PAR ONGLETS PRINCIPAUX                     */}
        {/* ========================================================= */}
        <nav className={styles.tabsNav} aria-label={t('restaurant.tabs.label')}>
          <Link href="/dashboard/restaurant" className={`${styles.tabBtn} ${styles.tabActive}`}>
            <Store size={15} />
            <span className={styles.tabFullText}>Profil de l’établissement</span>
            <span className={styles.tabShortText}>Profil</span>
          </Link>

          <Link href="/dashboard/restaurant/offers" className={styles.tabBtn}>
            <Tag size={15} />
            <span className={styles.tabFullText}>Offres & Formules</span>
            <span className={styles.tabShortText}>Offres</span>
          </Link>

          <Link href="/dashboard/restaurant/events" className={styles.tabBtn}>
            <Calendar size={15} />
            <span className={styles.tabFullText}>Événements locaux</span>
            <span className={styles.tabShortText}>Événements</span>
          </Link>
        </nav>

        {/* ========================================================= */}
        {/* N2 : SOUS-NAVIGATION TACTILE PAR SEGMENTS (Mobile-First)   */}
        {/* ========================================================= */}
        <div className={styles.sectionPillsNav} role="tablist" aria-label="Sections du profil">
          <button
            type="button"
            className={`${styles.sectionPill} ${activeSectionFilter === 'all' ? styles.sectionPillActive : ''}`}
            onClick={() => setActiveSectionFilter('all')}
          >
            <Layers size={13} />
            <span>Tout voir</span>
          </button>
          <button
            type="button"
            className={`${styles.sectionPill} ${activeSectionFilter === 'identity' ? styles.sectionPillActive : ''}`}
            onClick={() => setActiveSectionFilter('identity')}
          >
            <Store size={13} />
            <span>Identité & Marque</span>
          </button>
          <button
            type="button"
            className={`${styles.sectionPill} ${activeSectionFilter === 'specialties' ? styles.sectionPillActive : ''}`}
            onClick={() => setActiveSectionFilter('specialties')}
          >
            <UtensilsCrossed size={13} />
            <span>Spécialités</span>
          </button>
          <button
            type="button"
            className={`${styles.sectionPill} ${activeSectionFilter === 'services' ? styles.sectionPillActive : ''}`}
            onClick={() => setActiveSectionFilter('services')}
          >
            <SlidersHorizontal size={13} />
            <span>Services & Modèle</span>
          </button>
          <button
            type="button"
            className={`${styles.sectionPill} ${activeSectionFilter === 'hours' ? styles.sectionPillActive : ''}`}
            onClick={() => setActiveSectionFilter('hours')}
          >
            <Clock size={13} />
            <span>Horaires de la semaine</span>
          </button>
          <button
            type="button"
            className={`${styles.sectionPill} ${activeSectionFilter === 'offpeak' ? styles.sectionPillActive : ''}`}
            onClick={() => setActiveSectionFilter('offpeak')}
          >
            <Coffee size={13} />
            <span>Booster Heures creuses</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* GRILLE DES SECTIONS (RESPONSIVE DESKTOP & MOBILE FIRST)    */}
        {/* ========================================================= */}
        <div className={styles.restaurantGrid}>
          {/* ======================================================= */}
          {/* COLONNE GAUCHE                                          */}
          {/* ======================================================= */}
          <div className={styles.columnLeft}>
            {/* ----------------------------------------------------- */}
            {/* SECTION 1 : IDENTITÉ & IMAGE DE MARQUE                */}
            {/* ----------------------------------------------------- */}
            {(activeSectionFilter === 'all' || activeSectionFilter === 'identity') && (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleGroup}>
                    <div className={styles.sectionIconBox}>
                      <Store size={18} />
                    </div>
                    <div>
                      <h2 className={styles.sectionTitle}>Identité & Image de Marque</h2>
                      <p className={styles.sectionDesc}>Style, coordonnées et ligne éditoriale adoptés par l’IA.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingInfo) {
                        saveProfile(profile, 'Identité de l’établissement mise à jour.');
                      }
                      setIsEditingInfo(!isEditingInfo);
                    }}
                    className={`${styles.editToggleBtn} ${isEditingInfo ? styles.editToggleBtnActive : ''}`}
                  >
                    {isEditingInfo ? (
                      <>
                        <Check size={13} strokeWidth={2.4} />
                        <span>Enregistrer</span>
                      </>
                    ) : (
                      <>
                        <Edit2 size={13} />
                        <span>Modifier</span>
                      </>
                    )}
                  </button>
                </div>

                <div className={styles.fieldsGrid}>
                  {/* Nom */}
                  <div className={styles.fieldItem}>
                    <label className={styles.fieldLabel}>Nom de l’établissement</label>
                    {isEditingInfo ? (
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className={styles.textInput}
                        placeholder="Ex: L'Atelier Culinaire"
                      />
                    ) : (
                      <span className={styles.fieldValue}>{profile.name}</span>
                    )}
                  </div>

                  {/* Type d'établissement */}
                  <div className={styles.fieldItem}>
                    <label className={styles.fieldLabel}>Type d’établissement</label>
                    {isEditingInfo ? (
                      <input
                        type="text"
                        value={profile.type}
                        onChange={(e) => setProfile({ ...profile, type: e.target.value })}
                        className={styles.textInput}
                        placeholder="Ex: Restaurant traditionnel, Pizzeria, Bistrot..."
                      />
                    ) : (
                      <span className={styles.fieldValue}>{profile.type}</span>
                    )}
                  </div>

                  {/* Adresse */}
                  <div className={styles.fieldItem}>
                    <label className={styles.fieldLabel}>Adresse postale</label>
                    {isEditingInfo ? (
                      <input
                        type="text"
                        value={profile.address || ''}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        className={styles.textInput}
                        placeholder="Ex: 14 Rue de la Gastronomie"
                      />
                    ) : (
                      <span className={profile.address ? styles.fieldValue : styles.fieldValueEmpty}>
                        {profile.address || 'Non renseignée'}
                      </span>
                    )}
                  </div>

                  {/* Code Postal & Ville */}
                  <div className={styles.fieldItem}>
                    <label className={styles.fieldLabel}>Ville & Code Postal</label>
                    {isEditingInfo ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={profile.postalCode || ''}
                          onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                          className={styles.textInput}
                          placeholder="75001"
                          style={{ width: '35%' }}
                        />
                        <input
                          type="text"
                          value={profile.city || ''}
                          onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                          className={styles.textInput}
                          placeholder="Paris"
                          style={{ width: '65%' }}
                        />
                      </div>
                    ) : (
                      <span className={(profile.postalCode || profile.city) ? styles.fieldValue : styles.fieldValueEmpty}>
                        {[profile.postalCode, profile.city].filter(Boolean).join(' ') || 'Non renseigné'}
                      </span>
                    )}
                  </div>

                  {/* Téléphone */}
                  <div className={styles.fieldItem}>
                    <label className={styles.fieldLabel}>Numéro de contact</label>
                    {isEditingInfo ? (
                      <input
                        type="tel"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className={styles.textInput}
                        placeholder="Ex: 01 42 68 00 00"
                      />
                    ) : (
                      <span className={profile.phone ? styles.fieldValue : styles.fieldValueEmpty}>
                        {profile.phone || 'Non renseigné'}
                      </span>
                    )}
                  </div>

                  {/* Site web */}
                  <div className={styles.fieldItem}>
                    <label className={styles.fieldLabel}>Site web officiel</label>
                    {isEditingInfo ? (
                      <input
                        type="url"
                        value={profile.website || ''}
                        onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                        className={styles.textInput}
                        placeholder="Ex: https://latelierculinaire.fr"
                      />
                    ) : (
                      <span className={profile.website ? styles.fieldValue : styles.fieldValueEmpty}>
                        {profile.website || 'Non renseigné'}
                      </span>
                    )}
                  </div>

                  {/* Ton de communication */}
                  <div className={styles.fieldItem} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.fieldLabel}>Ton de communication de l’IA</label>
                    {isEditingInfo ? (
                      <div>
                        <input
                          type="text"
                          value={profile.tone}
                          onChange={(e) => setProfile({ ...profile, tone: e.target.value })}
                          className={styles.textInput}
                          placeholder="Ex: Chaleureux & Convivial"
                        />
                        <div className={styles.toneSuggestionsRow}>
                          {TONE_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              className={`${styles.toneChip} ${profile.tone === preset ? styles.toneChipSelected : ''}`}
                              onClick={() => setProfile({ ...profile, tone: preset })}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.tonePill}>
                        <Sparkles size={12} className={styles.toneIcon} />
                        <span>{profile.tone}</span>
                      </div>
                    )}
                  </div>

                  {/* Couleurs de marque */}
                  <div className={styles.fieldItem} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.fieldLabel}>Couleurs de marque (utilisées pour les visuels IA)</label>
                    <div className={styles.colorPalette}>
                      {profile.colors.map((c, i) => (
                        <div key={i} className={styles.colorSwatchWrapper}>
                          <label
                            className={styles.colorSwatch}
                            style={{ backgroundColor: c, cursor: isEditingInfo ? 'pointer' : 'default' }}
                            title={`Couleur ${i + 1} : ${c}`}
                          >
                            {isEditingInfo && (
                              <input
                                type="color"
                                value={c.startsWith('#') && c.length === 7 ? c : '#FF5A00'}
                                onChange={(e) => handleColorChange(i, e.target.value)}
                                className={styles.colorPickerInput}
                              />
                            )}
                          </label>
                          <span className={styles.colorHexLabel}>{c}</span>
                        </div>
                      ))}
                      {isEditingInfo && (
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          (Cliquez sur une pastille pour changer la couleur)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ----------------------------------------------------- */}
            {/* SECTION 2 : SPÉCIALITÉS & PLATS PHARES (Impact IA)    */}
            {/* ----------------------------------------------------- */}
            {(activeSectionFilter === 'all' || activeSectionFilter === 'specialties') && (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleGroup}>
                    <div className={styles.sectionIconBox}>
                      <UtensilsCrossed size={18} />
                    </div>
                    <div>
                      <h2 className={styles.sectionTitle}>Spécialités & Plats Phares</h2>
                      <p className={styles.sectionDesc}>Mises en avant automatiquement par l’IA dans vos visuels et promotions.</p>
                    </div>
                  </div>
                </div>

                <div className={styles.specialtiesContainer}>
                  <div className={styles.specialtiesTagsRow}>
                    {(profile.specialties || []).length === 0 ? (
                      <p className={styles.specialtiesEmpty}>
                        Aucune spécialité renseignée. Ajoutez vos plats phares ci-dessous pour que l’IA les valorise !
                      </p>
                    ) : (
                      (profile.specialties || []).map((spec) => (
                        <span key={spec} className={styles.specialtyTag}>
                          <span>{spec}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecialty(spec)}
                            className={styles.removeSpecialtyBtn}
                            title="Supprimer cette spécialité"
                            aria-label={`Supprimer ${spec}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Formulaire d'ajout rapide */}
                  <div className={styles.addSpecialtyBox}>
                    <input
                      type="text"
                      value={newSpecialtyInput}
                      onChange={(e) => setNewSpecialtyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSpecialty();
                        }
                      }}
                      className={styles.textInput}
                      placeholder="Ex: Burger Gourmet Truffe, Pizza Napolitaine, Tarte Tatin..."
                    />
                    <button
                      type="button"
                      onClick={handleAddSpecialty}
                      className={styles.addSpecialtyBtn}
                    >
                      <Plus size={14} />
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ----------------------------------------------------- */}
            {/* SECTION 3 : SERVICES, AMÉNAGEMENTS & CHIFFRES CLÉS    */}
            {/* ----------------------------------------------------- */}
            {(activeSectionFilter === 'all' || activeSectionFilter === 'services') && (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleGroup}>
                    <div className={styles.sectionIconBox}>
                      <Sun size={18} />
                    </div>
                    <div>
                      <h2 className={styles.sectionTitle}>Services & Modèle d’Activité</h2>
                      <p className={styles.sectionDesc}>Données d’ambiance et de capacité prises en compte par le ciblage IA.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingServices) {
                        saveProfile(profile, 'Services et données d’activité enregistrés.');
                      }
                      setIsEditingServices(!isEditingServices);
                    }}
                    className={`${styles.editToggleBtn} ${isEditingServices ? styles.editToggleBtnActive : ''}`}
                  >
                    {isEditingServices ? (
                      <>
                        <Check size={13} strokeWidth={2.4} />
                        <span>Enregistrer</span>
                      </>
                    ) : (
                      <>
                        <Edit2 size={13} />
                        <span>Modifier</span>
                      </>
                    )}
                  </button>
                </div>

                <div className={styles.servicesList}>
                  {/* Terrasse */}
                  <div className={`${styles.toggleRow} ${profile.hasTerrace ? styles.toggleRowActive : ''}`}>
                    <div className={styles.toggleInfo}>
                      <div className={styles.toggleIconCircle}>
                        <Sun size={18} />
                      </div>
                      <div>
                        <span className={styles.toggleTitle}>Terrasse extérieure</span>
                        <p className={styles.toggleSubtitle}>
                          L’IA déclenchera des suggestions de posts ensoleillés et apéritifs quand la météo est clémente.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleTerrace}
                      className={`${styles.switchBtn} ${profile.hasTerrace ? styles.switchOn : styles.switchOff}`}
                      aria-pressed={profile.hasTerrace}
                      aria-label="Activer ou désactiver la terrasse"
                    >
                      <span className={styles.switchHandle} />
                    </button>
                  </div>

                  {/* Livraison */}
                  <div className={`${styles.toggleRow} ${profile.hasDelivery ? styles.toggleRowActive : ''}`}>
                    <div className={styles.toggleInfo}>
                      <div className={styles.toggleIconCircle}>
                        <Truck size={18} />
                      </div>
                      <div>
                        <span className={styles.toggleTitle}>Livraison & Vente à emporter</span>
                        <p className={styles.toggleSubtitle}>
                          Active des alertes et visuels de commande à distance les jours de pluie, froid ou grands matchs.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleDelivery}
                      className={`${styles.switchBtn} ${profile.hasDelivery ? styles.switchOn : styles.switchOff}`}
                      aria-pressed={profile.hasDelivery}
                      aria-label="Activer ou désactiver la livraison"
                    >
                      <span className={styles.switchHandle} />
                    </button>
                  </div>

                  {/* Données économiques clés */}
                  <div className={styles.economicsCardsGrid}>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>
                        <Users size={12} color="#FF5A00" />
                        <span>Capacité assise</span>
                      </span>
                      {isEditingServices ? (
                        <input
                          type="number"
                          min="0"
                          value={profile.capacityCovers ?? ''}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              capacityCovers: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className={styles.textInput}
                          placeholder="Ex: 50 couverts"
                        />
                      ) : (
                        <span className={styles.metricValueBig}>
                          {profile.capacityCovers ? `${profile.capacityCovers} cvts` : '—'}
                        </span>
                      )}
                    </div>

                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>
                        <Euro size={12} color="#10B981" />
                        <span>Ticket moyen</span>
                      </span>
                      {isEditingServices ? (
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={profile.averageTicket ?? ''}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              averageTicket: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className={styles.textInput}
                          placeholder="Ex: 28 €"
                        />
                      ) : (
                        <span className={styles.metricValueBig}>
                          {profile.averageTicket ? `${profile.averageTicket} €` : '—'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* ======================================================= */}
          {/* COLONNE DROITE                                          */}
          {/* ======================================================= */}
          <div className={styles.columnRight}>
            {/* ----------------------------------------------------- */}
            {/* SECTION 4 : HORAIRES D'OUVERTURE DE LA SEMAINE        */}
            {/* ----------------------------------------------------- */}
            {(activeSectionFilter === 'all' || activeSectionFilter === 'hours') && (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleGroup}>
                    <div className={styles.sectionIconBox}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <h2 className={styles.sectionTitle}>Horaires d’Ouverture</h2>
                      <p className={styles.sectionDesc}>Affichage et paramétrage détaillé par jour de la semaine.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingHours) {
                        saveProfile(profile, 'Horaires d’ouverture mis à jour.');
                      }
                      setIsEditingHours(!isEditingHours);
                    }}
                    className={`${styles.editToggleBtn} ${isEditingHours ? styles.editToggleBtnActive : ''}`}
                  >
                    {isEditingHours ? (
                      <>
                        <Check size={13} strokeWidth={2.4} />
                        <span>Enregistrer</span>
                      </>
                    ) : (
                      <>
                        <Edit2 size={13} />
                        <span>Modifier</span>
                      </>
                    )}
                  </button>
                </div>

                {isEditingHours && (
                  <div className={styles.hoursSectionHeaderRow}>
                    <button
                      type="button"
                      onClick={handleApplyHoursToAllOpenDays}
                      className={styles.applyAllBtn}
                      title="Copier les horaires du premier jour ouvert à tous les autres"
                    >
                      <Copy size={12} />
                      <span>Appliquer ces créneaux à toute la semaine</span>
                    </button>
                  </div>
                )}

                <div className={styles.hoursList}>
                  {profile.openingHours.map((item, index) => {
                    const isToday = item.day.toLowerCase() === todayDayName.toLowerCase();
                    return (
                      <div
                        key={item.day}
                        className={`${styles.hourRow} ${isToday ? styles.hourRowToday : ''} ${
                          !item.isOpen ? styles.hourRowClosed : ''
                        }`}
                      >
                        <div className={styles.dayCol}>
                          <span className={styles.dayName}>{item.day}</span>
                          {isToday && <span className={styles.todayBadge}>Aujourd’hui</span>}
                          {!item.isOpen && <span className={styles.closedPill}>Fermé</span>}
                        </div>

                        {isEditingHours ? (
                          <div className={styles.editHoursGroup}>
                            <button
                              type="button"
                              onClick={() => handleToggleDayOpen(index)}
                              className={styles.openCloseToggle}
                            >
                              {item.isOpen ? 'Marquer Fermé' : 'Marquer Ouvert'}
                            </button>

                            {item.isOpen && (
                              <div className={styles.inputsPair}>
                                <input
                                  type="text"
                                  value={item.lunch}
                                  onChange={(e) => handleHourChange(index, 'lunch', e.target.value)}
                                  className={styles.timeSlotInput}
                                  placeholder="Midi (12:00 - 14:30)"
                                />
                                <input
                                  type="text"
                                  value={item.dinner}
                                  onChange={(e) => handleHourChange(index, 'dinner', e.target.value)}
                                  className={styles.timeSlotInput}
                                  placeholder="Soir (19:00 - 22:30)"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={styles.slotsCol}>
                            {item.isOpen ? (
                              <>
                                <span className={styles.slotBadge}>{item.lunch}</span>
                                <span className={styles.slotDivider}>/</span>
                                <span className={styles.slotBadge}>{item.dinner}</span>
                              </>
                            ) : (
                              <span className={styles.closedText}>Fermé toute la journée</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ----------------------------------------------------- */}
            {/* SECTION 5 : BOOSTER HEURES CREUSES & PÉRIODES CALMES  */}
            {/* ----------------------------------------------------- */}
            {(activeSectionFilter === 'all' || activeSectionFilter === 'offpeak') && (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleGroup}>
                    <div className={styles.sectionIconBox}>
                      <Coffee size={18} />
                    </div>
                    <div>
                      <h2 className={styles.sectionTitle}>Booster Heures Creuses</h2>
                      <p className={styles.sectionDesc}>Remplissez vos tables lors des creux d’affluence grâce aux offres IA.</p>
                    </div>
                  </div>
                </div>

                <div className={styles.offPeakContainer}>
                  {/* Switch Principal */}
                  <div className={`${styles.toggleRow} ${profile.hasOffPeak ? styles.toggleRowActive : ''}`}>
                    <div className={styles.toggleInfo}>
                      <div className={styles.toggleIconCircle}>
                        <Coffee size={18} />
                      </div>
                      <div>
                        <span className={styles.toggleTitle}>
                          {profile.hasOffPeak ? 'Heures creuses actives' : 'Heures creuses désactivées'}
                        </span>
                        <p className={styles.toggleSubtitle}>
                          Permet à l’IA de vous proposer des offres flash (ex: -20% de 15h à 18h) pour dynamiser vos services calmes.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleOffPeak}
                      className={`${styles.switchBtn} ${profile.hasOffPeak ? styles.switchOn : styles.switchOff}`}
                      aria-pressed={profile.hasOffPeak}
                      aria-label="Basculer heures creuses"
                    >
                      <span className={styles.switchHandle} />
                    </button>
                  </div>

                  {profile.hasOffPeak && (
                    <>
                      {/* Suggestions intelligentes 1-Click */}
                      <div className={styles.offPeakPresetsBox}>
                        <span className={styles.offPeakPresetsTitle}>⚡ Suggestions rapides en 1 clic :</span>
                        <div className={styles.offPeakPresetsRow}>
                          {PRESET_OFFPEAK_SLOTS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => handleAddOffPeakSlot(preset)}
                              className={styles.presetSlotChip}
                              title={`Ajouter : ${preset.name} (${preset.timeStart}-${preset.timeEnd})`}
                            >
                              <Plus size={11} />
                              <span>{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Liste des créneaux configurés */}
                      <div className={styles.offPeakSlotsList}>
                        {(profile.offPeakSlots || []).length === 0 ? (
                          <p className={styles.offPeakEmptyText}>
                            Aucun créneau configuré. Choisissez une suggestion rapide ci-dessus ou ajoutez-en un personnalisé.
                          </p>
                        ) : (
                          (profile.offPeakSlots || []).map((slot) => (
                            <div key={slot.id} className={styles.offPeakSlotItem}>
                              <div className={styles.offPeakSlotLeft}>
                                <span className={styles.offPeakSlotName}>{slot.name}</span>
                                <span className={styles.offPeakSlotDays}>{slot.days}</span>
                              </div>

                              <div className={styles.offPeakSlotRight}>
                                <span className={styles.offPeakTimeBadge}>
                                  {slot.timeStart} - {slot.timeEnd}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOffPeakSlot(slot.id)}
                                  className={styles.offPeakDeleteBtn}
                                  title="Supprimer ce créneau"
                                  aria-label="Supprimer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Formulaire d'ajout personnalisé */}
                      {isAddingOffPeak ? (
                        <div className={styles.offPeakFormBox}>
                          <div className={styles.fieldItem}>
                            <label className={styles.fieldLabel}>Nom du créneau</label>
                            <input
                              type="text"
                              value={newSlotName}
                              onChange={(e) => setNewSlotName(e.target.value)}
                              className={styles.textInput}
                              placeholder="Ex: Après-midi calme, Happy Hour..."
                            />
                          </div>

                          <div className={styles.offPeakFormRow}>
                            <div className={styles.fieldItem}>
                              <label className={styles.fieldLabel}>Heure de début</label>
                              <input
                                type="time"
                                value={newSlotStart}
                                onChange={(e) => setNewSlotStart(e.target.value)}
                                className={styles.textInput}
                              />
                            </div>
                            <div className={styles.fieldItem}>
                              <label className={styles.fieldLabel}>Heure de fin</label>
                              <input
                                type="time"
                                value={newSlotEnd}
                                onChange={(e) => setNewSlotEnd(e.target.value)}
                                className={styles.textInput}
                              />
                            </div>
                          </div>

                          <div className={styles.fieldItem}>
                            <label className={styles.fieldLabel}>Jours concernés</label>
                            <input
                              type="text"
                              value={newSlotDays}
                              onChange={(e) => setNewSlotDays(e.target.value)}
                              className={styles.textInput}
                              placeholder="Ex: Du Lundi au Vendredi, Mercredi après-midi..."
                            />
                          </div>

                          <div className={styles.offPeakFormActions}>
                            <button
                              type="button"
                              onClick={() => setIsAddingOffPeak(false)}
                              className={styles.offPeakCancelBtn}
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddOffPeakSlot()}
                              className={styles.offPeakSaveBtn}
                            >
                              Ajouter ce créneau
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingOffPeak(true)}
                          className={styles.addSlotBtn}
                        >
                          <Plus size={14} strokeWidth={2.4} />
                          <span>Créer un créneau sur mesure</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* BARRE STICKY MOBILE D'ENREGISTREMENT                      */}
        {/* ========================================================= */}
        {isAnyEditingActive && (
          <div className={styles.stickyBottomBar}>
            <span className={styles.stickyStatusText}>
              <Sparkles size={14} color="#FF5A00" />
              <span>Modifications en cours...</span>
            </span>
            <button
              type="button"
              onClick={handleSaveAllActiveEdits}
              className={styles.stickySaveBtn}
            >
              Enregistrer tout
            </button>
          </div>
        )}

        {/* Espace de sécurité pour la barre de navigation basse */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
