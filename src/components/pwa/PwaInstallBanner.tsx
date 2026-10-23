'use client';

import React from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { usePwaInstall } from './usePwaInstall';
import PwaInstallModal from './PwaInstallModal';
import styles from './PwaInstallBanner.module.css';

export default function PwaInstallBanner() {
  const {
    isMounted,
    isInstalled,
    isIos,
    isStandalone,
    bannerDismissed,
    dismissBanner,
    promptInstall,
    showIosGuide,
    setShowIosGuide,
  } = usePwaInstall();

  // Attendre le montage client pour éviter les décalages d'hydratation
  if (!isMounted) return null;

  // Ne pas afficher si l'application est déjà installée en mode standalone ou si fermée par l'utilisateur
  if (isStandalone || isInstalled || bannerDismissed) {
    return (
      <PwaInstallModal
        isOpen={showIosGuide}
        onClose={() => setShowIosGuide(false)}
        isIos={isIos}
      />
    );
  }

  return (
    <>
      <div className={styles.bannerWrapper} role="banner" aria-label="Installer GetSpecial">
        <div className={styles.bannerLeft}>
          <div className={styles.iconCircle}>
            <Smartphone size={22} />
          </div>
          <div className={styles.textGroup}>
            <div className={styles.titleRow}>
              <h2 className={styles.bannerTitle}>Installer l’application GetSpecial</h2>
              <span className={styles.pwaBadge}>PWA Mobile</span>
            </div>
            <p className={styles.bannerSubtitle}>
              Accédez à vos signaux et créez vos posts en 1 tap depuis votre écran d’accueil.
            </p>
          </div>
        </div>

        <div className={styles.bannerRight}>
          <button
            type="button"
            onClick={() => promptInstall()}
            className={styles.installBtn}
          >
            <Download size={15} />
            <span>Installer l’app</span>
          </button>
          <button
            type="button"
            onClick={dismissBanner}
            className={styles.dismissBtn}
            title="Masquer cette bannière"
            aria-label="Masquer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <PwaInstallModal
        isOpen={showIosGuide}
        onClose={() => setShowIosGuide(false)}
        isIos={isIos}
      />
    </>
  );
}
