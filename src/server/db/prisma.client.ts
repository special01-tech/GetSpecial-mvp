import { PrismaClient } from '@prisma/client';

/* =============================================================================
 * Prisma Client — Singleton
 *
 * Évite la création de multiples instances en dev (hot reload).
 * En production, une seule instance est utilisée.
 * ============================================================================= */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Instance unique du client Prisma */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
