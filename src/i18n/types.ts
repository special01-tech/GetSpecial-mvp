/* =============================================================================
 * i18n — Types & Constantes
 *
 * La locale FR fait foi : le dictionnaire anglais doit avoir exactement
 * la même forme (vérifié à la compilation dans dictionaries/en.ts).
 * ============================================================================= */

/** Locales supportées par l'interface */
export type Locale = 'fr' | 'en';

export const LOCALES: readonly Locale[] = ['fr', 'en'];

/** Langue par défaut (utilisée si aucune préférence ni détection) */
export const DEFAULT_LOCALE: Locale = 'fr';

/** Nom du cookie + clé localStorage mémorisant le choix de langue */
export const LOCALE_COOKIE = 'getspecial_locale';

/** Garde de type pour valider une valeur lue depuis cookie / stockage */
export function isLocale(value: unknown): value is Locale {
  return value === 'fr' || value === 'en';
}
