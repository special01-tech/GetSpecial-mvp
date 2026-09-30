/**
 * Types et interfaces pour la couche d'authentification client de GetSpecial.
 */

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  restaurantId?: string;
  avatarUrl?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  token?: string;
  expiresAt?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export type AuthProvider = 'google' | 'email';
