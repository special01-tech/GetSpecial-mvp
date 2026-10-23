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
  // Sécurisation stricte : CRON_SECRET est obligatoire pour protéger les quotas API
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[CRON_SYNC_SIGNALS] Erreur critique : CRON_SECRET non configuré sur le serveur.');
    return error('Service indisponible : CRON_SECRET non configuré', 503);
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return error('Accès non autorisé', 401);
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
