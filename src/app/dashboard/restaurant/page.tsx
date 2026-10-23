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
  AlertCircle,
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
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import {
  RestaurantProfileData,
  INITIAL_RESTAURANT_PROFILE,
  OffPeakSlot,
} from '@/services/restaurant/restaurant-profile.data';
import styles from './restaurant.module.css';

/**
 * Normalise les horaires d'ouverture pour l'interface (tableau ou dictionnaire historique).
 */
function normalizeOpeningHours(raw: any) {
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object' && 'day' in raw[0]) {
    return raw;
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const dayLookup: Record<string, string[]> = {
      Lundi: ['mon', 'lundi', 'monday'],
      Mardi: ['tue', 'mardi', 'tuesday'],
      Mercredi: ['wed', 'mercredi', 'wednesday'],
      Jeudi: ['thu', 'jeudi', 'thursday'],
      Vendredi: ['fri', 'vendredi', 'friday'],
      Samedi: ['sat', 'samedi', 'saturday'],
      Dimanche: ['sun', 'dimanche', 'sunday'],
    };
    return INITIAL_RESTAURANT_PROFILE.openingHours.map((defaultDay) => {
      const keys = dayLookup[defaultDay.day] || [];
      const foundKey = Object.keys(raw).find((k) => keys.includes(k.toLowerCase()));
      if (!foundKey) return defaultDay;
      const val = String(raw[foundKey] || '').trim();
      const closed = !val || val.toLowerCase().includes('ferm') || val.toLowerCase().includes('close');
      if (closed) {
        return { day: defaultDay.day, isOpen: false, lunch: 'Fermé', dinner: 'Fermé' };
      }
      const parts = val.split('/').map((s) => s.trim());
      return {
        day: defaultDay.day,
        isOpen: true,
        lunch: parts[0] || defaultDay.lunch,
        dinner: parts[1] || defaultDay.dinner,
      };
    });
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

interface NoticeState {
  text: string;
  type: 'success' | 'error';
}

/**
 * Mon Resto — Profil de l'établissement, Horaires d'ouverture & Heures creuses
 */
export default function MyRestaurantPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<RestaurantProfileData>(INITIAL_RESTAURANT_PROFILE);
  const [lastPersistedProfile, setLastPersistedProfile] =
    useState<RestaurantProfileData>(INITIAL_RESTAURANT_PROFILE);

  // Modes d'édition par section
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingServices, setIsEditingServices] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4000);
  };

  // Détection du jour courant
  const todayDayName = useMemo(() => {
    const dayIdx = new Date().getDay();
    return DAYS_NAMES[dayIdx] || 'Lundi';
  }, []);

  // Calcul du score d'optimisation IA de la fiche (0 à 100%)
  const completionScore = useMemo(() => {
    let score = 15;
    if (profile.name && profile.name !== 'Mon Restaurant') score += 10;
    if (profile.type) score += 10;
    if (profile.address && profile.city) score += 15;
    if (profile.phone) score += 10;
    if (profile.website) score += 5;
    if (profile.specialties && profile.specialties.length > 0) score += 10;
    if (profile.hasTerrace || profile.hasDelivery) score += 5;
    if (profile.capacityCovers || profile.averageTicket) score += 5;
    if (profile.baselineCovers && profile.baselineCovers > 0) score += 5;
    if (profile.hasOffPeak && (profile.offPeakSlots || []).length > 0) score += 10;
    return Math.min(100, score);
  }, [profile]);

  // Horaires aujourd'hui
  const todaySchedule = useMemo(() => {
    return profile.openingHours.find((h) => h.day.toLowerCase() === todayDayName.toLowerCase());
  }, [profile.openingHours, todayDayName]);

  // Chargement réel du profil depuis l'API
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('getspecial_theme');
      if (storedTheme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }

      const restaurantId = localStorage.getItem('getspecial_restaurant_id') || 'current';

      fetch(`/api/restaurants/${restaurantId}/profile`)
        .then(async (res) => {
          const json = await res.json().catch(() => null);
          if (!res.ok || !json?.success || !json?.data) {
            if (res.status !== 404) {
              console.error('[RESTAURANT_PROFILE_LOAD_ERROR]', res.status, json);
              showNotice('Impossible de synchroniser les données de votre restaurant.', 'error');
            }
            return;
          }

          const r = json.data;
          if (r.id) {
            localStorage.setItem('getspecial_restaurant_id', r.id);
          }
          const prof = r.profile || {};
          const hydrated: RestaurantProfileData = {
            ...INITIAL_RESTAURANT_PROFILE,
            id: r.id,
            name: r.name || INITIAL_RESTAURANT_PROFILE.name,
            type: r.type || INITIAL_RESTAURANT_PROFILE.type,
            address: r.address || '',
            city: r.city || '',
            postalCode: r.postalCode || '',
            phone: r.phone || '',
            website: r.website || '',
            specialties: Array.isArray(r.specialties) ? r.specialties : [],
            tone: prof.tone || INITIAL_RESTAURANT_PROFILE.tone,
            colors:
              Array.isArray(prof.brandColors) && prof.brandColors.length > 0
                ? prof.brandColors
                : INITIAL_RESTAURANT_PROFILE.colors,
            hasTerrace: Boolean(prof.hasTerrace),
            hasDelivery: Boolean(prof.hasDelivery),
            capacityCovers: prof.capacityCovers ?? null,
            averageTicket: prof.averageTicket ?? null,
            baselineCovers: prof.baselineCovers ?? 15,
            hasOffPeak: Boolean(prof.customRules?.hasOffPeak),
            offPeakSlots: Array.isArray(prof.customRules?.offPeakSlots)
              ? prof.customRules.offPeakSlots
              : [],
            openingHours: normalizeOpeningHours(r.openingHours),
          };
          setProfile(hydrated);
          setLastPersistedProfile(hydrated);
        })
        .catch((err) => {
          console.error('[RESTAURANT_PROFILE_NETWORK_ERROR]', err);
          showNotice('Connexion au serveur indisponible.', 'error');
        });
    } catch (err) {
      console.error('[RESTAURANT_PROFILE_INIT_ERROR]', err);
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
        localStorage.setItem('getspecial_theme', 'light');
      }
    }
    showNotice(
      nextMode ? t('restaurant.profile.darkEnabled') : t('restaurant.profile.lightEnabled'),
      'success'
    );
  };

  /**
   * Sauvegarde réelle côté serveur avec rollback et notification honnête en cas d'échec.
   */
  const saveProfile = async (
    updated: RestaurantProfileData,
    successMessage: string
  ): Promise<boolean> => {
    if (!updated.name || !updated.name.trim()) {
      showNotice('Le nom de l’établissement ne peut pas être vide.', 'error');
      return false;
    }

    const previousSnapshot = lastPersistedProfile;
    setProfile(updated);
    setIsSaving(true);

    try {
      const restaurantId =
        updated.id ||
        (typeof window !== 'undefined' ? localStorage.getItem('getspecial_restaurant_id') : null) ||
        'current';

      const res = await fetch(`/api/restaurants/${restaurantId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updated.name.trim(),
          type: updated.type.trim(),
          address: updated.address || '',
          city: updated.city || '',
          postalCode: updated.postalCode || '',
          phone: updated.phone || '',
          website: updated.website || '',
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
          baselineCovers:
            updated.baselineCovers !== null &&
            updated.baselineCovers !== undefined &&
            (updated.baselineCovers as any) !== ''
              ? Number(updated.baselineCovers)
              : 15,
          brandColors: updated.colors,
          customRules: {
            hasOffPeak: Boolean(updated.hasOffPeak),
            offPeakSlots: updated.offPeakSlots || [],
          },
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setProfile(previousSnapshot);
        if (res.status >= 400 && res.status < 500 && json?.error) {
          showNotice(json.error, 'error');
        } else {
          console.error('[SAVE_PROFILE_API_ERROR]', res.status, json);
          showNotice('Vos modifications n’ont pas pu être enregistrées. Veuillez réessayer.', 'error');
        }
        return false;
      }

      const finalProfile: RestaurantProfileData = {
        ...updated,
        id: json.data?.id || updated.id,
      };
      setProfile(finalProfile);
      setLastPersistedProfile(finalProfile);

      if (typeof window !== 'undefined') {
        if (finalProfile.id) {
          localStorage.setItem('getspecial_restaurant_id', finalProfile.id);
        }
        localStorage.setItem('getspecial_restaurant_full_profile', JSON.stringify(finalProfile));
        localStorage.setItem(
          'getspecial_selected_restaurant',
          JSON.stringify({ id: finalProfile.id, name: finalProfile.name, address: finalProfile.address })
        );
      }

      showNotice(successMessage, 'success');
      return true;
    } catch (err) {
      console.error('[SAVE_PROFILE_NETWORK_ERROR]', err);
      setProfile(previousSnapshot);
      showNotice('Impossible de joindre le serveur. Vérifiez votre connexion.', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Gestion des Spécialités
  const handleAddSpecialty = async () => {
    const val = newSpecialtyInput.trim();
    if (!val) return;
    const current = profile.specialties || [];
    if (current.includes(val)) {
      showNotice(`La spécialité « ${val} » figure déjà dans votre liste.`, 'error');
      return;
    }
    const updated = { ...profile, specialties: [...current, val] };
    const ok = await saveProfile(updated, `Spécialité « ${val} » ajoutée.`);
    if (ok) setNewSpecialtyInput('');
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

  const handleApplyHoursToAllOpenDays = () => {
    const refDay = profile.openingHours.find((h) => h.isOpen) || profile.openingHours[0];
    if (!refDay) return;
    const newHours = profile.openingHours.map((h) =>
      h.isOpen ? { ...h, lunch: refDay.lunch, dinner: refDay.dinner } : h
    );
    const updated = { ...profile, openingHours: newHours };
    saveProfile(updated, `Horaires de ${refDay.day} appliqués à tous les jours ouverts.`);
  };

  // Ajout / Suppression d'heures creuses
  const handleAddOffPeakSlot = async (preset?: Omit<OffPeakSlot, 'id'>) => {
    const slotToAdd: OffPeakSlot = preset
      ? {
          id: `slot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
    const ok = await saveProfile(updated, `Créneau « ${slotToAdd.name} » ajouté.`);
    if (ok) setIsAddingOffPeak(false);
  };

  const handleDeleteOffPeakSlot = (slotId: string) => {
    const currentSlots = profile.offPeakSlots || [];
    const updated = {
      ...profile,
      offPeakSlots: currentSlots.filter((s) => s.id !== slotId),
    };
    saveProfile(updated, 'Créneau supprimé.');
  };

  const handleColorChange = (index: number, newColor: string) => {
    const newColors = [...profile.colors];
    newColors[index] = newColor;
    setProfile({ ...profile, colors: newColors });
  };

  const isAnyEditingActive = isEditingInfo || isEditingServices || isEditingHours;

  const handleSaveAllActiveEdits = async () => {
    const ok = await saveProfile(profile, 'Toutes les modifications ont été enregistrées.');
    if (ok) {
      setIsEditingInfo(false);
      setIsEditingServices(false);
      setIsEditingHours(false);
    }
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* EN-TÊTE PRINCIPAL */}
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

        {/* Bannière de retour honnête (Succès vert ou Erreur rouge) */}
        {notice && (
          <div
            className={`${styles.savedNotice} ${
              notice.type === 'error' ? styles.errorNotice : ''
            }`}
            role="status"
          >
            {notice.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* CARTE HERO ÉTABLISSEMENT */}
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
                  {profile.address || profile.city ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [profile.address, profile.postalCode, profile.city].filter(Boolean).join(' ')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ouvrir dans Google Maps"
                    >
                      <MapPin size={13} color="#FF5A00" />
                      <span>
                        {[profile.address, profile.postalCode, profile.city]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </a>
                  ) : (
                    <span>
                      <MapPin size={13} color="#94A3B8" />
                      <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                        Adresse non renseignée
                      </span>
                    </span>
                  )}

                  {todaySchedule && (
                    <span
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                    >
                      <Clock size={13} color={todaySchedule.isOpen ? '#10B981' : '#EF4444'} />
                      <span style={{ color: todaySchedule.isOpen ? '#059669' : '#DC2626' }}>
                        {todaySchedule.isOpen
                          ? `Aujourd’hui : ${todaySchedule.lunch} / ${todaySchedule.dinner}`
                          : 'Fermé aujourd’hui'}
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

          {/* Jauge de Complétion */}
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
                ? 'Fiche complète : vos visuels, offres et verdicts s’appuient sur vos vraies données.'
                : 'Renseignez votre adresse, vos spécialités, votre fréquentation témoin et vos heures creuses.'}
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
                href={
                  profile.website.startsWith('http')
                    ? profile.website
                    : `https://${profile.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className={styles.quickActionChip}
              >
                <Globe size={13} color="#FF5A00" />
                <span>Site web</span>
                <ExternalLink size={11} />
              </a>
            ) : null}

            {profile.address || profile.city ? (
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

        {/* N1 : NAVIGATION PAR ONGLETS PRINCIPAUX */}
        <nav className={styles.tabsNav} aria-label={t('restaurant.tabs.label')}>
          <Link href="/dashboard/restaurant" className={`${styles.tabBtn} ${styles.tabActive}`}>
            <Store size={15} />
            <span className={styles.tabFullText}>Profil de l’établissement</span>
            <span className={styles.tabShortText}>Profil</span>
          </Link>

          <Link href="/dashboard/restaurant/offers" className={styles.tabBtn}>
            <Tag size={15} />
            <span className={styles.tabFullText}>Plats ou Offres</span>
            <span className={styles.tabShortText}>Offres</span>
          </Link>

          <Link href="/dashboard/restaurant/events" className={styles.tabBtn}>
            <Calendar size={15} />
            <span className={styles.tabFullText}>Événements locaux</span>
            <span className={styles.tabShortText}>Événements</span>
          </Link>
        </nav>

        {/* N2 : SOUS-NAVIGATION PAR SEGMENTS */}
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

        {/* GRILLE DES SECTIONS */}
        <div className={styles.restaurantGrid}>
          {/* COLONNE GAUCHE */}
          <div className={styles.columnLeft}>
            {/* SECTION 1 : IDENTITÉ & IMAGE DE MARQUE */}
            {(activeSectionFilter === 'all' || activeSectionFilter === 'identity') && (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleGroup}>
                    <div className={styles.sectionIconBox}>
                      <Store size={18} />
                    </div>
                    <div>
                      <h2 className={styles.sectionTitle}>Identité & Image de Marque</h2>
                      <p className={styles.sectionDesc}>
                        Style, coordonnées et ligne éditoriale adoptés par l’IA.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={async () => {
                      if (isEditingInfo) {
                        const ok = await saveProfile(
                          profile,
                          'Identité de l’établissement mise à jour.'
                        );
                        if (ok) setIsEditingInfo(false);
                      } else {
                        setIsEditingInfo(true);
                      }
                    }}
                    className={`${styles.editToggleBtn} ${
                      isEditingInfo ? styles.editToggleBtnActive : ''
                    }`}
                  >
                    {isEditingInfo ? (
                      <>
                        <Check size={13} strokeWidth={2.4} />
                        <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
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
                      <span
                        className={profile.address ? styles.fieldValue : styles.fieldValueEmpty}
                      >
                        {profile.address || 'Non renseignée'}
                      </span>
                    )}
                  </div>

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
                      <span
                        className={
                          profile.postalCode || profile.city
                            ? styles.fieldValue
                            : styles.fieldValueEmpty
                        }
                      >
                        {[profile.postalCode, profile.city].filter(Boolean).join(' ') ||
                          'Non renseigné'}
                      </span>
                    )}
                  </div>

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
                      <span
                        className={profile.website ? styles.fieldValue : styles.fieldValueEmpty}
                      >
                        {profile.website || 'Non renseigné'}
                      </span>
                    )}
                  </div>

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
                              className={`${styles.toneChip} ${
                                profile.tone === preset ? styles.toneChipSelected : ''
                              }`}
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

                  <div className={styles.fieldItem} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.fieldLabel}>
                      Couleurs de marque (utilisées pour les visuels IA)
                    </label>
                    <div className={styles.colorPalette}>
                      {profile.colors.map((c, i) => (
                        <div key={i} className={styles.colorSwatchWrapper}>
                          <label
                            className={styles.colorSwatch}
                            style={{
                              backgroundColor: c,
                              cursor: isEditingInfo ? 'pointer' : 'default',
                            }}
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

            {/* SECTION 2 : SPÉCIALITÉS & PLATS PHARES */}
            {(activeSectionFilter === 'all' || activeSectionFilter === 'specialties') && (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleGroup}>
                    <div className={styles.sectionIconBox}>
                      <UtensilsCrossed size={18} />
                    </div>
                    <div>
                      <h2 className={styles.sectionTitle}>Spécialités & Plats Phares</h2>
                      <p className={styles.sectionDesc}>
                        Mises en avant automatiquement par l’IA dans vos visuels et promotions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.specialtiesContainer}>
                  <div className={styles.specialtiesTagsRow}>
                    {(profile.specialties || []).length === 0 ? (
                      <p className={styles.specialtiesEmpty}>
                        Aucune spécialité renseignée. Ajoutez vos plats phares ci-dessous pour que
                        l’IA les valorise !
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
                      disabled={isSaving}
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

            {/* SECTION 3 : SERVICES, AMÉNAGEMENTS & CHIFFRES CLÉS */}
            {(activeSectionFilter === 'all' || activeSectionFilter === 'services') && (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleGroup}>
                    <div className={styles.sectionIconBox}>
                      <Sun size={18} />
                    </div>
                    <div>
                      <h2 className={styles.sectionTitle}>Services & Modèle d’Activité</h2>
                      <p className={styles.sectionDesc}>
                        Données de capacité et fréquentation témoin utilisées pour mesurer vos résultats.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={async () => {
                      if (isEditingServices) {
                        const ok = await saveProfile(
                          profile,
                          'Services et données d’activité enregistrés.'
                        );
                        if (ok) setIsEditingServices(false);
                      } else {
                        setIsEditingServices(true);
                      }
                    }}
                    className={`${styles.editToggleBtn} ${
                      isEditingServices ? styles.editToggleBtnActive : ''
                    }`}
                  >
                    {isEditingServices ? (
                      <>
                        <Check size={13} strokeWidth={2.4} />
                        <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
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
                  <div
                    className={`${styles.toggleRow} ${
                      profile.hasTerrace ? styles.toggleRowActive : ''
                    }`}
                  >
                    <div className={styles.toggleInfo}>
                      <div className={styles.toggleIconCircle}>
                        <Sun size={18} />
                      </div>
                      <div>
                        <span className={styles.toggleTitle}>Terrasse extérieure</span>
                        <p className={styles.toggleSubtitle}>
                          L’IA déclenchera des suggestions de posts ensoleillés et apéritifs quand la
                          météo est clémente.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleToggleTerrace}
                      className={`${styles.switchBtn} ${
                        profile.hasTerrace ? styles.switchOn : styles.switchOff
                      }`}
                      aria-pressed={profile.hasTerrace}
                      aria-label="Activer ou désactiver la terrasse"
                    >
                      <span className={styles.switchHandle} />
                    </button>
                  </div>

                  <div
                    className={`${styles.toggleRow} ${
                      profile.hasDelivery ? styles.toggleRowActive : ''
                    }`}
                  >
                    <div className={styles.toggleInfo}>
                      <div className={styles.toggleIconCircle}>
                        <Truck size={18} />
                      </div>
                      <div>
                        <span className={styles.toggleTitle}>Livraison & Vente à emporter</span>
                        <p className={styles.toggleSubtitle}>
                          Active des alertes et visuels de commande à distance les jours de pluie,
                          froid ou grands matchs.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleToggleDelivery}
                      className={`${styles.switchBtn} ${
                        profile.hasDelivery ? styles.switchOn : styles.switchOff
                      }`}
                      aria-pressed={profile.hasDelivery}
                      aria-label="Activer ou désactiver la livraison"
                    >
                      <span className={styles.switchHandle} />
                    </button>
                  </div>

                  {/* Données économiques & Baseline (3 cartes) */}
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

                    <div
                      className={styles.metricCard}
                      title="Nombre habituel de couverts un soir calme sans action commerciale (référence du Verdict)"
                    >
                      <span className={styles.metricLabel}>
                        <TrendingUp size={12} color="#6366F1" />
                        <span>Couverts témoins</span>
                      </span>
                      {isEditingServices ? (
                        <input
                          type="number"
                          min="0"
                          value={profile.baselineCovers ?? ''}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              baselineCovers: e.target.value !== '' ? Number(e.target.value) : 15,
                            })
                          }
                          className={styles.textInput}
                          placeholder="Ex: 15 couverts"
                        />
                      ) : (
                        <span className={styles.metricValueBig}>
                          {profile.baselineCovers !== undefined
                            ? `${profile.baselineCovers} cvts`
                            : '15 cvts'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* COLONNE DROITE */}
          <div className={styles.columnRight}>
            {/* SECTION 4 : HORAIRES D'OUVERTURE */}
            {(activeSectionFilter === 'all' || activeSectionFilter === 'hours') && (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleGroup}>
                    <div className={styles.sectionIconBox}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <h2 className={styles.sectionTitle}>Horaires d’Ouverture</h2>
                      <p className={styles.sectionDesc}>
                        Affichage et paramétrage détaillé par jour de la semaine.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={async () => {
                      if (isEditingHours) {
                        const ok = await saveProfile(profile, 'Horaires d’ouverture mis à jour.');
                        if (ok) setIsEditingHours(false);
                      } else {
                        setIsEditingHours(true);
                      }
                    }}
                    className={`${styles.editToggleBtn} ${
                      isEditingHours ? styles.editToggleBtnActive : ''
                    }`}
                  >
                    {isEditingHours ? (
                      <>
                        <Check size={13} strokeWidth={2.4} />
                        <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
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
                                  onChange={(e) =>
                                    handleHourChange(index, 'lunch', e.target.value)
                                  }
                                  className={styles.timeSlotInput}
                                  placeholder="Midi (12:00 - 14:30)"
                                />
                                <input
                                  type="text"
                                  value={item.dinner}
                                  onChange={(e) =>
                                    handleHourChange(index, 'dinner', e.target.value)
                                  }
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

            {/* SECTION 5 : BOOSTER HEURES CREUSES */}
            {(activeSectionFilter === 'all' || activeSectionFilter === 'offpeak') && (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleGroup}>
                    <div className={styles.sectionIconBox}>
                      <Coffee size={18} />
                    </div>
                    <div>
                      <h2 className={styles.sectionTitle}>Booster Heures Creuses</h2>
                      <p className={styles.sectionDesc}>
                        Remplissez vos tables lors des creux d’affluence grâce aux offres IA.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.offPeakContainer}>
                  <div
                    className={`${styles.toggleRow} ${
                      profile.hasOffPeak ? styles.toggleRowActive : ''
                    }`}
                  >
                    <div className={styles.toggleInfo}>
                      <div className={styles.toggleIconCircle}>
                        <Coffee size={18} />
                      </div>
                      <div>
                        <span className={styles.toggleTitle}>
                          {profile.hasOffPeak
                            ? 'Heures creuses actives'
                            : 'Heures creuses désactivées'}
                        </span>
                        <p className={styles.toggleSubtitle}>
                          Permet à l’IA de cibler vos jours et créneaux calmes avec une offre et un
                          mot-code dédié.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleToggleOffPeak}
                      className={`${styles.switchBtn} ${
                        profile.hasOffPeak ? styles.switchOn : styles.switchOff
                      }`}
                      aria-pressed={profile.hasOffPeak}
                      aria-label="Basculer heures creuses"
                    >
                      <span className={styles.switchHandle} />
                    </button>
                  </div>

                  {profile.hasOffPeak && (
                    <>
                      <div className={styles.offPeakPresetsBox}>
                        <span className={styles.offPeakPresetsTitle}>
                          Suggestions rapides en 1 clic :
                        </span>
                        <div className={styles.offPeakPresetsRow}>
                          {PRESET_OFFPEAK_SLOTS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              disabled={isSaving}
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

                      <div className={styles.offPeakSlotsList}>
                        {(profile.offPeakSlots || []).length === 0 ? (
                          <p className={styles.offPeakEmptyText}>
                            Aucun créneau configuré. Choisissez une suggestion rapide ci-dessus ou
                            ajoutez-en un personnalisé.
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
                                  disabled={isSaving}
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
                              placeholder="Ex: Du Mardi au Jeudi, Mercredi soir..."
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
                              disabled={isSaving}
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

        {/* BARRE STICKY MOBILE D'ENREGISTREMENT */}
        {isAnyEditingActive && (
          <div className={styles.stickyBottomBar}>
            <span className={styles.stickyStatusText}>
              <Sparkles size={14} color="#FF5A00" />
              <span>Modifications en cours...</span>
            </span>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAllActiveEdits}
              className={styles.stickySaveBtn}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer tout'}
            </button>
          </div>
        )}

        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
