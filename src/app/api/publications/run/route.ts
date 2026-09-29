import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireAuth } from '@/server/lib/auth';
import { publicationScheduler } from '@/server/modules/publisher/publication.scheduler';

export async function POST() {
  try {
    await requireAuth();
    const res = await publicationScheduler.runDuePublications();
    return success(res);
  } catch (err: any) {
    if (err.message === 'Non autorisé') return unauthorized();
    return error(err.message, 500);
  }
}
