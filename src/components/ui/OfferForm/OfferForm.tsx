'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Percent,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import { RestaurantOffer, OfferStatus } from '@/services/restaurant/restaurant-offers.data';
import { PlatformType } from '@/services/planning/planning.data';
import { useLanguage } from '@/i18n';
import styles from './OfferForm.module.css';

interface OfferFormProps {
  initialOffer?: RestaurantOffer | null;
  onSave: (offer: RestaurantOffer) => void;
  onCancel: () => void;
}

const AVAILABLE_PLATFORMS: { id: PlatformType; name: string }[] = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'google_business', name: 'Google Business' },
];

export default function OfferForm({ initialOffer, onSave, onCancel }: OfferFormProps) {
  const { t } = useLanguage();
  const isEditing = Boolean(initialOffer);

  const [title, setTitle] = useState(initialOffer?.name || '');
  const [description, setDescription] = useState(initialOffer?.description || '');
  const [discount, setDiscount] = useState(initialOffer?.discount || '-20%');
  const [image, setImage] = useState(
    initialOffer?.image ||
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
  );
  const [period, setPeriod] = useState(initialOffer?.period || 'Du Lundi au Vendredi • 12h00 - 14h30');
  const [status, setStatus] = useState<OfferStatus>(initialOffer?.status || 'active');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(
    initialOffer?.platforms || ['instagram', 'facebook']
  );

  useEffect(() => {
    if (initialOffer) {
      setTitle(initialOffer.name);
      setDescription(initialOffer.description);
      setDiscount(initialOffer.discount);
      setImage(initialOffer.image);
      setPeriod(initialOffer.period);
      setStatus(initialOffer.status);
      setSelectedPlatforms(initialOffer.platforms);
    }
  }, [initialOffer]);

  const togglePlatform = (plat: PlatformType) => {
    setSelectedPlatforms((prev) =>
      prev.includes(plat) ? prev.filter((p) => p !== plat) : [...prev, plat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const offerToSave: RestaurantOffer = {
      id: initialOffer ? initialOffer.id : `off_${Date.now()}`,
      name: title.trim(),
      description: description.trim(),
      image,
      discount: discount.trim(),
      period: period.trim() || 'Service régulier',
      status,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['instagram'],
    };

    onSave(offerToSave);
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
                {isEditing ? 'Modifier l’offre principale' : 'Ajouter une offre principale'}
              </h2>
              <p className={styles.subtitle}>
                {isEditing
                  ? 'Ajustez les détails et conditions de cette formule.'
                  : 'Définissez une formule ou réduction phare de votre restaurant.'}
              </p>
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
              Nom de la formule ou de l’offre
            </label>
            <input
              id="offerTitle"
              type="text"
              required
              placeholder="Ex: Formule Déjeuner Express, Happy Hour Tapas..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Réduction / Prix */}
          <div className={styles.fieldGroup}>
            <label htmlFor="offerDiscount" className={styles.label}>
              Tarif ou Réduction affichée
            </label>
            <div className={styles.inputWithIcon}>
              <Percent size={14} className={styles.inputIcon} />
              <input
                id="offerDiscount"
                type="text"
                required
                placeholder="Ex: 16,50 €, -20%, 8 € le cocktail..."
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
              placeholder="Détaillez ce qui est inclus dans cette offre..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
            />
          </div>

          {/* Période / Horaires */}
          <div className={styles.fieldGroup}>
            <label htmlFor="offerPeriod" className={styles.label}>
              Période ou Horaires d’application
            </label>
            <input
              id="offerPeriod"
              type="text"
              required
              placeholder="Ex: Du Lundi au Vendredi • 12h00 - 14h30"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={styles.input}
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

          {/* Statut */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Statut de l’offre</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OfferStatus)}
              className={styles.input}
            >
              <option value="active">Active (mise en avant immédiate)</option>
              <option value="scheduled">Programmée</option>
              <option value="draft">Brouillon / En pause</option>
            </select>
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
              {isEditing ? 'Enregistrer les modifications' : t('common.components.offerForm.save')}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
