'use client';

import { useLanguage, type Locale } from '@/i18n';
import styles from './LanguageToggle.module.css';

/* =============================================================================
 * LanguageToggle — Bascule de langue FR / EN
 *
 * Contrôle segmenté persistant via le LanguageProvider (cookie + localStorage).
 * Variante "compact" pour les espaces réduits (Header mobile).
 * ============================================================================= */

export default function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLanguage();

  const options: { value: Locale; label: string }[] = [
    { value: 'fr', label: 'FR' },
    { value: 'en', label: 'EN' },
  ];

  return (
    <div
      className={`${styles.toggle} ${compact ? styles.compact : ''}`}
      role="group"
      aria-label="Language / Langue"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLocale(opt.value)}
          aria-pressed={locale === opt.value}
          lang={opt.value}
          className={`${styles.option} ${locale === opt.value ? styles.active : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
