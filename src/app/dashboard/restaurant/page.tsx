'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import SettingsSection from '@/components/ui/SettingsSection/SettingsSection';
import { useLanguage } from '@/i18n';
import {
  RestaurantProfileData,
  INITIAL_RESTAURANT_PROFILE,
  OffPeakSlot,
} from '@/services/restaurant/restaurant-profile.data';
import styles from './restaurant.module.css';

/**
  * Mon Resto — Profil de l'établissement, Horaires d'ouverture & Heures creuses
  * Navigation interne :
  * - Profil (/dashboard/restaurant)
  * - Offres (/dashboard/restaurant/offers)
  * - Événements (/dashboard/restaurant/events)
  */
export default function MyRestaurantPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<RestaurantProfileData>(INITIAL_RESTAURANT_PROFILE);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // État d'ajout d'un créneau d'heures creuses
  const [isAddingOffPeak, setIsAddingOffPeak] = useState(false);
  const [newSlotName, setNewSlotName] = useState('Après-midi calme');
  const [newSlotStart, setNewSlotStart] = useState('15:00');
  const [newSlotEnd, setNewSlotEnd] = useState('18:30');
  const [newSlotDays, setNewSlotDays] = useState('Du Lundi au Vendredi');

  // Charger profil, offres et thème stockés
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('getspecial_theme');
      if (storedTheme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }

      const stored = localStorage.getItem('getspecial_restaurant_full_profile');
      if (stored) {
        setProfile(JSON.parse(stored));
      } else {
        const storedRest =
          localStorage.getItem('getspecial_selected_restaurant') ||
          localStorage.getItem('getspecial_created_restaurant');
        if (storedRest) {
          const parsed = JSON.parse(storedRest);
          setProfile((prev) => ({
            ...prev,
            name: parsed.name || prev.name,
            address: parsed.address || prev.address,
            phone: parsed.phone || prev.phone,
          }));
        }
      }

      // Synchronisation en direct avec l'API
      const restaurantId =
        localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1';
      fetch(`/api/restaurants/${restaurantId}/profile`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            const r = json.data;
            setProfile((prev) => ({
              ...prev,
              name: r.name || prev.name,
              address: r.address || prev.address,
              phone: r.phone || prev.phone,
              tone: r.profile?.tone || prev.tone,
              hasTerrace:
                r.profile?.hasTerrace !== undefined
                  ? r.profile.hasTerrace
                  : prev.hasTerrace,
              hasDelivery:
                r.profile?.customRules?.hasDelivery !== undefined
                  ? r.profile.customRules.hasDelivery
                  : prev.hasDelivery,
            }));
          }
        })
        .catch(() => {});
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
        localStorage.setItem('getspecial_theme', 'light');
      }
    }
    setSavedNotice(
      nextMode
        ? t('restaurant.profile.darkEnabled')
        : t('restaurant.profile.lightEnabled')
    );
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const saveProfile = async (updated: RestaurantProfileData, notice: string) => {
    setProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_restaurant_full_profile', JSON.stringify(updated));
      const restaurantId =
        localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1';
      try {
        await fetch(`/api/restaurants/${restaurantId}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tone: updated.tone,
            hasTerrace: updated.hasTerrace,
            customRules: { hasDelivery: updated.hasDelivery },
          }),
        });
      } catch (err) {
        console.warn('Could not sync profile update to backend:', err);
      }
    }
    setSavedNotice(notice);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleToggleTerrace = () => {
    const updated = { ...profile, hasTerrace: !profile.hasTerrace };
    saveProfile(
      updated,
      updated.hasTerrace
        ? t('restaurant.profile.terraceOn')
        : t('restaurant.profile.terraceOff')
    );
  };

  const handleToggleDelivery = () => {
    const updated = { ...profile, hasDelivery: !profile.hasDelivery };
    saveProfile(
      updated,
      updated.hasDelivery
        ? t('restaurant.profile.deliveryOn')
        : t('restaurant.profile.deliveryOff')
    );
  };

  const handleToggleOffPeak = () => {
    const nextState = !profile.hasOffPeak;
    const updated = { ...profile, hasOffPeak: nextState };
    saveProfile(
      updated,
      nextState
        ? 'Heures creuses activées pour vos suggestions d’offres.'
        : 'Heures creuses désactivées.'
    );
  };

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
      lunch: !current.isOpen ? '12h00 - 14h30' : t('restaurant.profile.closed'),
      dinner: !current.isOpen ? '19h00 - 22h30' : t('restaurant.profile.closed'),
    };
    setProfile({ ...profile, openingHours: newHours });
  };

  // Ajout d'un créneau d'heures creuses
  const handleAddOffPeakSlot = () => {
    if (!newSlotName.trim()) return;
    const newSlot: OffPeakSlot = {
      id: `slot_${Date.now()}`,
      name: newSlotName.trim(),
      timeStart: newSlotStart,
      timeEnd: newSlotEnd,
      days: newSlotDays.trim(),
    };
    const currentSlots = profile.offPeakSlots || [];
    const updated = {
      ...profile,
      hasOffPeak: true,
      offPeakSlots: [...currentSlots, newSlot],
    };
    saveProfile(updated, 'Créneau d’heures creuses ajouté avec succès.');
    setIsAddingOffPeak(false);
  };

  // Suppression d'un créneau d'heures creuses
  const handleDeleteOffPeakSlot = (slotId: string) => {
    const currentSlots = profile.offPeakSlots || [];
    const updated = {
      ...profile,
      offPeakSlots: currentSlots.filter((s) => s.id !== slotId),
    };
    saveProfile(updated, 'Créneau supprimé.');
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* ========================================================= */}
        {/* EN-TÊTE DE LA PAGE : Titre "Mon Resto"                    */}
        {/* ========================================================= */}
        <header className={styles.header}>
          <div className={styles.headerTexts}>
            <h1 className={styles.pageMainTitle}>Mon Resto</h1>
            <p className={styles.pageMainSubtitle}>
              Identité de marque, services et horaires pris en compte pour la génération IA.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className={styles.themeToggleBtn}
            title={isDarkMode ? t('restaurant.profile.themeToLight') : t('restaurant.profile.themeToDark')}
            aria-label={isDarkMode ? t('restaurant.profile.activateLight') : t('restaurant.profile.activateDark')}
          >
            {isDarkMode ? (
              <>
                <SunMedium size={15} className={styles.sunIcon} />
                <span>{t('restaurant.profile.light')}</span>
              </>
            ) : (
              <>
                <Moon size={15} className={styles.moonIcon} />
                <span>{t('restaurant.profile.dark')}</span>
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
        {/* BANNIÈRE HÉROÏQUE DU RESTAURANT                           */}
        {/* ========================================================= */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.storeAvatar}>
              <Store size={26} className={styles.storeIcon} />
            </div>
            <div className={styles.heroMeta}>
              <div className={styles.heroNameRow}>
                <h2 className={styles.restaurantNameTitle}>{profile.name}</h2>
                <span className={styles.restaurantTypeBadge}>{profile.type}</span>
              </div>
              <div className={styles.heroAddressRow}>
                {profile.address && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={13} color="#FF5A00" />
                    {profile.address}
                  </span>
                )}
                {profile.phone && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={13} color="#6B7280" />
                    {profile.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.tonePill}>
              <Sparkles size={12} className={styles.toneIcon} />
              <span>Ton IA : {profile.tone}</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ONGLETS INTERNES (Profil, Offres, Événements)             */}
        {/* ========================================================= */}
        <nav className={styles.tabsNav} aria-label={t('restaurant.tabs.label')}>
          <Link
            href="/dashboard/restaurant"
            className={`${styles.tabBtn} ${styles.tabActive}`}
          >
            <Store size={15} />
            <span>Profil de l’établissement</span>
          </Link>

          <Link
            href="/dashboard/restaurant/offers"
            className={styles.tabBtn}
          >
            <Tag size={15} />
            <span>Offres & Formules</span>
          </Link>

          <Link
            href="/dashboard/restaurant/events"
            className={styles.tabBtn}
          >
            <Calendar size={15} />
            <span>Événements locaux</span>
          </Link>
        </nav>

        {/* ========================================================= */}
        {/* GRILLE 2 COLONNES (ESPACE ÉQUILIBRÉ SANS SURCHARGE)       */}
        {/* ========================================================= */}
        <div className={styles.restaurantGrid}>
          {/* ------------------------------------------------------- */}
          {/* COLONNE GAUCHE : IDENTITÉ & SERVICES                    */}
          {/* ------------------------------------------------------- */}
          <div className={styles.columnLeft}>
            {/* Section 1 : Informations Générales & Ligne Éditoriale */}
            <SettingsSection
              title={t('restaurant.profile.infoTitle')}
              description={t('restaurant.profile.infoDescription')}
              icon={Store}
              action={
                <button
                  type="button"
                  onClick={() => {
                    if (isEditingInfo) {
                      saveProfile(profile, t('restaurant.profile.infoUpdated'));
                    }
                    setIsEditingInfo(!isEditingInfo);
                  }}
                  className={styles.editToggleBtn}
                >
                  {isEditingInfo ? (
                    <>
                      <Check size={13} strokeWidth={2.4} />
                      <span>{t('restaurant.profile.save')}</span>
                    </>
                  ) : (
                    <>
                      <Edit2 size={13} />
                      <span>{t('restaurant.profile.edit')}</span>
                    </>
                  )}
                </button>
              }
            >
              <div className={styles.fieldsGrid}>
                {/* Nom */}
                <div className={styles.fieldItem}>
                  <label className={styles.fieldLabel}>{t('restaurant.profile.nameLabel')}</label>
                  {isEditingInfo ? (
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className={styles.textInput}
                    />
                  ) : (
                    <span className={styles.fieldValue}>{profile.name}</span>
                  )}
                </div>

                {/* Type d'établissement */}
                <div className={styles.fieldItem}>
                  <label className={styles.fieldLabel}>{t('restaurant.profile.typeLabel')}</label>
                  {isEditingInfo ? (
                    <select
                      value={profile.type}
                      onChange={(e) => setProfile({ ...profile, type: e.target.value })}
                      className={styles.selectInput}
                    >
                      <option value="Restaurant">{t('restaurant.profile.types.restaurant')}</option>
                      <option value="Bar">{t('restaurant.profile.types.bar')}</option>
                      <option value="Brasserie">{t('restaurant.profile.types.brasserie')}</option>
                      <option value="Pizzeria">{t('restaurant.profile.types.pizzeria')}</option>
                      <option value="Café">{t('restaurant.profile.types.cafe')}</option>
                      <option value="Fast Food">{t('restaurant.profile.types.fastFood')}</option>
                    </select>
                  ) : (
                    <span className={styles.fieldValue}>{profile.type}</span>
                  )}
                </div>

                {/* Adresse */}
                <div className={styles.fieldItem}>
                  <label className={styles.fieldLabel}>Adresse de l’établissement</label>
                  {isEditingInfo ? (
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      className={styles.textInput}
                      placeholder="Ex: 12 Rue de la Paix, Paris"
                    />
                  ) : (
                    <span className={styles.fieldValue}>{profile.address || 'Non renseignée'}</span>
                  )}
                </div>

                {/* Téléphone */}
                <div className={styles.fieldItem}>
                  <label className={styles.fieldLabel}>Numéro de contact</label>
                  {isEditingInfo ? (
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className={styles.textInput}
                      placeholder="Ex: 01 23 45 67 89"
                    />
                  ) : (
                    <span className={styles.fieldValue}>{profile.phone || 'Non renseigné'}</span>
                  )}
                </div>

                {/* Ton de marque IA */}
                <div className={styles.fieldItem}>
                  <label className={styles.fieldLabel}>{t('restaurant.profile.toneLabel')}</label>
                  {isEditingInfo ? (
                    <input
                      type="text"
                      value={profile.tone}
                      onChange={(e) => setProfile({ ...profile, tone: e.target.value })}
                      className={styles.textInput}
                      placeholder="Ex: Chaleureux & Festif"
                    />
                  ) : (
                    <div className={styles.tonePill}>
                      <Sparkles size={12} className={styles.toneIcon} />
                      <span>{profile.tone}</span>
                    </div>
                  )}
                </div>

                {/* Palette de couleurs */}
                <div className={styles.fieldItem}>
                  <label className={styles.fieldLabel}>{t('restaurant.profile.colorsLabel')}</label>
                  <div className={styles.colorPalette}>
                    {profile.colors.map((c, i) => (
                      <div
                        key={i}
                        className={styles.colorSwatch}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </SettingsSection>

            {/* Section 2 : Équipements & Services (Terrasse & Livraison) */}
            <SettingsSection
              title={t('restaurant.profile.servicesTitle')}
              description={t('restaurant.profile.servicesDescription')}
              icon={Sun}
            >
              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <div className={styles.toggleIconCircle}>
                    <Sun size={18} />
                  </div>
                  <div>
                    <span className={styles.toggleTitle}>{t('restaurant.profile.terraceTitle')}</span>
                    <p className={styles.toggleSubtitle}>
                      {t('restaurant.profile.terraceSubtitle')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleTerrace}
                  className={`${styles.switchBtn} ${profile.hasTerrace ? styles.switchOn : styles.switchOff}`}
                  aria-pressed={profile.hasTerrace}
                  aria-label={t('restaurant.profile.terraceToggle')}
                >
                  <span className={styles.switchHandle} />
                </button>
              </div>

              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <div className={styles.toggleIconCircle}>
                    <Truck size={18} />
                  </div>
                  <div>
                    <span className={styles.toggleTitle}>{t('restaurant.profile.deliveryTitle')}</span>
                    <p className={styles.toggleSubtitle}>
                      {t('restaurant.profile.deliverySubtitle')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleDelivery}
                  className={`${styles.switchBtn} ${profile.hasDelivery ? styles.switchOn : styles.switchOff}`}
                  aria-pressed={profile.hasDelivery}
                  aria-label={t('restaurant.profile.deliveryToggle')}
                >
                  <span className={styles.switchHandle} />
                </button>
              </div>
            </SettingsSection>
          </div>

          {/* ------------------------------------------------------- */}
          {/* COLONNE DROITE : HORAIRES D'OUVERTURE & HEURES CREUSES  */}
          {/* ------------------------------------------------------- */}
          <div className={styles.columnRight}>
            {/* Section 3 : Horaires d'ouverture */}
            <SettingsSection
              title={t('restaurant.profile.hoursTitle')}
              description={t('restaurant.profile.hoursDescription')}
              icon={Clock}
              action={
                <button
                  type="button"
                  onClick={() => {
                    if (isEditingHours) {
                      saveProfile(profile, t('restaurant.profile.hoursUpdated'));
                    }
                    setIsEditingHours(!isEditingHours);
                  }}
                  className={styles.editToggleBtn}
                >
                  {isEditingHours ? (
                    <>
                      <Check size={13} strokeWidth={2.4} />
                      <span>{t('restaurant.profile.save')}</span>
                    </>
                  ) : (
                    <>
                      <Edit2 size={13} />
                      <span>{t('restaurant.profile.edit')}</span>
                    </>
                  )}
                </button>
              }
            >
              <div className={styles.hoursList}>
                {profile.openingHours.map((item, index) => (
                  <div
                    key={item.day}
                    className={`${styles.hourRow} ${!item.isOpen ? styles.hourRowClosed : ''}`}
                  >
                    <div className={styles.dayCol}>
                      <span className={styles.dayName}>{item.day}</span>
                      {!item.isOpen && (
                        <span className={styles.closedPill}>{t('restaurant.profile.closed')}</span>
                      )}
                    </div>

                    {isEditingHours ? (
                      <div className={styles.editHoursGroup}>
                        <button
                          type="button"
                          onClick={() => handleToggleDayOpen(index)}
                          className={styles.openCloseToggle}
                        >
                          {item.isOpen ? t('restaurant.profile.closeDay') : t('restaurant.profile.openDay')}
                        </button>

                        {item.isOpen && (
                          <div className={styles.inputsPair}>
                            <input
                              type="text"
                              value={item.lunch}
                              onChange={(e) => handleHourChange(index, 'lunch', e.target.value)}
                              className={styles.timeSlotInput}
                              placeholder={t('restaurant.profile.lunchPlaceholder')}
                            />
                            <input
                              type="text"
                              value={item.dinner}
                              onChange={(e) => handleHourChange(index, 'dinner', e.target.value)}
                              className={styles.timeSlotInput}
                              placeholder={t('restaurant.profile.dinnerPlaceholder')}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={styles.slotsCol}>
                        {item.isOpen ? (
                          <>
                            <span className={styles.slotText}>{item.lunch}</span>
                            <span className={styles.slotDivider}>/</span>
                            <span className={styles.slotText}>{item.dinner}</span>
                          </>
                        ) : (
                          <span className={styles.closedText}>
                            {t('restaurant.profile.closedAllDay')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SettingsSection>

            {/* Section 4 : Heures creuses & Périodes calmes */}
            <SettingsSection
              title="Heures creuses & Périodes calmes"
              description="Spécifiez vos créneaux de faible affluence pour que l’IA vous propose des offres ciblées."
              icon={Coffee}
            >
              <div className={styles.offPeakContainer}>
                {/* Toggle principal d'activation */}
                <div className={styles.toggleRow} style={{ paddingBottom: 10 }}>
                  <div className={styles.toggleInfo}>
                    <div className={styles.toggleIconCircle}>
                      <Coffee size={18} />
                    </div>
                    <div>
                      <span className={styles.toggleTitle}>
                        {profile.hasOffPeak ? 'Heures creuses activées' : 'Pas d’heures creuses définies'}
                      </span>
                      <p className={styles.toggleSubtitle}>
                        Permet de programmer des promotions pour remplir vos tables aux heures creuses.
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

                {/* Liste des créneaux creux si activé */}
                {profile.hasOffPeak && (
                  <>
                    <div className={styles.offPeakSlotsList}>
                      {(profile.offPeakSlots || []).length === 0 ? (
                        <p className={styles.offPeakEmptyText}>
                          Aucun créneau d’heures creuses configuré pour l’instant.
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

                    {/* Formulaire d'ajout d'un nouveau créneau creux */}
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
                            <label className={styles.fieldLabel}>Début</label>
                            <input
                              type="time"
                              value={newSlotStart}
                              onChange={(e) => setNewSlotStart(e.target.value)}
                              className={styles.textInput}
                            />
                          </div>
                          <div className={styles.fieldItem}>
                            <label className={styles.fieldLabel}>Fin</label>
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
                            onClick={handleAddOffPeakSlot}
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
                        <Plus size={13} strokeWidth={2.4} />
                        <span>Ajouter un créneau d’heures creuses</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </SettingsSection>
          </div>
        </div>

        {/* Spacer pour Bottom Navigation mobile */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
