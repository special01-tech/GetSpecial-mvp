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
      period: `Le ${date} à partir de ${time}`,
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
              <h2 className={styles.title}>Nouvelle offre spéciale</h2>
              <p className={styles.subtitle}>Créez et ciblez votre promotion</p>
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
            <label htmlFor="offerTitle" className={styles.label}>
              Titre de l&apos;offre *
            </label>
            <input
              id="offerTitle"
              type="text"
              required
              placeholder="Ex : Burgers Gourmet -30%"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Réduction */}
          <div className={styles.fieldGroup}>
            <label htmlFor="offerDiscount" className={styles.label}>
              Réduction ou Avantage *
            </label>
            <div className={styles.inputWithIcon}>
              <Percent size={14} className={styles.inputIcon} />
              <input
                id="offerDiscount"
                type="text"
                required
                placeholder="Ex : -30% ou 1 acheté = 1 offert"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Description */}
          <div className={styles.fieldGroup}>
            <label htmlFor="offerDesc" className={styles.label}>
              Description *
            </label>
            <textarea
              id="offerDesc"
              required
              rows={3}
              placeholder="Détaillez les conditions (ex : valable sur place pour le match)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
            />
          </div>

          {/* Image URL */}
          <div className={styles.fieldGroup}>
            <label htmlFor="offerImage" className={styles.label}>
              Lien de l&apos;image d&apos;illustration
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
                Date d&apos;activation
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
                Heure de début
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
            <label className={styles.label}>Plateformes de diffusion</label>
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
              Annuler
            </button>
            <PrimaryButton type="submit" fullWidth={false}>
              Enregistrer l&apos;offre
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
