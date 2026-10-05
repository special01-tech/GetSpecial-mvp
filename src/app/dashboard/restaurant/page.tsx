'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Tag,
  Calendar,
  Share2,
  Sparkles,
  Palette,
  Clock,
  Sun,
  Truck,
  Edit2,
  Check,
  CheckCircle2,
  Moon,
  SunMedium,
} from 'lucide-react';
import SettingsSection from '@/components/ui/SettingsSection/SettingsSection';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import { useLanguage } from '@/i18n';
import {
  RestaurantProfileData,
  INITIAL_RESTAURANT_PROFILE,
} from '@/services/restaurant/restaurant-profile.data';
import styles from './restaurant.module.css';

/**
 * Écran 14 & 15 : Mon restaurant - Profil & Offres
 *
 * Navigation interne :
 * - Profil
 * - Offres
 * - Événements
 * - Comptes
 */
export default function RestaurantProfilePage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<RestaurantProfileData>(INITIAL_RESTAURANT_PROFILE);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Charger profil, offres et thème stockés si dispo
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
        const storedRest = localStorage.getItem('getspecial_selected_restaurant') || localStorage.getItem('getspecial_created_restaurant');
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

      // Synchronisation en direct avec la base de données via l'API
      const restaurantId = localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1';
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
              hasTerrace: r.profile?.hasTerrace !== undefined ? r.profile.hasTerrace : prev.hasTerrace,
              hasDelivery: r.profile?.customRules?.hasDelivery !== undefined ? r.profile.customRules.hasDelivery : prev.hasDelivery,
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
      const restaurantId = localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1';
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

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header Profil Restaurant */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.storeAvatar}>
              <Store size={22} className={styles.storeIcon} />
            </div>
            <div>
              <h1 className={styles.headerTitle}>{profile.name}</h1>
              <p className={styles.headerSubtitle}>{t('restaurant.header.subtitle')}</p>
            </div>
          </div>

          {/* Bouton de bascule Mode Sombre / Mode Clair (Global Theme System) */}
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

        {/* Navigation Interne (Tabs) */}
        <nav className={styles.tabsNav} aria-label={t('restaurant.tabs.label')}>
          <Link
            href="/dashboard/restaurant"
            className={`${styles.tabBtn} ${styles.tabActive}`}
          >
            <Store size={14} />
            <span>{t('restaurant.tabs.profile')}</span>
          </Link>

          <Link
            href="/dashboard/restaurant/offers"
            className={styles.tabBtn}
          >
            <Tag size={14} />
            <span>{t('restaurant.tabs.offers')}</span>
          </Link>

          <Link
            href="/dashboard/restaurant/events"
            className={styles.tabBtn}
          >
            <Calendar size={14} />
            <span>{t('restaurant.tabs.events')}</span>
          </Link>

          <Link
            href="/dashboard/restaurant/accounts"
            className={styles.tabBtn}
          >
            <Share2 size={14} />
            <span>{t('restaurant.tabs.accounts')}</span>
          </Link>
        </nav>

        {/* CONTENU : PROFIL */}
          <main className={styles.mainContent}>
            {/* Section 1 : Informations Générales */}
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
                      <Check size={13} />
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

                {/* Type */}
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

                {/* Ton de marque */}
                <div className={styles.fieldItem}>
                  <label className={styles.fieldLabel}>{t('restaurant.profile.toneLabel')}</label>
                  {isEditingInfo ? (
                    <input
                      type="text"
                      value={profile.tone}
                      onChange={(e) => setProfile({ ...profile, tone: e.target.value })}
                      className={styles.textInput}
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
                    <Sun size={16} />
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
                    <Truck size={16} />
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
                      <Check size={13} />
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
                      {!item.isOpen && <span className={styles.closedPill}>{t('restaurant.profile.closed')}</span>}
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
                          <span className={styles.closedText}>{t('restaurant.profile.closedAllDay')}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SettingsSection>
          </main>

        {/* Spacer pour Bottom Navigation */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
