import { NextResponse } from 'next/server';
import type { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from '@/types/dto';

/* =============================================================================
 * API Response — Helpers
 *
 * Fonctions utilitaires pour uniformiser les réponses API.
 * ============================================================================= */

/** Réponse de succès avec données et meta optionnel */
export function success<T>(data: T, status = 200, meta?: Record<string, unknown>): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) }, { status });
}

/** Réponse d'erreur avec message et code optionnel */
export function error(message: string, status = 400, code?: string, details?: unknown): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false, error: message, ...(code ? { code } : {}), ...(details ? { details } : {}) }, { status });
}

/** Réponse 404 */
export function notFound(resource = 'Ressource') {
  return error(`${resource} non trouvé(e).`, 404, 'NOT_FOUND');
}

/** Réponse 401 */
export function unauthorized(message = 'Non autorisé.') {
  return error(message, 401, 'UNAUTHORIZED');
}

/** Réponse 403 */
export function forbidden(message = 'Accès interdit.') {
  return error(message, 403, 'FORBIDDEN');
}

/** Réponse 500 */
export function serverError(message = 'Erreur interne du serveur.') {
  return error(message, 500, 'SERVER_ERROR');
}

