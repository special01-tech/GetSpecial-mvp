import type { NextRequest } from 'next/server';

interface RateBucket {
  timestamps: number[];
}

const buckets = new Map<string, RateBucket>();

/**
 * Limiteur à fenêtre glissante en mémoire pour protéger les routes IA/API payantes et l'authentification
 */
export function checkRateLimit(
  req: NextRequest,
  namespace: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';
  const sessionId = req.cookies.get('getspecial_session')?.value || '';
  const key = `${namespace}:${ip}:${sessionId}`;

  const now = Date.now();
  const cutoff = now - windowMs;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= maxRequests) {
    const oldest = bucket.timestamps[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  bucket.timestamps.push(now);
  return { allowed: true, retryAfterSec: 0 };
}
