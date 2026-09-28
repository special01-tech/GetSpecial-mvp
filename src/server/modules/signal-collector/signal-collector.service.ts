import { prisma } from '@/server/db/prisma.client';
import { ValidationError } from '@/server/lib/errors';
import {
  CreateSignalSchema,
  type CreateSignalInput,
  type SignalRecord,
} from './signal-collector.schema';

/* =============================================================================
 * Module OBSERVE : Signal Collector — Service
 *
 * Rôle : Ingestion et restitution des signaux externes pour chaque restaurant.
 * ============================================================================= */

export class SignalCollectorService {
  /**
   * Enregistre un nouveau signal observé pour un restaurant.
   */
  async recordSignal(data: CreateSignalInput): Promise<SignalRecord> {
    const validated = CreateSignalSchema.safeParse(data);
    if (!validated.success) {
      throw new ValidationError(validated.error.issues[0]?.message ?? 'Données de signal invalides');
    }

    const created = await prisma.signal.create({
      data: {
        type: validated.data.type,
        source: validated.data.source,
        data: JSON.parse(JSON.stringify(validated.data.data)),
        restaurantId: validated.data.restaurantId,
      },
    });

    return created as unknown as SignalRecord;
  }

  /**
   * Récupère les signaux récents d'un restaurant (par défaut les 20 derniers).
   */
  async getRecentSignals(restaurantId: string, limit = 20): Promise<SignalRecord[]> {
    const signals = await prisma.signal.findMany({
      where: { restaurantId },
      orderBy: { detectedAt: 'desc' },
      take: limit,
    });

    return signals as unknown as SignalRecord[];
  }
}

/** Instance singleton du service SignalCollector */
export const signalCollectorService = new SignalCollectorService();
