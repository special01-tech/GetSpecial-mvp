'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Calendar,
  Clock,
  Image as ImageIcon,
  Tag,
  Check,
} from 'lucide-react';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import {
  RestaurantEvent,
  EventCategory,
  EVENT_CATEGORIES,
} from '@/services/restaurant/restaurant-events.data';
import styles from './EventForm.module.css';

interface EventFormProps {
  initialEvent?: RestaurantEvent | null;
  onSave: (event: RestaurantEvent) => void;
  onCancel: () => void;
}

export default function EventForm({ initialEvent, onSave, onCancel }: EventFormProps) {
  const isEditing = Boolean(initialEvent);

  const [title, setTitle] = useState(initialEvent?.title || '');
  const [date, setDate] = useState(initialEvent?.date || '2026-10-02');
  const [time, setTime] = useState(initialEvent?.time || '20:30');
  const [category, setCategory] = useState<EventCategory>(
    initialEvent?.category || 'concert'
  );
  const [imageUrl, setImageUrl] = useState(
    initialEvent?.imageUrl ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
  );
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [isActive, setIsActive] = useState(initialEvent ? initialEvent.isActive : true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim()) return;

    const eventToSave: RestaurantEvent = {
      id: initialEvent ? initialEvent.id : `evt_${Date.now()}`,
      title: title.trim(),
      date: date.trim(),
      time: time.trim() || undefined,
      category,
      imageUrl: imageUrl.trim() || undefined,
      description: description.trim() || undefined,
      isActive,
    };

    onSave(eventToSave);
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleRow}>
            <div className={styles.iconCircle}>
              {isEditing ? <Edit2 size={18} /> : <Plus size={18} />}
            </div>
            <div>
              <h2 className={styles.title}>
                {isEditing ? 'Modifier l’événement' : 'Nouvel événement local'}
              </h2>
              <p className={styles.subtitle}>
                Permet à l&apos;IA d&apos;anticiper l&apos;affluence de votre quartier
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className={styles.closeBtn}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.formBody}>
          {/* Titre */}
          <div className={styles.fieldGroup}>
            <label htmlFor="evtTitle" className={styles.label}>
              Nom de l&apos;événement *
            </label>
            <input
              id="evtTitle"
              type="text"
              required
              placeholder="Ex : Concert Live Jazz ou Match PSG"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Catégorie */}
          <div className={styles.fieldGroup}>
            <label htmlFor="evtCategory" className={styles.label}>
              Catégorie *
            </label>
            <select
              id="evtCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className={styles.select}
            >
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Heure */}
          <div className={styles.dateTimeGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="evtDate" className={styles.label}>
                Date *
              </label>
              <input
                id="evtDate"
                type="text"
                required
                placeholder="Ex : Vendredi 2 Oct. 2026"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="evtTime" className={styles.label}>
                Heure
              </label>
              <input
                id="evtTime"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Image */}
          <div className={styles.fieldGroup}>
            <label htmlFor="evtImage" className={styles.label}>
              Illustration (URL)
            </label>
            <div className={styles.inputWithIcon}>
              <ImageIcon size={14} className={styles.inputIcon} />
              <input
                id="evtImage"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Description */}
          <div className={styles.fieldGroup}>
            <label htmlFor="evtDesc" className={styles.label}>
              Description / Précisions
            </label>
            <textarea
              id="evtDesc"
              rows={2}
              placeholder="Détails pour calibrer les offres spéciales..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
            />
          </div>

          {/* Toggle Actif */}
          <div className={styles.toggleRow}>
            <div>
              <span className={styles.toggleTitle}>Événement actif</span>
              <p className={styles.toggleSubtitle}>
                Prendre en compte dans les propositions IA du dashboard
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`${styles.switchBtn} ${isActive ? styles.switchOn : styles.switchOff}`}
              aria-pressed={isActive}
            >
              <span className={styles.switchHandle} />
            </button>
          </div>

          {/* Modal Footer */}
          <div className={styles.modalFooter}>
            <button type="button" onClick={onCancel} className={styles.cancelBtn}>
              Annuler
            </button>
            <PrimaryButton type="submit" fullWidth={false}>
              {isEditing ? 'Enregistrer les modifications' : 'Ajouter l’événement'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
