'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Tag,
  Percent,
  Calendar,
  Clock,
  Image as ImageIcon,
  Share2,
  Check,
  Plus,
} from 'lucide-react';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import { RestaurantOffer, OfferStatus } from '@/services/restaurant/restaurant-offers.data';
import { PlatformType } from '@/services/planning/planning.data';
import { useLanguage } from '@/i18n';
import styles from './OfferForm.module.css';

interface OfferFormProps {
  onSave: (newOffer: RestaurantOffer) => void;
  onCancel: () => void;
}

const AVAILABLE_PLATFORMS: { id: PlatformType; name: string }[] = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'google_business', name: 'Google Business' },
];

export default function OfferForm({ onSave, onCancel }: OfferFormProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState('-20%');
  const [image, setImage] = useState(
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
  );
  const [date, setDate] = useState('2026-09-30');
  const [time, setTime] = useState('18:00');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([
    'instagram',
    'facebook',
  ]);

  const togglePlatform = (plat: PlatformType) => {
    setSelectedPlatforms((prev) =>
      prev.includes(plat) ? prev.filter((p) => p !== plat) : [...prev, plat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newOffer: RestaurantOffer = {
      id: `off_${Date.now()}`,
      name: title.trim(),
      description: description.trim(),
      image,
      discount: discount.trim(),
      period: t('common.components.offerForm.period', { date, time }),
      date,
      time,
      status: 'scheduled',
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['instagram'],
    };

    onSave(newOffer);
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleRow}>
            <div className={styles.iconCircle}>
              <Plus size={18} />
            </div>
            <div>
              <h2 className={styles.title}>{t('common.components.offerForm.title')}</h2>
              <p className={styles.subtitle}>{t('common.components.offerForm.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className={styles.closeBtn}
            aria-label={t('common.components.offerForm.closeAria')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.formBody}>
          {/* Titre */}
          <div className={styles.fieldGroup}>
            <label htmlFor="offerTitle" className={styles.label}>
              {t('common.components.offerForm.offerTitleLabel')}
            </label>
            <input
              id="offerTitle"
              type="text"
              required
              placeholder={t('common.components.offerForm.offerTitlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Réduction */}
          <div className={styles.fieldGroup}>
            <label htmlFor="offerDiscount" className={styles.label}>
              {t('common.components.offerForm.discountLabel')}
            </label>
            <div className={styles.inputWithIcon}>
              <Percent size={14} className={styles.inputIcon} />
              <input
                id="offerDiscount"
                type="text"
                required
                placeholder={t('common.components.offerForm.discountPlaceholder')}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Description */}
          <div className={styles.fieldGroup}>
            <label htmlFor="offerDesc" className={styles.label}>
              {t('common.components.offerForm.descriptionLabel')}
            </label>
            <textarea
              id="offerDesc"
              required
              rows={3}
              placeholder={t('common.components.offerForm.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
            />
          </div>

          {/* Image URL */}
          <div className={styles.fieldGroup}>
            <label htmlFor="offerImage" className={styles.label}>
              {t('common.components.offerForm.imageLabel')}
            </label>
            <div className={styles.inputWithIcon}>
              <ImageIcon size={14} className={styles.inputIcon} />
              <input
                id="offerImage"
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Date & Heure */}
          <div className={styles.dateTimeGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="offerDate" className={styles.label}>
                {t('common.components.offerForm.activationDateLabel')}
              </label>
              <input
                id="offerDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="offerTime" className={styles.label}>
                {t('common.components.offerForm.startTimeLabel')}
              </label>
              <input
                id="offerTime"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Plateformes cibles */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>{t('common.components.offerForm.platformsLabel')}</label>
            <div className={styles.platformsSelectGrid}>
              {AVAILABLE_PLATFORMS.map((plat) => {
                const isSelected = selectedPlatforms.includes(plat.id);
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => togglePlatform(plat.id)}
                    className={`${styles.platformSelectBtn} ${
                      isSelected ? styles.platformBtnActive : ''
                    }`}
                  >
                    <div className={styles.checkboxSquare}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span>{plat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelBtn}
            >
              {t('common.components.offerForm.cancel')}
            </button>
            <PrimaryButton type="submit" fullWidth={false}>
              {t('common.components.offerForm.save')}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
