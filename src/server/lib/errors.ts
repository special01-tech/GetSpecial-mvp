/* =============================================================================
 * Erreurs custom
 *
 * Classes d'erreurs métier pour un contrôle plus fin dans les services.
 * ============================================================================= */

/** Erreur de validation (400) */
export class ValidationError extends Error {
  public readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Ressource non trouvée (404) */
export class NotFoundError extends Error {
  public readonly statusCode = 404;

  constructor(resource = 'Ressource') {
    super(`${resource} non trouvé(e).`);
    this.name = 'NotFoundError';
  }
}

/** Non autorisé (401) */
export class UnauthorizedError extends Error {
  public readonly statusCode = 401;

  constructor(message = 'Non autorisé.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
