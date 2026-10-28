import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { publicationScheduler } from '@/server/modules/publisher/publication.scheduler';

export const dynamic = 'force-dynamic';

async function executeRun(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const { searchParams } = new URL(req.url);
      const queryKey = searchParams.get('key');
      if (queryKey !== cronSecret) {
        return error('Non autorisé', 401);
      }
    }

    const res = await publicationScheduler.runDuePublications();
    return success(res);
  } catch (err: any) {
    return error(err.message, 500);
  }
}

export async function GET(req: NextRequest) {
  return executeRun(req);
}

export async function POST(req: NextRequest) {
  return executeRun(req);
}

