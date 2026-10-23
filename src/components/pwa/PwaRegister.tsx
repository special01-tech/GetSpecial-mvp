'use client';

import { useEffect } from 'react';

/**
 * PwaRegister
 *
 * Composant client invisible enregistrant automatiquement le Service Worker natif (/sw.js)
 * pour activer l'installabilité PWA et le cache hors-ligne sur Chrome, Edge, Safari et Android.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          // Vérifier si une mise à jour est en attente
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.info('[PWA] Nouvelle version prête.');
                }
              });
            }
          });

          console.info('[PWA] Service Worker enregistré avec succès (scope:', registration.scope, ')');
        } catch (error) {
          console.warn('[PWA] Erreur enregistrement Service Worker :', error);
        }
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  return null;
}
