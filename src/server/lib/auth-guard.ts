import type { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { resolveRequestUser } from './session';

/**
 * Supprime les champs sensibles (accessToken, refreshToken) d'un compte social avant envoi au client
 */
export function sanitizeSocialAccount(acc: any): any {
  if (!acc || typeof acc !== 'object') return acc;
  const { accessToken, refreshToken, ...safe } = acc;
  return {
    ...safe,
    hasToken: Boolean(accessToken),
  };
}

/**
 * Supprime les jetons d'accès des comptes sociaux imbriqués dans un objet restaurant
 */
export function sanitizeRestaurant(restaurant: any): any {
  if (!restaurant || typeof restaurant !== 'object') return restaurant;
  const copy = { ...restaurant };
  if (Array.isArray(copy.socialAccounts)) {
    copy.socialAccounts = copy.socialAccounts.map(sanitizeSocialAccount);
  }
  return copy;
}

/**
 * Vérifie l'accès d'un utilisateur à un restaurant donné (Protection Anti-IDOR).
 * En mode local (USE_LOCAL_DB=true ou dev), permet le fonctionnement fluide tout en isolant les propriétaires connus.
 */
export async function verifyRestaurantOwnership(
  req: NextRequest,
  restaurantId?: string | null,
  options: { allowFallbackInDev?: boolean; include?: any } = {}
): Promise<{
  allowed: boolean;
  status: number;
  error?: string;
  restaurant?: any;
  userId?: string | null;
}> {
  const sessionUser = await resolveRequestUser(req);
  const isLocalDev = process.env.NODE_ENV !== 'production' || process.env.USE_LOCAL_DB === 'true';

  if (!sessionUser && !isLocalDev) {
    return {
      allowed: false,
      status: 401,
      error: 'Authentification requise.',
    };
  }

  let restaurant: any = null;
  if (restaurantId && restaurantId !== 'current' && restaurantId !== 'default') {
    restaurant = await (prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      ...(options.include ? { include: options.include } : {}),
    });
  }

  if (!restaurant && options.allowFallbackInDev && isLocalDev) {
    // En mode développement local, chercher en priorité le restaurant de l'utilisateur courant
    if (sessionUser?.userId) {
      restaurant = await (prisma as any).restaurant.findFirst({
        where: { userId: sessionUser.userId },
        orderBy: { createdAt: 'desc' },
        ...(options.include ? { include: options.include } : {}),
      });
    }
    if (!restaurant) {
      restaurant = await (prisma as any).restaurant.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        ...(options.include ? { include: options.include } : {}),
      });
    }
  }

  if (!restaurant) {
    return {
      allowed: false,
      status: 404,
      error: 'Établissement introuvable.',
    };
  }

  // En production, vérifier strictement que le restaurant appartient à l'utilisateur connecté
  if (!isLocalDev && sessionUser?.userId) {
    if (restaurant.userId && restaurant.userId !== sessionUser.userId) {
      return {
        allowed: false,
        status: 403,
        error: 'Accès refusé : vous n’êtes pas propriétaire de cet établissement.',
      };
    }
  }

  return {
    allowed: true,
    status: 200,
    restaurant,
    userId: sessionUser?.userId || null,
  };
}
