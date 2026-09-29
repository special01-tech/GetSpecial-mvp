import { prisma } from '@/server/db/prisma.client';

export interface AuditLogPayload {
  restaurantId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  userId?: string | null;
  ipAddress?: string | null;
}

/**
 * Journalise une action importante dans la table audit_log.
 * Conçu pour ne jamais faire crasher l'action principale en cas d'erreur de logging.
 */
export async function logAudit(payload: AuditLogPayload): Promise<void> {
  try {
    await (prisma as any).auditLog.create({
      data: {
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId ?? null,
        restaurantId: payload.restaurantId ?? null,
        userId: payload.userId ?? null,
        details: payload.details ? JSON.parse(JSON.stringify(payload.details)) : null,
        ipAddress: payload.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error('[AUDIT_LOG_ERROR]', err, payload);
  }
}
