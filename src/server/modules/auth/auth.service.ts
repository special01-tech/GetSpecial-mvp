import bcrypt from 'bcryptjs';
import { prisma } from '@/server/db/prisma.client';
import { ValidationError, UnauthorizedError } from '@/server/lib/errors';
import {
  RegisterSchema,
  LoginSchema,
  type RegisterInput,
  type LoginInput,
  type SafeUser,
} from './auth.schema';

/* =============================================================================
 * Module AUTH — Service
 *
 * Rôle : Création de compte sécurisée et vérification des identifiants.
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

    const existing = await prisma.user.findUnique({
      where: { email: validated.data.email.toLowerCase() },
    });

    if (existing) {
      throw new ValidationError('Cet email est déjà utilisé.');
    }

    const passwordHash = await bcrypt.hash(validated.data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: validated.data.email.toLowerCase(),
        passwordHash,
        name: validated.data.name ?? null,
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
      throw new ValidationError('Identifiants invalides');
    }

    const user = await prisma.user.findUnique({
      where: { email: validated.data.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Email ou mot de passe incorrect.');
    }

    const isValid = await bcrypt.compare(validated.data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Email ou mot de passe incorrect.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

/** Instance singleton du service Auth */
export const authService = new AuthService();
