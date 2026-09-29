import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { publicationScheduler } from '@/server/modules/publisher/publication.scheduler';

export async function POST(req: NextRequest) {
  try {
    const res = await publicationScheduler.runDuePublications();
    return success(res);
  } catch (err: any) {
    return error(err.message, 500);
  }
}
