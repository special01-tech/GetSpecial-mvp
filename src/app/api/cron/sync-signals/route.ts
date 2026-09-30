import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { signalSyncScheduler } from '@/server/modules/signal-collector/signal-sync.scheduler';

/**
 * GET /api/cron/sync-signals
 *
 * Endpoint destiné à être appelé par un cron job (Vercel Cron, GitHub Actions, etc.)
 * ou manuellement pour déclencher la synchronisation des signaux de tous les restaurants actifs.
 *
 * Sécurisé par CRON_SECRET en production.
 */
export async function GET(req: NextRequest) {
  // Vérification du secret en production
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return error('Unauthorized', 401);
    }
  }

  try {
    const result = await signalSyncScheduler.runDailyBatch();
    return success({
      message: `Signal sync completed for ${result.processed} restaurant(s).`,
      ...result,
    });
  } catch (err: any) {
    return error(err.message, 500);
  }
}
