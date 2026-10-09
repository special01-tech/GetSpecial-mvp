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

        {/* Corps de la modale — Disposition ordonnée avec labels en haut de chaque section */}
        <div className={styles.modalBody}>
          {/* SECTION 1 : CONTEXTE & ANALYSE */}
          <section className={styles.section}>
            <span className={styles.sectionLabel}>01 • CONTEXTE & SIGNAL DU JOUR</span>
            <div className={styles.contextBox}>
              <p className={styles.descriptionText}>{opportunity.description}</p>
              {opportunity.signalOrigin && (
                <div className={styles.signalRow}>
                  <Radio size={13} className={styles.signalIcon} />
                  <span>
                    <strong>Détecté aujourd’hui :</strong> {opportunity.signalOrigin}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 2 : FORMULE PROPOSÉE EN SALLE (L'offre au centre, modifiable par le gérant) */}
          <section className={styles.section}>
            <div className={styles.sectionHeaderRow}>
              <span className={styles.sectionLabel}>02 • FORMULE PROPOSÉE AUX CLIENTS</span>
              {!isEditingOffer && (
                <button
                  type="button"
                  className={styles.editOfferToggleBtn}
                  onClick={() => setIsEditingOffer(true)}
                  title="Modifier l’intitulé ou la composition de cette formule"
                >
                  <Pencil size={12} />
                  <span>Modifier l’offre</span>
                </button>
              )}
            </div>

            {isEditingOffer ? (
              /* Formulaire d'édition de l'offre */
              <form onSubmit={handleSaveOfferEdit} className={styles.editOfferForm}>
                <div className={styles.editFormGroup}>
                  <label className={styles.editFormLabel}>Nom de la formule</label>
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className={styles.editFormInput}
                    placeholder="Ex: Formule Fan Zone : Burger Charolais & Pinte IPA"
                    required
                  />
                </div>

                <div className={styles.editFormGroup}>
                  <label className={styles.editFormLabel}>Composition & Ce qui est servi</label>
                  <textarea
                    value={editDetails}
                    onChange={(e) => setEditDetails(e.target.value)}
                    className={styles.editFormTextarea}
                    rows={2}
                    placeholder="Ex: 1 Burger charolais maison + 1 pinte de bière artisanale..."
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
                      placeholder="Ex: Ce soir de 18h30 à 20h15 uniquement"
                    />
                  </div>

                  <div className={styles.editFormGroup} style={{ flex: 1 }}>
                    <label className={styles.editFormLabel}>Code oral comptoir</label>
                    <input
                      type="text"
                      value={editCodeWord}
                      onChange={(e) => setEditCodeWord(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      className={styles.editFormInput}
                      maxLength={10}
                      placeholder="MATCH15"
                    />
                  </div>
                </div>

                <div className={styles.editFormActions}>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className={styles.editCancelBtn}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className={styles.editSaveBtn}
                  >
                    <Check size={14} />
                    <span>Enregistrer la formule</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Affichage de l'offre avec indication de sauvegarde */
              <div className={styles.offerCard}>
                <div className={styles.offerCardHeader}>
                  <h3 className={styles.offerLabel}>
                    {opportunity.offer?.label || opportunity.title}
                  </h3>
                  {hasSavedEdit && (
                    <span className={styles.savedBadge}>
                      <Check size={11} /> Modifiée
                    </span>
                  )}
                </div>

                <p className={styles.offerDetails}>
                  {opportunity.offer?.details || opportunity.description}
                </p>

                <div className={styles.offerFooter}>
                  {(opportunity.offer?.validityText || editValidity) && (
                    <div className={styles.validityGroup}>
                      <Clock size={13} />
                      <span>{opportunity.offer?.validityText || editValidity}</span>
                    </div>
                  )}

                  {/* Mot-code oral : présenté sobrement comme outil d'encaissement/comptoir */}
                  {displayCodeWord && (
                    <div className={styles.counterToolSnippet}>
                      <span className={styles.counterToolLabel}>Code oral au comptoir :</span>
                      <span className={styles.counterToolCode}>{displayCodeWord}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* SECTION 3 : POURQUOI CETTE ACTION (Points clés de rentabilité/service) */}
          <section className={styles.section}>
            <span className={styles.sectionLabel}>03 • POURQUOI ÇA FONCTIONNE</span>
            <div className={styles.reasonsList}>
              {reasons.slice(0, 3).map((reason, idx) => (
                <div key={idx} className={styles.reasonCard}>
                  <div className={styles.checkIconWrapper}>
                    <Check size={13} strokeWidth={2.5} />
                  </div>
                  <p className={styles.reasonText}>{reason}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4 : CANAUX & TIMING DE DIFFUSION */}
          <section className={styles.section}>
            <span className={styles.sectionLabel}>04 • DIFFUSION CONSEILLÉE</span>
            <div className={styles.distributionBox}>
              <div className={styles.channelsGroup}>
                <Share2 size={14} className={styles.distribIcon} />
                <span className={styles.distribLabel}>Réseaux ciblés :</span>
                <div className={styles.channelNames}>
                  {channels.map((chan, idx) => (
                    <span key={idx} className={styles.channelItem}>
                      {chan}
                      {idx < channels.length - 1 ? ' • ' : ''}
                    </span>
                  ))}
                </div>
              </div>

              {opportunity.distribution?.recommendedPublishTime && (
                <div className={styles.publishTiming}>
                  <Clock size={13} />
                  <span>
                    Publier à <strong>{opportunity.distribution.recommendedPublishTime}</strong>
                    {opportunity.distribution.publishTimingReason && (
                      <span className={styles.timingReasonText}>
                        {' '}— {opportunity.distribution.publishTimingReason}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
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
