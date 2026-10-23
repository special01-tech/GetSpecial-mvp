'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Trophy,
  Music,
  Sparkles,
  Calendar,
  Utensils,
  MapPin,
  Check,
  Plus,
  Loader2,
} from 'lucide-react';
import {
  RestaurantEventPreferences,
  DEFAULT_EVENT_PREFERENCES,
} from '@/services/restaurant/event-preferences.types';
import styles from './EventPreferencesModal.module.css';

interface EventPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesUpdated?: (newPrefs: RestaurantEventPreferences) => void;
  initialPreferences?: RestaurantEventPreferences;
  restaurantId?: string;
}

export default function EventPreferencesModal({
  isOpen,
  onClose,
  onPreferencesUpdated,
  initialPreferences,
  restaurantId,
}: EventPreferencesModalProps) {
  const [preferences, setPreferences] = useState<RestaurantEventPreferences>(
    initialPreferences || DEFAULT_EVENT_PREFERENCES
  );
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Charger les préférences actuelles depuis l'API si non fournies
  useEffect(() => {
    if (!isOpen) return;

    if (initialPreferences) {
      setPreferences(initialPreferences);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const query = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : '';
    fetch(`/api/restaurant/preferences/events${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.data?.preferences) {
          setPreferences(data.data.preferences);
        }
      })
      .catch((err) => {
        console.warn('[EVENT_PREF_MODAL] Erreur chargement préférences :', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialPreferences, restaurantId]);

  // Fermeture accessible avec la touche Échap (Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleCategory = (key: keyof RestaurantEventPreferences['categories']) => {
    setPreferences((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [key]: !prev.categories[key],
      },
    }));
  };

  const handleSelectRadius = (km: number) => {
    setPreferences((prev) => ({
      ...prev,
      radiusKm: km,
    }));
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newKeyword.trim().toLowerCase();
    if (!clean) return;

    if (!preferences.excludedKeywords.includes(clean)) {
      setPreferences((prev) => ({
        ...prev,
        excludedKeywords: [...prev.excludedKeywords, clean],
      }));
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setPreferences((prev) => ({
      ...prev,
      excludedKeywords: prev.excludedKeywords.filter((kw) => kw !== kwToRemove),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/restaurant/preferences/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          categories: preferences.categories,
          radiusKm: preferences.radiusKm,
          excludedKeywords: preferences.excludedKeywords,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.preferences) {
        if (onPreferencesUpdated) {
          onPreferencesUpdated(json.data.preferences);
        }
      }
      onClose();
    } catch (err) {
      console.error('[EVENT_PREF_MODAL] Erreur lors de la sauvegarde :', err);
      // Fermeture quand même avec les préférences locales appliquées
      if (onPreferencesUpdated) {
        onPreferencesUpdated(preferences);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-pref-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* En-tête */}
        <div className={styles.header}>
          <div className={styles.headerTitleRow}>
            <div className={styles.headerIconBox}>
              <Sliders size={20} />
            </div>
            <div>
              <h3 id="event-pref-modal-title" className={styles.title}>Préférences d&apos;événements</h3>
              <p className={styles.subtitle}>
                Choisissez les types de signaux et le périmètre à capter autour de votre restaurant.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fermer la modale"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className={styles.body}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, gap: 10, color: '#6B7280' }}>
              <Loader2 size={24} className="animate-spin" />
              <span>Chargement de vos préférences...</span>
            </div>
          ) : (
            <>
              {/* Section 1 : Types d'événements */}
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Types d&apos;événements autorisés</h4>
                <div className={styles.categoryList}>
                  {/* Sport & Matchs */}
                  <div className={styles.categoryItem}>
                    <div className={styles.categoryMeta}>
                      <div className={styles.categoryIcon} style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                        <Trophy size={18} />
                      </div>
                      <div>
                        <span className={styles.categoryLabel}>Sports & Matchs</span>
                        <span className={styles.categoryDesc}>
                          Football, rugby, basketball, tournois et grandes compétitions
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={preferences.categories.sport}
                      onClick={() => toggleCategory('sport')}
                      className={`${styles.switch} ${preferences.categories.sport ? styles.switchActive : ''}`}
                      aria-label="Activer ou désactiver les événements sportifs"
                    >
                      <span className={styles.switchKnob} />
                    </button>
                  </div>

                  {/* Concerts & Musique */}
                  <div className={styles.categoryItem}>
                    <div className={styles.categoryMeta}>
                      <div className={styles.categoryIcon} style={{ backgroundColor: '#F3E8FF', color: '#7E22CE' }}>
                        <Music size={18} />
                      </div>
                      <div>
                        <span className={styles.categoryLabel}>Concerts & Musique live</span>
                        <span className={styles.categoryDesc}>
                          Concerts, tournées d&apos;artistes, festivals et sessions musicales
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={preferences.categories.concert}
                      onClick={() => toggleCategory('concert')}
                      className={`${styles.switch} ${preferences.categories.concert ? styles.switchActive : ''}`}
                      aria-label="Activer ou désactiver les concerts"
                    >
                      <span className={styles.switchKnob} />
                    </button>
                  </div>

                  {/* Arts & Spectacles */}
                  <div className={styles.categoryItem}>
                    <div className={styles.categoryMeta}>
                      <div className={styles.categoryIcon} style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <span className={styles.categoryLabel}>Arts, Théâtre & Comédie</span>
                        <span className={styles.categoryDesc}>
                          Spectacles vivants, stand-up, musées et expositions
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={preferences.categories.arts}
                      onClick={() => toggleCategory('arts')}
                      className={`${styles.switch} ${preferences.categories.arts ? styles.switchActive : ''}`}
                      aria-label="Activer ou désactiver le théâtre et les arts"
                    >
                      <span className={styles.switchKnob} />
                    </button>
                  </div>

                  {/* Fêtes & Célébrations */}
                  <div className={styles.categoryItem}>
                    <div className={styles.categoryMeta}>
                      <div className={styles.categoryIcon} style={{ backgroundColor: '#FFEDD5', color: '#EA580C' }}>
                        <Calendar size={18} />
                      </div>
                      <div>
                        <span className={styles.categoryLabel}>Fêtes & Célébrations</span>
                        <span className={styles.categoryDesc}>
                          Halloween, Noël, Fête de la Musique et jours fériés nationaux
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={preferences.categories.holiday}
                      onClick={() => toggleCategory('holiday')}
                      className={`${styles.switch} ${preferences.categories.holiday ? styles.switchActive : ''}`}
                      aria-label="Activer ou désactiver les fêtes et célébrations"
                    >
                      <span className={styles.switchKnob} />
                    </button>
                  </div>

                  {/* Événements internes */}
                  <div className={styles.categoryItem}>
                    <div className={styles.categoryMeta}>
                      <div className={styles.categoryIcon} style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                        <Utensils size={18} />
                      </div>
                      <div>
                        <span className={styles.categoryLabel}>Événements de votre restaurant</span>
                        <span className={styles.categoryDesc}>
                          Vos propres soirées, dégustations et menus éphémères
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={preferences.categories.internal}
                      onClick={() => toggleCategory('internal')}
                      className={`${styles.switch} ${preferences.categories.internal ? styles.switchActive : ''}`}
                      aria-label="Activer ou désactiver vos événements internes"
                    >
                      <span className={styles.switchKnob} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2 : Rayon de détection */}
              <div className={styles.section}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color="#6B7280" />
                  <h4 className={styles.sectionTitle}>Périmètre de détection géographique</h4>
                </div>
                <div className={styles.radiusPills}>
                  {[
                    { km: 3, label: '3 km', hint: 'Piétons' },
                    { km: 5, label: '5 km', hint: 'Quartier' },
                    { km: 15, label: '15 km', hint: 'Agglomération' },
                    { km: 25, label: '25 km', hint: 'Grandes salles' },
                  ].map((item) => (
                    <button
                      key={item.km}
                      type="button"
                      onClick={() => handleSelectRadius(item.km)}
                      className={`${styles.radiusPill} ${
                        preferences.radiusKm === item.km ? styles.radiusPillActive : ''
                      }`}
                    >
                      <span className={styles.radiusVal}>{item.label}</span>
                      <span className={styles.radiusHint}>{item.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 3 : Mots-clés exclus */}
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Mots-clés ou thèmes à ignorer</h4>
                <div className={styles.keywordsBox}>
                  <form onSubmit={handleAddKeyword} className={styles.tagInputForm}>
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Ex: match amateur, jeune public..."
                      className={styles.tagInput}
                    />
                    <button type="submit" className={styles.addTagBtn}>
                      <Plus size={14} style={{ display: 'inline', marginRight: 4 }} />
                      Ajouter
                    </button>
                  </form>

                  {preferences.excludedKeywords && preferences.excludedKeywords.length > 0 && (
                    <div className={styles.tagsList}>
                      {preferences.excludedKeywords.map((kw) => (
                        <span key={kw} className={styles.tagBadge}>
                          {kw}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(kw)}
                            className={styles.removeTagBtn}
                            aria-label={`Supprimer le filtre ${kw}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pied de page */}
        <div className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={saving}>
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={styles.saveBtn}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Enregistrer les préférences</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
