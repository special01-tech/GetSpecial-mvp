import { PrismaClient } from '@prisma/client';
import { fallbackStore } from './fallback-store';

/* =============================================================================
 * Prisma Client — Resilient Singleton
 *
 * Tente la connexion à PostgreSQL (Supabase / local).
 * Si la base distante est inaccessible (P1001, timeout, DNS), bascule
 * automatiquement sur le fallbackStore JSON persistant pour garantir
 * le fonctionnement ininterrompu de l'application et de tous les tests.
 * ============================================================================= */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbOfflineNoticeLogged?: boolean;
  isDbOffline?: boolean;
};

const isForceOffline = process.env.USE_LOCAL_DB === 'true';

if (isForceOffline) {
  globalForPrisma.isDbOffline = true;
  globalForPrisma.dbOfflineNoticeLogged = true;
}

const rawPrisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = rawPrisma;
}

// Détection de défaillance réseau ou d'initialisation DB
function isDbConnectionError(err: any): boolean {
  if (!err) return false;
  const name = err.name || '';
  const msg = (err.message || '').toLowerCase();
  const code = err.code || '';
  return (
    name === 'PrismaClientInitializationError' ||
    name === 'PrismaClientRustPanicError' ||
    code === 'P1000' ||
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'P1003' ||
    code === 'P1017' ||
    code === 'P2021' ||
    code === 'P2022' ||
    msg.includes("can't reach database server") ||
    msg.includes('connection refused') ||
    msg.includes('enotfound') ||
    msg.includes('etimedout') ||
    msg.includes('tenant/user') ||
    msg.includes('not found') ||
    msg.includes('fatal') ||
    msg.includes('pooler')
  );
}

function createResilientPrismaProxy(targetPrisma: any): PrismaClient {
  return new Proxy(targetPrisma, {
    get(target, modelProp: string) {
      if (typeof modelProp !== 'string' || modelProp.startsWith('$') || modelProp.startsWith('_')) {
        return target[modelProp];
      }

      const rawModel = target[modelProp];
      const fallbackModel = (fallbackStore as any)[modelProp];

      if (!fallbackModel) {
        return rawModel;
      }

      return new Proxy(rawModel || {}, {
        get(modelTarget, actionProp: string) {
          return async (...args: any[]) => {
            // Si la base distante a déjà été détectée inaccessible ou mode local forcé, utiliser le store local directement
            if (globalForPrisma.isDbOffline || isForceOffline) {
              const fallbackAction = fallbackModel[actionProp];
              if (typeof fallbackAction === 'function') {
                return fallbackAction(...args);
              }
            }

            try {
              if (typeof modelTarget[actionProp] === 'function') {
                // Timeout de sécurité de 2.5s maximum pour ne jamais subir les 42s de blocage TCP
                let timer: NodeJS.Timeout | null = null;
                const timeoutPromise = new Promise((_, reject) => {
                  timer = setTimeout(() => reject(new Error('Prisma connection timeout (>2500ms)')), 2500);
                });
                const dbPromise = modelTarget[actionProp](...args);
                if (dbPromise && typeof dbPromise.catch === 'function') {
                  dbPromise.catch(() => {});
                }
                try {
                  return await Promise.race([dbPromise, timeoutPromise]);
                } finally {
                  if (timer) clearTimeout(timer);
                }
              }
            } catch (err: any) {
              const isConnError = isDbConnectionError(err) || (err.message && err.message.includes('timeout'));
              if (isConnError) {
                globalForPrisma.isDbOffline = true;
                if (!globalForPrisma.dbOfflineNoticeLogged) {
                  globalForPrisma.dbOfflineNoticeLogged = true;
                  console.warn(
                    `[DB_CONNECTION_FAILOVER] PostgreSQL distant injoignable (${err.code || err.message}). Bascule instantanée sur le store local.`
                  );
                }

                const fallbackAction = fallbackModel[actionProp];
                if (typeof fallbackAction === 'function') {
                  return fallbackAction(...args);
                }
              }
              throw err;
            }

            const fallbackAction = fallbackModel[actionProp];
            if (typeof fallbackAction === 'function') {
              return fallbackAction(...args);
            }
          };
        },
      });
    },
  });
}

export const prisma: PrismaClient = createResilientPrismaProxy(rawPrisma);
