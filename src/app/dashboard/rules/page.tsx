'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sliders,
  AlertOctagon,
  Trash2,
  CloudSun,
  Trophy,
  Music,
  PartyPopper,
  Tag,
  ShieldAlert,
  Plus,
  X,
  CheckCircle2,
  Save,
  Info,
} from 'lucide-react';
import SettingsSection from '@/components/ui/SettingsSection/SettingsSection';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import {
  AssistantRulesData,
  INITIAL_RULES_DATA,
} from '@/services/rules/rules.data';
import { useLanguage } from '@/i18n';
import styles from './rules.module.css';

/**
 * Écran 18 : Règles
 *
 * Titre : "Règles"
 *
 * Section 1 : "Pause globale"
 * - Toggle Pause globale
 * - Option "Supprime toutes les publications" (toggle)
 *
 * Section 2 : "Sujets"
 * Toggles :
 * - Météo
 * - Sport
 * - Concerts
 * - Jours fériés
 * - Rappels offres
 *
 * Section 3 : "Sujets exclus"
 * Tags :
 * - Matchs
 * - Politique
 * - Religion
 * + Bouton "+ Ajouter" pour insérer un nouveau sujet exclu
 *
 * Persistance des règles dans le localStorage / DB.
 */
export default function RulesPage() {
  const { t } = useLanguage();
  const [rules, setRules] = useState<AssistantRulesData>(INITIAL_RULES_DATA);
  const [newExcludedTopic, setNewExcludedTopic] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Charger depuis le localStorage au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('getspecial_assistant_rules');
      if (stored) {
        setRules(JSON.parse(stored));
      }
    } catch {
      // Ignorer
    }
  }, []);

  const saveRules = (updated: AssistantRulesData, message?: string) => {
    setRules(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_assistant_rules', JSON.stringify(updated));
      // Si la pause globale change, synchroniser avec la pause restaurant générale
      localStorage.setItem('getspecial_restaurant_paused', String(updated.globalPause));
    }
    if (message) {
      setNotice(message);
      setTimeout(() => setNotice(null), 3500);
    }
  };

  // Toggles Section 1 : Pause globale
  const handleToggleGlobalPause = () => {
    const updated = { ...rules, globalPause: !rules.globalPause };
    saveRules(
      updated,
      updated.globalPause
        ? t('engagement.rules.globalPause.enabledMsg')
        : t('engagement.rules.globalPause.disabledMsg')
    );
  };

  const handleToggleDeleteAll = () => {
    const updated = {
      ...rules,
      deleteAllScheduledOnPause: !rules.deleteAllScheduledOnPause,
    };
    saveRules(
      updated,
      updated.deleteAllScheduledOnPause
        ? t('engagement.rules.globalPause.purgeOn')
        : t('engagement.rules.globalPause.purgeOff')
    );
  };

  // Toggles Section 2 : Sujets autorisés
  const handleToggleTopic = (topicKey: keyof AssistantRulesData['topics']) => {
    const updated = {
      ...rules,
      topics: {
        ...rules.topics,
        [topicKey]: !rules.topics[topicKey],
      },
    };
    saveRules(updated, t('engagement.rules.topics.updatedMsg'));
  };

  // Section 3 : Sujets exclus
  const handleAddExcludedTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newExcludedTopic.trim();
    if (!tag) return;

    if (rules.excludedTopics.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setNotice(t('engagement.rules.excluded.alreadyExcluded', { tag }));
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    const updated = {
      ...rules,
      excludedTopics: [...rules.excludedTopics, tag],
    };
    saveRules(updated, t('engagement.rules.excluded.added', { tag }));
    setNewExcludedTopic('');
    setIsAddingTag(false);
  };

  const handleRemoveExcludedTopic = (tagToRemove: string) => {
    const updated = {
      ...rules,
      excludedTopics: rules.excludedTopics.filter((t) => t !== tagToRemove),
    };
    saveRules(updated, t('engagement.rules.excluded.removed', { tag: tagToRemove }));
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header Règles */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.iconCircle}>
              <Sliders size={22} className={styles.headerIcon} />
            </div>
            <div>
              <h1 className={styles.pageTitle}>{t('engagement.rules.title')}</h1>
              <p className={styles.pageSubtitle}>
                {t('engagement.rules.subtitle')}
              </p>
            </div>
          </div>
        </header>

        {/* Notice temporaire de confirmation */}
        {notice && (
          <div className={styles.noticeBanner}>
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
        )}

        <main className={styles.mainContent}>
          {/* SECTION 1 : Pause globale */}
          <SettingsSection
            title={t('engagement.rules.globalPause.title')}
            description={t('engagement.rules.globalPause.desc')}
            icon={AlertOctagon}
          >
            {/* Switch Pause Globale */}
            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <div
                  className={`${styles.iconBox} ${
                    rules.globalPause ? styles.iconBoxDanger : styles.iconBoxNormal
                  }`}
                >
                  <AlertOctagon size={18} />
                </div>
                <div>
                  <span className={styles.toggleTitle}>{t('engagement.rules.globalPause.toggleTitle')}</span>
                  <p className={styles.toggleSubtitle}>
                    {t('engagement.rules.globalPause.toggleSub')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleGlobalPause}
                className={`${styles.switchBtn} ${
                  rules.globalPause ? styles.switchDanger : styles.switchOff
                }`}
                aria-pressed={rules.globalPause}
                aria-label={t('engagement.rules.globalPause.toggleLabel')}
              >
                <span className={styles.switchHandle} />
              </button>
            </div>

            {/* Switch Supprime toutes les publications */}
            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <div className={styles.iconBox}>
                  <Trash2 size={18} />
                </div>
                <div>
                  <span className={styles.toggleTitle}>
                    {t('engagement.rules.globalPause.deleteTitle')}
                  </span>
                  <p className={styles.toggleSubtitle}>
                    {t('engagement.rules.globalPause.deleteSub')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleDeleteAll}
                className={`${styles.switchBtn} ${
                  rules.deleteAllScheduledOnPause ? styles.switchOn : styles.switchOff
                }`}
                aria-pressed={rules.deleteAllScheduledOnPause}
                aria-label={t('engagement.rules.globalPause.deleteLabel')}
              >
                <span className={styles.switchHandle} />
              </button>
            </div>
          </SettingsSection>

          {/* SECTION 2 : Sujets autorisés */}
          <SettingsSection
            title={t('engagement.rules.topics.title')}
            description={t('engagement.rules.topics.desc')}
            icon={CloudSun}
          >
            <div className={styles.topicsGrid}>
              {/* Météo */}
              <div className={styles.topicRow}>
                <div className={styles.topicMeta}>
                  <div className={styles.topicIconCircle}>
                    <CloudSun size={17} className={styles.weatherIcon} />
                  </div>
                  <div>
                    <span className={styles.topicTitle}>{t('engagement.rules.topics.weather')}</span>
                    <span className={styles.topicHint}>
                      {t('engagement.rules.topics.weatherHint')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleTopic('weather')}
                  className={`${styles.switchBtn} ${
                    rules.topics.weather ? styles.switchOn : styles.switchOff
                  }`}
                  aria-pressed={rules.topics.weather}
                  aria-label={t('engagement.rules.topics.weatherLabel')}
                >
                  <span className={styles.switchHandle} />
                </button>
              </div>

              {/* Sport */}
              <div className={styles.topicRow}>
                <div className={styles.topicMeta}>
                  <div className={styles.topicIconCircle}>
                    <Trophy size={17} className={styles.sportIcon} />
                  </div>
                  <div>
                    <span className={styles.topicTitle}>{t('engagement.rules.topics.sport')}</span>
                    <span className={styles.topicHint}>
                      {t('engagement.rules.topics.sportHint')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleTopic('sport')}
                  className={`${styles.switchBtn} ${
                    rules.topics.sport ? styles.switchOn : styles.switchOff
                  }`}
                  aria-pressed={rules.topics.sport}
                  aria-label={t('engagement.rules.topics.sportLabel')}
                >
                  <span className={styles.switchHandle} />
                </button>
              </div>

              {/* Concerts */}
              <div className={styles.topicRow}>
                <div className={styles.topicMeta}>
                  <div className={styles.topicIconCircle}>
                    <Music size={17} className={styles.concertIcon} />
                  </div>
                  <div>
                    <span className={styles.topicTitle}>{t('engagement.rules.topics.concerts')}</span>
                    <span className={styles.topicHint}>
                      {t('engagement.rules.topics.concertsHint')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleTopic('concerts')}
                  className={`${styles.switchBtn} ${
                    rules.topics.concerts ? styles.switchOn : styles.switchOff
                  }`}
                  aria-pressed={rules.topics.concerts}
                  aria-label={t('engagement.rules.topics.concertsLabel')}
                >
                  <span className={styles.switchHandle} />
                </button>
              </div>

              {/* Jours fériés */}
              <div className={styles.topicRow}>
                <div className={styles.topicMeta}>
                  <div className={styles.topicIconCircle}>
                    <PartyPopper size={17} className={styles.holidayIcon} />
                  </div>
                  <div>
                    <span className={styles.topicTitle}>{t('engagement.rules.topics.holidays')}</span>
                    <span className={styles.topicHint}>
                      {t('engagement.rules.topics.holidaysHint')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleTopic('holidays')}
                  className={`${styles.switchBtn} ${
                    rules.topics.holidays ? styles.switchOn : styles.switchOff
                  }`}
                  aria-pressed={rules.topics.holidays}
                  aria-label={t('engagement.rules.topics.holidaysLabel')}
                >
                  <span className={styles.switchHandle} />
                </button>
              </div>

              {/* Rappels offres */}
              <div className={styles.topicRow}>
                <div className={styles.topicMeta}>
                  <div className={styles.topicIconCircle}>
                    <Tag size={17} className={styles.offerIcon} />
                  </div>
                  <div>
                    <span className={styles.topicTitle}>{t('engagement.rules.topics.offers')}</span>
                    <span className={styles.topicHint}>
                      {t('engagement.rules.topics.offersHint')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleTopic('offerReminders')}
                  className={`${styles.switchBtn} ${
                    rules.topics.offerReminders ? styles.switchOn : styles.switchOff
                  }`}
                  aria-pressed={rules.topics.offerReminders}
                  aria-label={t('engagement.rules.topics.offersLabel')}
                >
                  <span className={styles.switchHandle} />
                </button>
              </div>
            </div>
          </SettingsSection>

          {/* SECTION 3 : Sujets exclus */}
          <SettingsSection
            title={t('engagement.rules.excluded.title')}
            description={t('engagement.rules.excluded.desc')}
            icon={ShieldAlert}
            action={
              !isAddingTag && (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className={styles.addTagBtn}
                >
                  <Plus size={13} />
                  <span>{t('engagement.rules.excluded.addButton')}</span>
                </button>
              )
            }
          >
            {/* Formulaire inline pour ajouter un tag */}
            {isAddingTag && (
              <form onSubmit={handleAddExcludedTopic} className={styles.addTagForm}>
                <input
                  type="text"
                  autoFocus
                  placeholder={t('engagement.rules.excluded.inputPlaceholder')}
                  value={newExcludedTopic}
                  onChange={(e) => setNewExcludedTopic(e.target.value)}
                  className={styles.tagInput}
                />
                <button type="submit" className={styles.confirmAddBtn}>
                  {t('engagement.rules.excluded.addConfirm')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTag(false);
                    setNewExcludedTopic('');
                  }}
                  className={styles.cancelAddBtn}
                >
                  <X size={15} />
                </button>
              </form>
            )}

            {/* Liste des tags exclus */}
            <div className={styles.tagsContainer}>
              {rules.excludedTopics.map((tag) => (
                <div key={tag} className={styles.excludedTagPill}>
                  <span className={styles.tagName}>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExcludedTopic(tag)}
                    className={styles.removeTagBtn}
                    aria-label={t('engagement.rules.excluded.removeLabel', { tag })}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            <p className={styles.exclusionNote}>
              <Info size={13} />
              <span>
                {t('engagement.rules.excluded.note')}
              </span>
            </p>
          </SettingsSection>
        </main>

        {/* Spacer pour Bottom Navigation */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
