'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fr, type Dictionary } from './dictionaries/fr';
import { en } from './dictionaries/en';
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from './types';

/* =============================================================================
 * i18n — Fournisseur de langue
 *
 * - Locale initiale : cookie lu côté serveur (prop initialLocale, zéro flash).
 * - Sinon : détection du navigateur (en* → 'en', sinon 'fr') après montage
 *   (dans un effet pour éviter tout mismatch d'hydratation).
 * - Persistance : cookie (1 an, lu par le layout serveur) + localStorage.
 * - t(path, vars) : résolution à clés pointées avec repli FR puis clé brute.
 * ============================================================================= */

const dictionaries: Record<Locale, Dictionary> = { fr, en };

/** Résout une clé pointée ("nav.home") dans un dictionnaire */
function lookup(dict: Dictionary, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = dict;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

/** Interpolation minimale des variables {name} */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : match
  );
}

function detectBrowserLocale(): Locale {
  try {
    const lang = navigator.language?.toLowerCase() ?? '';
    if (lang.startsWith('en')) return 'en';
  } catch {
    /* stockage/navigateur indisponible : repli défaut */
  }
  return DEFAULT_LOCALE;
}

function persistLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_COOKIE, locale);
  } catch {
    /* stockage indisponible : on ignore */
  }
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    /* cookies indisponibles : on ignore */
  }
}

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Traduit une clé ("nav.home"), avec interpolation optionnelle {var} */
  t: (path: string, vars?: Record<string, string | number>) => string;
  /** Formate une date selon la locale active */
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE);

  // Détection navigateur uniquement côté client après montage (pas de flash
  // si le cookie a fourni initialLocale, pas de mismatch d'hydratation sinon).
  useEffect(() => {
    if (!initialLocale) {
      const detected = detectBrowserLocale();
      setLocaleState(detected);
      persistLocale(detected);
    }
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>): string => {
      const template = lookup(dictionaries[locale], path) ?? lookup(fr, path) ?? path;
      return interpolate(template, vars);
    },
    [locale]
  );

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
      const value = date instanceof Date ? date : new Date(date);
      try {
        return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fr-FR', options).format(value);
      } catch {
        return value.toLocaleDateString();
      }
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, formatDate }),
    [locale, setLocale, t, formatDate]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Accède à la langue active. Doit être appelé dans un Client Component. */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage doit être utilisé dans un LanguageProvider');
  return ctx;
}
