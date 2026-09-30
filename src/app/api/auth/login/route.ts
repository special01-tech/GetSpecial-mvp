import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/auth.service';
import { success, error } from '@/server/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await authService.validateCredentials(body);
    return success(user, 200);
  } catch (err: any) {
    const status = err.statusCode || 401;
    return error(err.message, status);
  }
}
