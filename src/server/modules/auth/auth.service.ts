import crypto from 'node:crypto';
import { prisma } from '@/server/db/prisma.client';
import { ValidationError, UnauthorizedError } from '@/server/lib/errors';
import {
  RegisterSchema,
  LoginSchema,
  type RegisterInput,
  type LoginInput,
  type SafeUser,
} from './auth.schema';

/**
 * Hachage sécurisé standard sans dépendance externe avec salt et PBKDF2 (SHA-512)
 */
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `pbkdf2$${salt}$${derivedKey}`;
}

/**
 * Comparaison sécurisée en temps constant
 */
async function comparePassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;

  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length === 3) {
      const [, salt, originalHash] = parts;
      const derivedKey = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      try {
        return crypto.timingSafeEqual(Buffer.from(derivedKey, 'hex'), Buffer.from(originalHash, 'hex'));
      } catch {
        return false;
      }
    }
  }

  return false;
}

/* =============================================================================
 * Module AUTH — Service
 *
 * Rôle : Création de compte sécurisée et vérification stricte des identifiants.
 * ============================================================================= */

export class AuthService {
  /**
   * Enregistre un nouvel utilisateur après validation et hachage du mot de passe.
   */
  async register(data: RegisterInput): Promise<SafeUser> {
    const validated = RegisterSchema.safeParse(data);
    if (!validated.success) {
      throw new ValidationError(validated.error.issues[0]?.message ?? 'Données invalides');
    }

    const email = validated.data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    const passwordHash = await hashPassword(validated.data.password);

    if (existing) {
      const updated = await (prisma.user as any).update({
        where: { email },
        data: {
          passwordHash,
          name: validated.data.name ?? (existing as any).name,
        },
      });

      return {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    }

    const user = await (prisma.user as any).create({
      data: {
        email,
        passwordHash,
        name: validated.data.name ?? email.split('@')[0],
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Valide les identifiants d'un utilisateur pour l'authentification.
   */
  async validateCredentials(data: LoginInput): Promise<SafeUser> {
    const validated = LoginSchema.safeParse(data);
    if (!validated.success) {
      throw new ValidationError(validated.error.issues[0]?.message ?? 'Identifiants invalides');
    }

    const email = validated.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError('Email ou mot de passe incorrect.');
    }

    const storedHash = (user as any).passwordHash;
    if (!storedHash) {
      throw new UnauthorizedError('Veuillez vous connecter via le fournisseur avec lequel votre compte a été créé.');
    }

    let isValid = false;
    try {
      isValid = await comparePassword(validated.data.password, storedHash);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      throw new UnauthorizedError('Email ou mot de passe incorrect.');
    }

    const userRestaurant = await (prisma as any).restaurant.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      restaurantId: userRestaurant?.id ?? null,
      restaurantName: userRestaurant?.name ?? null,
    };
  }
}

/** Instance singleton du service Auth */
export const authService = new AuthService();
