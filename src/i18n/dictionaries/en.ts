/* =============================================================================
 * i18n — Agrégateur EN
 *
 * La vérification de type ci-dessous garantit que le dictionnaire anglais
 * a EXACTEMENT la même forme que le français (clés manquantes ou en trop
 * = erreur de compilation).
 * ============================================================================= */

import type { Dictionary } from './fr';
import { common } from './en/common';
import { nav } from './en/nav';
import { login } from './en/login';
import { onboarding } from './en/onboarding';
import { dashboard } from './en/dashboard';
import { restaurant } from './en/restaurant';
import { content } from './en/content';
import { engagement } from './en/engagement';
import { settings } from './en/settings';

export const en: Dictionary = {
  common,
  nav,
  login,
  onboarding,
  dashboard,
  restaurant,
  content,
  engagement,
  settings,
};
