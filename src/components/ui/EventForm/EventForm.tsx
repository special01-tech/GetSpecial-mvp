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
import { useLanguage } from '@/i18n';
import styles from './EventForm.module.css';

interface EventFormProps {
  initialEvent?: RestaurantEvent | null;
  onSave: (event: RestaurantEvent) => void;
  onCancel: () => void;
}

export default function EventForm({ initialEvent, onSave, onCancel }: EventFormProps) {
  const { t } = useLanguage();
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
                {isEditing
                  ? t('common.components.eventForm.editTitle')
                  : t('common.components.eventForm.createTitle')}
              </h2>
              <p className={styles.subtitle}>
                {t('common.components.eventForm.subtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className={styles.closeBtn}
            aria-label={t('common.components.eventForm.closeAria')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.formBody}>
          {/* Titre */}
          <div className={styles.fieldGroup}>
            <label htmlFor="evtTitle" className={styles.label}>
              {t('common.components.eventForm.nameLabel')}
            </label>
            <input
              id="evtTitle"
              type="text"
              required
              placeholder={t('common.components.eventForm.namePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Catégorie */}
          <div className={styles.fieldGroup}>
            <label htmlFor="evtCategory" className={styles.label}>
              {t('common.components.eventForm.categoryLabel')}
            </label>
            <select
              id="evtCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className={styles.select}
            >
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {t(`common.eventCategories.${cat.id}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Heure */}
          <div className={styles.dateTimeGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="evtDate" className={styles.label}>
                {t('common.components.eventForm.dateLabel')}
              </label>
              <input
                id="evtDate"
                type="text"
                required
                placeholder={t('common.components.eventForm.datePlaceholder')}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="evtTime" className={styles.label}>
                {t('common.components.eventForm.timeLabel')}
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
              {t('common.components.eventForm.imageLabel')}
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
              {t('common.components.eventForm.descriptionLabel')}
            </label>
            <textarea
              id="evtDesc"
              rows={2}
              placeholder={t('common.components.eventForm.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
            />
          </div>

          {/* Toggle Actif */}
          <div className={styles.toggleRow}>
            <div>
              <span className={styles.toggleTitle}>
                {t('common.components.eventForm.activeToggleTitle')}
              </span>
              <p className={styles.toggleSubtitle}>
                {t('common.components.eventForm.activeToggleSubtitle')}
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
              {t('common.components.eventForm.cancel')}
            </button>
            <PrimaryButton type="submit" fullWidth={false}>
              {isEditing
                ? t('common.components.eventForm.saveChanges')
                : t('common.components.eventForm.addEvent')}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
