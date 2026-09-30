import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/auth.service';
import { success, error } from '@/server/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await authService.register(body);
    return success(user, 201);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return error(err.message, status);
  }
}
