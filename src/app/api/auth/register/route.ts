import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/auth.service';
import { success, error } from '@/server/lib/api-response';
import { setAuthCookies } from '@/server/lib/session';
import { checkRateLimit } from '@/server/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, 'auth:register', 10, 5 * 60 * 1000);
    if (!rate.allowed) {
      return error(`Trop de tentatives. Réessayez dans ${rate.retryAfterSec}s.`, 429);
    }

    const body = await req.json();
    const user = await authService.register(body);
    const res = success(user, 201);
    setAuthCookies(
      res,
      { id: user.id, email: user.email },
      { restaurantId: null }
    );
    return res;
  } catch (err: any) {
    const status = err.statusCode || 400;
    return error(err.message, status);
  }
}
