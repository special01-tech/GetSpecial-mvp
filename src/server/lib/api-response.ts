import { NextResponse } from 'next/server';

/* =============================================================================
 * API Response — Helpers
 *
 * Fonctions utilitaires pour uniformiser les réponses API.
 * ============================================================================= */

/** Réponse de succès avec données */
export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Réponse d'erreur avec message */
export function error(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/** Réponse 404 */
export function notFound(resource = 'Ressource') {
  return error(`${resource} non trouvé(e).`, 404);
}

/** Réponse 401 */
export function unauthorized() {
  return error('Non autorisé.', 401);
}

/** Réponse 500 */
export function serverError(message = 'Erreur interne du serveur.') {
  return error(message, 500);
}
