import crypto from 'crypto';

/**
 * Fonctions pures et sécurisées pour le hachage et la vérification des PINs via scrypt natif.
 */

const PIN_SALT = process.env.PIN_SALT || 'getspecial_pin_scrypt_salt_v2';

export function hashPin(pin: string, salt: string = PIN_SALT): string {
  return crypto.scryptSync(pin, salt, 32).toString('hex');
}

export function verifyPin(pin: string, storedHash: string, salt: string = PIN_SALT): boolean {
  if (!pin || !storedHash) return false;
  const hash = crypto.scryptSync(pin, salt, 32).toString('hex');
  const bufA = Buffer.from(hash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export interface RateLimitCheckResult {
  isBlocked: boolean;
  minutesRemaining: number;
}

/**
 * Règle de limitation des essais de code :
 * 5 erreurs par IP et restaurant => blocage 5 minutes.
 */
export function evaluatePinRateLimit(
  failureCount: number,
  lastFailedAt: Date | null,
  now: Date = new Date()
): RateLimitCheckResult {
  if (failureCount < 5 || !lastFailedAt) {
    return { isBlocked: false, minutesRemaining: 0 };
  }

  const elapsedMs = now.getTime() - lastFailedAt.getTime();
  const blockDurationMs = 5 * 60 * 1000;

  if (elapsedMs < blockDurationMs) {
    const minutesRemaining = Math.ceil((blockDurationMs - elapsedMs) / 60000);
    return { isBlocked: true, minutesRemaining };
  }

  return { isBlocked: false, minutesRemaining: 0 };
}
