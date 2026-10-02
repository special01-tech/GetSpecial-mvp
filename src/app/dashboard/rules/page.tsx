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
        ? 'Mode pause globale activé. Aucune publication automatique ne sera émise.'
        : 'Mode automatique réactivé.'
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
        ? 'Option activée : les publications en attente seront purgées en cas de pause.'
        : 'Option désactivée.'
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
    saveRules(updated, 'Paramètres des sujets mis à jour.');
  };

  // Section 3 : Sujets exclus
  const handleAddExcludedTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newExcludedTopic.trim();
    if (!tag) return;

    if (rules.excludedTopics.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setNotice(`Le sujet "${tag}" est déjà exclu.`);
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    const updated = {
      ...rules,
      excludedTopics: [...rules.excludedTopics, tag],
    };
    saveRules(updated, `Sujet "${tag}" ajouté aux exclusions de l’IA.`);
    setNewExcludedTopic('');
    setIsAddingTag(false);
  };

  const handleRemoveExcludedTopic = (tagToRemove: string) => {
    const updated = {
      ...rules,
      excludedTopics: rules.excludedTopics.filter((t) => t !== tagToRemove),
    };
    saveRules(updated, `Sujet "${tagToRemove}" retiré des exclusions.`);
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
              <h1 className={styles.pageTitle}>Règles</h1>
              <p className={styles.pageSubtitle}>
                Contrôle des publications et thèmes de votre IA
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
            title="Pause globale"
            description="Arrêt d'urgence de toutes les diffusions automatiques"
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
                  <span className={styles.toggleTitle}>Mettre en pause globale</span>
                  <p className={styles.toggleSubtitle}>
                    Bloque instantanément toute nouvelle publication sur vos réseaux
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
                aria-label="Basculer pause globale"
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
                    Supprime toutes les publications
                  </span>
                  <p className={styles.toggleSubtitle}>
                    Purger également les posts programmés en attente dans le planning
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
                aria-label="Supprimer toutes les publications programmées"
              >
                <span className={styles.switchHandle} />
              </button>
            </div>
          </SettingsSection>

          {/* SECTION 2 : Sujets autorisés */}
          <SettingsSection
            title="Sujets"
            description="Activez les déclencheurs que l'IA peut exploiter pour communiquer"
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
                    <span className={styles.topicTitle}>Météo</span>
                    <span className={styles.topicHint}>
                      Terrasse ensoleillée, averses cocooning
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
                  aria-label="Activer sujet météo"
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
                    <span className={styles.topicTitle}>Sport</span>
                    <span className={styles.topicHint}>
                      Matchs de football, rugby, tournois majeurs
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
                  aria-label="Activer sujet sport"
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
                    <span className={styles.topicTitle}>Concerts</span>
                    <span className={styles.topicHint}>
                      Spectacles locaux, musique live, festivals
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
                  aria-label="Activer sujet concerts"
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
                    <span className={styles.topicTitle}>Jours fériés</span>
                    <span className={styles.topicHint}>
                      Ponts, fêtes calendaires, vacances
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
                  aria-label="Activer sujet jours fériés"
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
                    <span className={styles.topicTitle}>Rappels offres</span>
                    <span className={styles.topicHint}>
                      Happy hour, menus du midi, réductions
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
                  aria-label="Activer sujet rappels offres"
                >
                  <span className={styles.switchHandle} />
                </button>
              </div>
            </div>
          </SettingsSection>

          {/* SECTION 3 : Sujets exclus */}
          <SettingsSection
            title="Sujets exclus"
            description="L'IA évitera strictement toute mention de ces thématiques"
            icon={ShieldAlert}
            action={
              !isAddingTag && (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className={styles.addTagBtn}
                >
                  <Plus size={13} />
                  <span>+ Ajouter</span>
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
                  placeholder="Ex : Soirée étudiante, Alcool fort..."
                  value={newExcludedTopic}
                  onChange={(e) => setNewExcludedTopic(e.target.value)}
                  className={styles.tagInput}
                />
                <button type="submit" className={styles.confirmAddBtn}>
                  Ajouter
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
                    aria-label={`Supprimer l'exclusion ${tag}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            <p className={styles.exclusionNote}>
              <Info size={13} />
              <span>
                Ces exclusions agissent comme des filtres stricts sur l’ensemble de vos posts
                générés par Claude IA.
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
