import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/auth.service';
import { success, error } from '@/server/lib/api-response';
import { setAuthCookies } from '@/server/lib/session';
import { checkRateLimit } from '@/server/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, 'auth:login', 15, 5 * 60 * 1000);
    if (!rate.allowed) {
      return error(`Trop de tentatives. Réessayez dans ${rate.retryAfterSec}s.`, 429);
    }

    const body = await req.json();
    const user = await authService.validateCredentials(body);
    const res = success(user, 200);
    setAuthCookies(
      res,
      { id: user.id, email: user.email },
      { restaurantId: user.restaurantId || null }
    );
    return res;
  } catch (err: any) {
    const status = err.statusCode || 401;
    return error(err.message, status);
  }
}
