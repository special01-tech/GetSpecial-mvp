'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  ArrowRight,
  Radio,
  Check,
  Share2,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { TodayOpportunity } from '@/services/today/today.data';
import styles from './OpportunityDetailModal.module.css';

interface OpportunityDetailModalProps {
  opportunity: TodayOpportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onProceed: (opp: TodayOpportunity) => void;
  onUpdateOpportunity?: (opp: TodayOpportunity) => void;
}

export default function OpportunityDetailModal({
  opportunity,
  isOpen,
  onClose,
  onProceed,
  onUpdateOpportunity,
}: OpportunityDetailModalProps) {
  // États d'édition personnalisée de l'offre
  const [isEditingOffer, setIsEditingOffer] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [editValidity, setEditValidity] = useState('');
  const [editCodeWord, setEditCodeWord] = useState('');
  const [hasSavedEdit, setHasSavedEdit] = useState(false);

  // Synchronisation lors de l'ouverture d'une nouvelle opportunité
  useEffect(() => {
    if (opportunity) {
      setEditLabel(opportunity.offer?.label || opportunity.title);
      setEditDetails(opportunity.offer?.details || opportunity.description);
      setEditValidity(opportunity.offer?.validityText || 'Aujourd’hui pendant les heures de service');
      setEditCodeWord(opportunity.codeWord || opportunity.offer?.codeWord || 'SPECIAL');
      setIsEditingOffer(false);
      setHasSavedEdit(false);
    }
  }, [opportunity]);

  // Fermeture par la touche Escape
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

  if (!isOpen || !opportunity) return null;

  const importance = opportunity.importance || 'HIGH';
  const score = opportunity.impactScore || (importance === 'HIGH' ? 92 : importance === 'MEDIUM' ? 78 : 65);

  const getCategoryLabel = () => {
    switch (opportunity.category) {
      case 'LOCAL_EVENT':
        return 'ÉVÉNEMENT LOCAL';
      case 'WEATHER_BOOST':
        return 'MÉTÉO & TERRASSE';
      case 'EMPTY_SLOT':
        return 'CRÉNEAU CALME';
      case 'OFFER_PROMOTION':
        return 'OFFRE DU RESTAURANT';
      default:
        return 'ACTION COMMERCIALE';
    }
  };

  const getDotClass = () => {
    if (importance === 'HIGH' || score >= 85) return styles.dotHigh;
    if (importance === 'MEDIUM' || score >= 70) return styles.dotMedium;
    return styles.dotModerate;
  };

  const getStrengthWord = () => {
    if (importance === 'HIGH' || score >= 85) return 'Impact fort';
    if (importance === 'MEDIUM' || score >= 70) return 'Impact modéré';
    return 'Opportunité d’appoint';
  };

  const reasons = Array.isArray(opportunity.reasons) && opportunity.reasons.length > 0
    ? opportunity.reasons
    : Array.isArray(opportunity.verifiedFacts) && opportunity.verifiedFacts.length > 0
    ? opportunity.verifiedFacts
    : [opportunity.signalOrigin || 'Action alignée sur les signaux observés ce jour.'];

  const channels = opportunity.distribution?.channels && opportunity.distribution.channels.length > 0
    ? opportunity.distribution.channels.map((c) =>
        c === 'INSTAGRAM' ? 'Instagram' : c === 'FACEBOOK' ? 'Facebook' : 'Google Business'
      )
    : ['Instagram', 'Facebook'];

  // Sauvegarde des modifications de l'offre
  const handleSaveOfferEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedOpp: TodayOpportunity = {
      ...opportunity,
      title: editLabel.trim() || opportunity.title,
      offer: {
        label: editLabel.trim() || (opportunity.offer?.label ?? 'Formule Privilège'),
        details: editDetails.trim() || (opportunity.offer?.details ?? 'Spécialité maison'),
        validityText: editValidity.trim() || (opportunity.offer?.validityText ?? 'Aujourd’hui'),
        codeWord: editCodeWord.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'SPECIAL',
      },
      codeWord: editCodeWord.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'SPECIAL',
    };

    if (onUpdateOpportunity) {
      onUpdateOpportunity(updatedOpp);
    }
    setIsEditingOffer(false);
    setHasSavedEdit(true);
  };

  // Annulation de l'édition
  const handleCancelEdit = () => {
    if (opportunity) {
      setEditLabel(opportunity.offer?.label || opportunity.title);
      setEditDetails(opportunity.offer?.details || opportunity.description);
      setEditValidity(opportunity.offer?.validityText || 'Aujourd’hui');
      setEditCodeWord(opportunity.codeWord || opportunity.offer?.codeWord || 'SPECIAL');
    }
    setIsEditingOffer(false);
  };

  const displayCodeWord = opportunity.codeWord || opportunity.offer?.codeWord || editCodeWord;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-opportunity-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* En-tête épuré — ZÉRO BADGE, typographie claire */}
        <header className={styles.modalHeader}>
          <div className={styles.headerTop}>
            <span className={styles.categorySupertitle}>
              {getCategoryLabel()}
            </span>

            <div className={styles.headerRight}>
              <div className={styles.strengthIndicator} title={`Pertinence évaluée : ${score}/100`}>
                <span className={`${styles.subtleDot} ${getDotClass()}`} />
                <span className={styles.strengthText}>{getStrengthWord()}</span>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Fermer la vue détaillée"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <h2 id="modal-opportunity-title" className={styles.modalTitle}>
            {opportunity.title}
          </h2>
        </header>

        {/* Corps de la modale — EXACTEMENT 2 BLOCS ULTRA-SIMPLES À LIRE */}
        <div className={styles.modalBody}>
          {/* BLOC 1 : OPPORTUNITÉ & POURQUOI */}
          <section className={styles.section}>
            <span className={styles.sectionLabel}>01 • L&apos;OPPORTUNITÉ &amp; POURQUOI</span>
            <div className={styles.contextBox}>
              <p className={styles.descriptionText} style={{ margin: 0, fontSize: '0.92rem', lineHeight: '1.45', color: '#1F2937' }}>
                {opportunity.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                {opportunity.signalOrigin && (
                  <span style={{ fontSize: '0.8rem', background: '#F3F4F6', color: '#4B5563', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Radio size={11} color="#FF5A00" />
                    <strong>Signal :</strong> {opportunity.signalOrigin}
                  </span>
                )}
                {reasons[0] && (
                  <span style={{ fontSize: '0.8rem', background: '#ECFDF5', color: '#047857', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Check size={11} strokeWidth={2.5} />
                    {reasons[0]}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* BLOC 2 : LE PLAT À PROMOUVOIR, HEURE & RÉSEAUX */}
          <section className={styles.section}>
            <div className={styles.sectionHeaderRow}>
              <span className={styles.sectionLabel}>02 • LE PLAT À PROMOUVOIR &amp; DIFFUSION</span>
              {!isEditingOffer && (
                <button
                  type="button"
                  className={styles.editOfferToggleBtn}
                  onClick={() => setIsEditingOffer(true)}
                  title="Modifier l’intitulé ou la composition de cette formule"
                >
                  <Pencil size={12} />
                  <span>Modifier</span>
                </button>
              )}
            </div>

            {isEditingOffer ? (
              /* Formulaire d'édition rapide */
              <form onSubmit={handleSaveOfferEdit} className={styles.editOfferForm}>
                <div className={styles.editFormGroup}>
                  <label className={styles.editFormLabel}>Plat / Formule</label>
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className={styles.editFormInput}
                    placeholder="Ex: Formule Soleil : Plat du jour + Dessert"
                    required
                  />
                </div>
                <div className={styles.editFormGroup}>
                  <label className={styles.editFormLabel}>Composition</label>
                  <textarea
                    value={editDetails}
                    onChange={(e) => setEditDetails(e.target.value)}
                    className={styles.editFormTextarea}
                    rows={2}
                    placeholder="Ex: Plat du jour du chef + Dessert maison..."
                    required
                  />
                </div>
                <div className={styles.editFormRow}>
                  <div className={styles.editFormGroup} style={{ flex: 1.4 }}>
                    <label className={styles.editFormLabel}>Créneau de validité</label>
                    <input
                      type="text"
                      value={editValidity}
                      onChange={(e) => setEditValidity(e.target.value)}
                      className={styles.editFormInput}
                      placeholder="Ex: Aujourd'hui de 12h à 14h uniquement"
                    />
                  </div>
                  <div className={styles.editFormGroup} style={{ flex: 1 }}>
                    <label className={styles.editFormLabel}>Code comptoir</label>
                    <input
                      type="text"
                      value={editCodeWord}
                      onChange={(e) => setEditCodeWord(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      className={styles.editFormInput}
                      maxLength={10}
                      placeholder="SOLEIL19"
                    />
                  </div>
                </div>
                <div className={styles.editFormActions}>
                  <button type="button" onClick={handleCancelEdit} className={styles.editCancelBtn}>
                    Annuler
                  </button>
                  <button type="submit" className={styles.editSaveBtn}>
                    <Check size={14} />
                    <span>Enregistrer</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Affichage compact et direct du plat avec heure & réseaux */
              <div className={styles.offerCard}>
                <div className={styles.offerCardHeader}>
                  <h3 className={styles.offerLabel} style={{ fontSize: '1.05rem', margin: 0 }}>
                    {opportunity.offer?.label || opportunity.title}
                  </h3>
                  {hasSavedEdit && (
                    <span className={styles.savedBadge}>
                      <Check size={11} /> Modifiée
                    </span>
                  )}
                </div>

                <p className={styles.offerDetails} style={{ margin: '4px 0 10px 0', fontSize: '0.88rem', color: '#4B5563' }}>
                  {opportunity.offer?.details || opportunity.description}
                </p>

                {/* Métadonnées essentielles : Heure, Réseaux, Durée & Code oral */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', paddingTop: '10px', borderTop: '1px solid #F3F4F6' }}>
                  {/* Heure de publication recommandée */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#374151' }}>
                    <Clock size={13} color="#FF5A00" />
                    <span>
                      Publication : <strong>{opportunity.distribution?.recommendedPublishTime || '11:30'}</strong>
                    </span>
                  </div>

                  {/* Réseaux de diffusion */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#374151' }}>
                    <Share2 size={13} color="#0284C7" />
                    <span>
                      Réseaux : <strong>{channels.join(', ')}</strong>
                    </span>
                  </div>

                  {/* Créneau de validité */}
                  {(opportunity.offer?.validityText || editValidity) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#374151' }}>
                      <span style={{ color: '#059669', fontWeight: 600 }}>●</span>
                      <span>{opportunity.offer?.validityText || editValidity}</span>
                    </div>
                  )}

                  {/* Code oral au comptoir */}
                  {displayCodeWord && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#374151' }}>
                      <span style={{ color: '#9CA3AF' }}>Code :</span>
                      <strong style={{ background: '#FFF7ED', color: '#EA580C', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                        {displayCodeWord}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Pied de page épuré avec bouton d'action fort */}
        <footer className={styles.modalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Fermer
          </button>
          <button
            type="button"
            className={styles.proceedBtn}
            onClick={() => onProceed(opportunity)}
          >
            <span>Lancer cette action</span>
            <ArrowRight size={15} />
          </button>
        </footer>
      </div>
    </div>
  );
}
