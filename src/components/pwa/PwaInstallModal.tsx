'use client';

import React from 'react';
import { X, Smartphone, Share, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import styles from './PwaInstallModal.module.css';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIos: boolean;
}

export default function PwaInstallModal({ isOpen, onClose, isIos }: PwaInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className={styles.closeBtn}
          aria-label="Fermer"
        >
          <X size={16} />
        </button>

        <div className={styles.header}>
          <div className={styles.appIconBox}>
            <Smartphone size={26} />
          </div>
          <div className={styles.headerTexts}>
            <h3 className={styles.modalTitle}>Installer GetSpecial</h3>
            <p className={styles.modalSubtitle}>Sur l’écran d’accueil de votre appareil</p>
          </div>
        </div>

        {isIos ? (
          <div className={styles.stepsList}>
            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepContent}>
                <p className={styles.stepTitle}>
                  <span>Appuyez sur</span>
                  <span className={styles.iconHighlight}>
                    <Share size={12} style={{ marginRight: 4 }} /> Partager
                  </span>
                </p>
                <p className={styles.stepDesc}>Dans la barre de navigation en bas de Safari.</p>
              </div>
            </div>

            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepContent}>
                <p className={styles.stepTitle}>
                  <span>Sélectionnez</span>
                  <span className={styles.iconHighlight}>
                    <PlusSquare size={12} style={{ marginRight: 4 }} /> Sur l’écran d’accueil
                  </span>
                </p>
                <p className={styles.stepDesc}>Faites défiler le menu d’actions vers le bas.</p>
              </div>
            </div>

            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepContent}>
                <p className={styles.stepTitle}>
                  <span>Confirmez avec</span>
                  <span className={styles.iconHighlight}>Ajouter</span>
                </p>
                <p className={styles.stepDesc}>En haut à droite de votre écran.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.stepsList}>
            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepContent}>
                <p className={styles.stepTitle}>Ouvrez le menu du navigateur</p>
                <p className={styles.stepDesc}>Cliquez sur les 3 points verticaux (⋮) en haut à droite.</p>
              </div>
            </div>

            <div className={styles.stepItem}>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepContent}>
                <p className={styles.stepTitle}>Sélectionnez « Installer l’application »</p>
                <p className={styles.stepDesc}>Ou « Ajouter à l’écran d’accueil » pour créer l’icône GetSpecial.</p>
              </div>
            </div>
          </div>
        )}

        <div className={styles.benefitsBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#C2410C', marginBottom: 2 }}>
            <Sparkles size={14} />
            <span>Pourquoi installer l’application ?</span>
          </div>
          <div>Lancement instantané en plein écran, sans barre d’adresse de navigateur, et notifications d’opportunités en direct.</div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={styles.understoodBtn}
        >
          C’est compris !
        </button>
      </div>
    </div>
  );
}
