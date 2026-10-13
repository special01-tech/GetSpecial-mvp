import { ProviderError } from "./types";

export interface RetryOptions {
  retries: number;                       // nombre de nouvelles tentatives (hors 1er essai)
  baseMs: number;
  sleep?: (ms: number) => Promise<void>; // injectable pour les tests
  onRetry?: (err: ProviderError, attempt: number) => void;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Réessaie uniquement les erreurs marquées `retryable` (429, 5xx, timeout, réseau). */
export async function withRetry<T>(fn: () => Promise<T>, o: RetryOptions): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (e) {
      if (!(e instanceof ProviderError) || !e.retryable || attempt >= o.retries) throw e;
      attempt++;
      o.onRetry?.(e, attempt);
      const jitter = 0.5 + Math.random() / 2;
      await (o.sleep ?? defaultSleep)(o.baseMs * 2 ** (attempt - 1) * jitter);
    }
  }
}
