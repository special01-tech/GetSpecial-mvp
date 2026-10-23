'use client';

import { useState, useEffect, useCallback } from 'react';

// Type pour l'événement beforeinstallprompt du standard W3C
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

// Enregistrement global unique de l'événement pour ne jamais le manquer entre les pages
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((listener) => listener(globalDeferredPrompt));
    console.info('[PWA] Événement beforeinstallprompt capturé.');
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    promptListeners.forEach((listener) => listener(null));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gs_pwa_installed', 'true');
    }
    console.info('[PWA] Application installée.');
  });
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Détection de l'OS iOS (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // Détection du mode standalone (application déjà installée)
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      localStorage.getItem('gs_pwa_installed') === 'true';

    setIsStandalone(standaloneMode);
    setIsInstalled(standaloneMode);

    // Vérification si la bannière a été fermée
    const dismissed = localStorage.getItem('gs_pwa_banner_dismissed') === 'true';
    setBannerDismissed(dismissed);
    setIsMounted(true);

    // Abonnement aux mises à jour du prompt
    const updateListener = (p: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(p);
    };
    promptListeners.add(updateListener);

    return () => {
      promptListeners.delete(updateListener);
    };
  }, []);

  // Déclencher l'installation
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (isStandalone) {
      return false;
    }

    // Cas 1 : Navigateur compatible avec beforeinstallprompt (Android / Chrome / Edge)
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          localStorage.setItem('gs_pwa_installed', 'true');
          setDeferredPrompt(null);
          globalDeferredPrompt = null;
          return true;
        }
      } catch (err) {
        console.warn('[PWA] Erreur lors du déclenchement du prompt :', err);
      }
      return false;
    }

    // Cas 2 : iOS Safari ou navigateur sans prompt natif -> modale explicative
    setShowIosGuide(true);
    return false;
  }, [deferredPrompt, isStandalone]);

  // Fermer la bannière du dashboard
  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gs_pwa_banner_dismissed', 'true');
    }
  }, []);

  // Réinitialiser le masquage (utilisé pour les tests ou depuis les Paramètres)
  const resetBannerDismiss = useCallback(() => {
    setBannerDismissed(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('gs_pwa_banner_dismissed');
    }
  }, []);

  const isInstallable = !isStandalone && (Boolean(deferredPrompt) || isIos || true);

  return {
    isMounted,
    isInstallable,
    isInstalled,
    isIos,
    isStandalone,
    canPromptNative: Boolean(deferredPrompt),
    showIosGuide,
    setShowIosGuide,
    promptInstall,
    bannerDismissed,
    dismissBanner,
    resetBannerDismiss,
  };
}
