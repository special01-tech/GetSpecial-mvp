/* =============================================================================
 * i18n — Agrégateur FR (fait foi pour la forme des dictionnaires)
 * ============================================================================= */

import { common } from './fr/common';
import { nav } from './fr/nav';
import { login } from './fr/login';
import { onboarding } from './fr/onboarding';
import { dashboard } from './fr/dashboard';
import { restaurant } from './fr/restaurant';
import { content } from './fr/content';
import { engagement } from './fr/engagement';
import { settings } from './fr/settings';

export const fr = {
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

export type Dictionary = typeof fr;
