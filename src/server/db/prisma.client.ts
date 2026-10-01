import { PrismaClient } from '@prisma/client';
import { fallbackStore } from './fallback-store';

/* =============================================================================
 * Prisma Client — Resilient Singleton
 *
 * Tente la connexion à PostgreSQL (Supabase / local).
 * Si la base distante est inaccessible (P1001, timeout, DNS, tenant introuvable),
 * bascule automatiquement sur le fallbackStore JSON persistant (.data/getspecial_store.json)
 * pour garantir le fonctionnement ininterrompu de l'application et de toutes les routes.
 * ============================================================================= */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbOfflineNoticeLogged?: boolean;
  isDbOffline?: boolean;
};

// Si l'URL Supabase contient le tenant connu inaccessible sans local DB
const isKnownBrokenSupabase =
  Boolean(process.env.DATABASE_URL?.includes('uiijdktqnulkipwspxjh')) ||
  process.env.USE_LOCAL_DB === 'true';

if (isKnownBrokenSupabase) {
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
    name === 'PrismaClientUnknownRequestError' ||
    name === 'PrismaClientKnownRequestError' ||
    code.startsWith('P1') ||
    code === 'P2010' ||
    msg.includes("can't reach database server") ||
    msg.includes('connection refused') ||
    msg.includes('enotfound') ||
    msg.includes('tenant') ||
    msg.includes('timeout') ||
    msg.includes('fatal') ||
    msg.includes('environment variable not found') ||
    msg.includes('database_url')
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
            // Si la base distante a déjà été détectée inaccessible, utiliser le store local directement
            if (globalForPrisma.isDbOffline) {
              const fallbackAction = fallbackModel[actionProp];
              if (typeof fallbackAction === 'function') {
                return fallbackAction(...args);
              }
            }

            try {
              if (typeof modelTarget[actionProp] === 'function') {
                return await modelTarget[actionProp](...args);
              }
            } catch (err: any) {
              if (isDbConnectionError(err)) {
                if (!globalForPrisma.dbOfflineNoticeLogged) {
                  console.warn(
                    `[DB_CONNECTION_FAILOVER] PostgreSQL distant injoignable (${err.code || err.message}). Bascule automatique vers le stockage local persistant (.data/getspecial_store.json).`
                  );
                  globalForPrisma.dbOfflineNoticeLogged = true;
                  globalForPrisma.isDbOffline = true;
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
