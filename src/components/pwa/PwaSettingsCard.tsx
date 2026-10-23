'use client';

import React from 'react';
import { Smartphone, Download, CheckCircle2, HelpCircle, Sparkles } from 'lucide-react';
import { usePwaInstall } from './usePwaInstall';
import PwaInstallModal from './PwaInstallModal';
import styles from './PwaSettingsCard.module.css';

export default function PwaSettingsCard() {
  const {
    isInstallable,
    isInstalled,
    isIos,
    isStandalone,
    canPromptNative,
    promptInstall,
    showIosGuide,
    setShowIosGuide,
    resetBannerDismiss,
  } = usePwaInstall();

  return (
    <>
      <div className={styles.cardRow}>
        <div>
          <div className={styles.rowLabel}>
            <Smartphone size={18} color="#FF5A00" />
            <span>Statut de l’application sur cet appareil</span>
          </div>
          <div className={styles.rowDescription}>
            {isStandalone || isInstalled
              ? 'L’application GetSpecial est installée en mode autonome. Vous profitez d’un affichage plein écran et d’un accès instantané.'
              : 'Installez GetSpecial comme une application native pour accéder à votre tableau de bord sans passer par le navigateur.'}
          </div>
        </div>

        <div>
          {isStandalone || isInstalled ? (
            <span className={styles.badgeInstalled}>
              <CheckCircle2 size={15} />
              <span>Installée sur cet appareil</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => promptInstall()}
              className={styles.installActionBtn}
            >
              <Download size={15} />
              <span>Installer l’application</span>
            </button>
          )}
        </div>
      </div>

      {!isStandalone && !isInstalled && (
        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>
              <HelpCircle size={17} color="#64748B" />
              <span>Guide d’installation manuel (iPhone, iPad, Safari)</span>
            </div>
            <div className={styles.rowDescription}>
              Si le bouton d’installation automatique ne réagit pas, suivez les instructions pas-à-pas pour ajouter l’icône GetSpecial à votre écran d’accueil.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowIosGuide(true)}
              className={styles.guideBtn}
            >
              Voir les étapes
            </button>
            <button
              type="button"
              onClick={() => {
                resetBannerDismiss();
                alert('La bannière d’installation réapparaîtra en haut du tableau de bord !');
              }}
              className={styles.guideBtn}
              title="Réactiver le bandeau du dashboard"
            >
              Réactiver le bandeau Dashboard
            </button>
          </div>
        </div>
      )}

      <PwaInstallModal
        isOpen={showIosGuide}
        onClose={() => setShowIosGuide(false)}
        isIos={isIos}
      />
    </>
  );
}
