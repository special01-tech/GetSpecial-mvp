'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Share2,
  Bell,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
} from 'lucide-react';
import { authClientService } from '@/services/auth/auth.client.service';
import styles from './settings.module.css';

export default function SettingsPage() {
  const router = useRouter();
  const [isPaused, setIsPaused] = useState(false);
  const [maxPostsPerDay, setMaxPostsPerDay] = useState('1');
  const [autoApprove, setAutoApprove] = useState(false);
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const paused = localStorage.getItem('getspecial_restaurant_paused') === 'true';
      setIsPaused(paused);
      const stored = localStorage.getItem('getspecial_selected_restaurant');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setRestaurantName(parsed.name);
      }
    } catch {
      // Ignorer
    }
  }, []);

  const toggleEmergencyPause = async () => {
    const newState = !isPaused;
    setIsPaused(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_restaurant_paused', String(newState));
      const restaurantId = localStorage.getItem('getspecial_restaurant_id') || 'rest-demo-1';
      try {
        await fetch('/api/restaurants/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantId, isPaused: newState }),
        });
      } catch (err) {
        console.warn('Could not sync pause state:', err);
      }
    }
    setNotice(
      newState
        ? '🚨 Emergency Pause active. Toutes les publications sont suspendues.'
        : '🟢 Automatisation active. GetSpecial surveille vos signaux et prépare vos posts.'
    );
    setTimeout(() => setNotice(null), 4000);
  };

  const handleLogout = async () => {
    await authClientService.logout();
    router.push('/login');
  };

  return (
    <div className={styles.settingsWrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>Paramètres & Sécurité</h1>
        <p className={styles.subtitle}>
          Gérez vos canaux connectés, vos limites de publication et la sécurité de {restaurantName}.
        </p>
      </header>

      {notice && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          background: isPaused ? 'rgba(185, 56, 56, 0.12)' : 'rgba(45, 106, 79, 0.12)',
          color: isPaused ? 'var(--color-error)' : 'var(--color-success)',
          marginBottom: '1.5rem',
          fontWeight: 500,
          fontSize: '0.9rem',
        }}>
          {notice}
        </div>
      )}

      {/* Disjoncteur d'urgence */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <ShieldAlert className={styles.sectionIcon} size={22} />
          <h2 className={styles.sectionTitle}>Disjoncteur d&apos;Urgence (Emergency Pause)</h2>
        </div>
        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>
              {isPaused ? 'Publications totalement suspendues' : 'Mode normal actif'}
            </div>
            <div className={styles.rowDescription}>
              En cas de rush imprévu ou de fermeture temporaire, suspendez toutes les publications d&apos;un simple tap.
            </div>
          </div>
          <button
            type="button"
            onClick={toggleEmergencyPause}
            className={isPaused ? styles.pauseToggleActive : styles.pauseToggleIdle}
          >
            {isPaused ? 'Reprendre l’assistant' : 'Mettre en Pause'}
          </button>
        </div>
      </section>

      {/* Canaux Réseaux Sociaux */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Share2 className={styles.sectionIcon} size={22} />
          <h2 className={styles.sectionTitle}>Canaux de Diffusion Connectés</h2>
        </div>

        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>TikTok (@getspecial_app)</div>
            <div className={styles.rowDescription}>Connecté via passerelle unifiée Zernio</div>
          </div>
          <span className={styles.badgeConnected}>
            <CheckCircle2 size={14} /> Connecté
          </span>
        </div>

        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>Instagram Business</div>
            <div className={styles.rowDescription}>Prêt pour liaison directe ou publication guidée</div>
          </div>
          <span className={styles.badgeConnected}>
            <CheckCircle2 size={14} /> Prêt
          </span>
        </div>

        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>Facebook & Google Business</div>
            <div className={styles.rowDescription}>Synchronisation des fiches locales</div>
          </div>
          <span className={styles.badgeDisconnected}>
            Liaison optionnelle
          </span>
        </div>
      </section>

      {/* Cadence Anti-Fatigue */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Sliders className={styles.sectionIcon} size={22} />
          <h2 className={styles.sectionTitle}>Règles Anti-Fatigue & Fréquence</h2>
        </div>

        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>Plafond de publication quotidienne</div>
            <div className={styles.rowDescription}>
              Limite le nombre de posts automatiques par jour pour ne jamais lasser votre audience.
            </div>
          </div>
          <select
            value={maxPostsPerDay}
            onChange={(e) => setMaxPostsPerDay(e.target.value)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-app)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="1">1 post par jour (Recommandé)</option>
            <option value="2">2 posts par jour max</option>
          </select>
        </div>

        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>Validation obligatoire par le gérant</div>
            <div className={styles.rowDescription}>
              Rien n&apos;est publié sans votre approbation explicite sur l&apos;écran Today.
            </div>
          </div>
          <span className={styles.badgeConnected}>
            <CheckCircle2 size={14} /> Strictement actif
          </span>
        </div>
      </section>

      {/* Déconnexion */}
      <section className={styles.section} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className={styles.rowLabel}>Session utilisateur</div>
          <div className={styles.rowDescription}>Déconnecter l&apos;appareil actuel de votre compte GetSpecial.</div>
        </div>
        <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </section>
    </div>
  );
}
