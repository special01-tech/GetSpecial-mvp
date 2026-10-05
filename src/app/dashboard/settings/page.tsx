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
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useLanguage } from '@/i18n';
import styles from './settings.module.css';

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
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
        ? t('settings.pauseOn')
        : t('settings.pauseOff')
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
        <h1 className={styles.title}>{t('settings.header.title')}</h1>
        <p className={styles.subtitle}>
          {t('settings.header.subtitle', { name: restaurantName })}
        </p>
      </header>

      {notice && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          background: isPaused ? 'rgba(185, 56, 56, 0.12)' : 'rgba(22, 163, 74,  0.12)',
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
          <h2 className={styles.sectionTitle}>{t('settings.emergency.title')}</h2>
        </div>
        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>
              {isPaused ? t('settings.emergency.paused') : t('settings.emergency.normal')}
            </div>
            <div className={styles.rowDescription}>
              {t('settings.emergency.description')}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleEmergencyPause}
            className={isPaused ? styles.pauseToggleActive : styles.pauseToggleIdle}
          >
            {isPaused ? t('settings.emergency.resume') : t('settings.emergency.pause')}
          </button>
        </div>
      </section>

      {/* Canaux Réseaux Sociaux */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Share2 className={styles.sectionIcon} size={22} />
          <h2 className={styles.sectionTitle}>{t('settings.channels.title')}</h2>
        </div>

        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>TikTok (@getspecial_app)</div>
            <div className={styles.rowDescription}>{t('settings.channels.tiktokDescription')}</div>
          </div>
          <span className={styles.badgeConnected}>
            <CheckCircle2 size={14} /> {t('settings.channels.connected')}
          </span>
        </div>

        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>Instagram Business</div>
            <div className={styles.rowDescription}>{t('settings.channels.instagramDescription')}</div>
          </div>
          <span className={styles.badgeConnected}>
            <CheckCircle2 size={14} /> {t('settings.channels.ready')}
          </span>
        </div>

        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>Facebook & Google Business</div>
            <div className={styles.rowDescription}>{t('settings.channels.facebookGoogleDescription')}</div>
          </div>
          <span className={styles.badgeDisconnected}>
            {t('settings.channels.optional')}
          </span>
        </div>
      </section>

      {/* Cadence Anti-Fatigue */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Sliders className={styles.sectionIcon} size={22} />
          <h2 className={styles.sectionTitle}>{t('settings.frequency.title')}</h2>
        </div>

        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>{t('settings.frequency.capLabel')}</div>
            <div className={styles.rowDescription}>
              {t('settings.frequency.capDescription')}
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
            <option value="1">{t('settings.frequency.onePerDay')}</option>
            <option value="2">{t('settings.frequency.twoPerDay')}</option>
          </select>
        </div>

        <div className={styles.cardRow}>
          <div>
            <div className={styles.rowLabel}>{t('settings.frequency.validationLabel')}</div>
            <div className={styles.rowDescription}>
              {t('settings.frequency.validationDescription')}
            </div>
          </div>
          <span className={styles.badgeConnected}>
            <CheckCircle2 size={14} /> {t('settings.frequency.strictlyActive')}
          </span>
        </div>
      </section>

      {/* Déconnexion */}
      <section className={styles.section} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className={styles.rowLabel}>{t('settings.session.label')}</div>
          <div className={styles.rowDescription}>{t('settings.session.description')}</div>
        </div>
        <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={16} />
          <span>{t('settings.session.logout')}</span>
        </button>
      </section>

      {/* Langue de l'interface */}
      <section className={styles.section} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className={styles.rowLabel}>{t('settings.language.title')}</div>
          <div className={styles.rowDescription}>{t('settings.language.description')}</div>
        </div>
        <LanguageToggle />
      </section>
    </div>
  );
}
