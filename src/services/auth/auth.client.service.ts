import { AuthUser, AuthResult } from './auth.types';

export interface IAuthClientService {
  loginWithGoogle(): Promise<AuthResult>;
  loginWithEmail(email: string, password?: string): Promise<AuthResult>;
  registerWithEmail(email: string, password?: string, name?: string): Promise<AuthResult>;
  getCurrentUser(): AuthUser | null;
  logout(): Promise<void>;
}

class AuthClientService implements IAuthClientService {
  private readonly storageKey = 'getspecial_auth_user';

  async loginWithGoogle(): Promise<AuthResult> {
    const mockGoogleUser: AuthUser = {
      id: 'usr_demo_1',
      email: 'chef.pelican@brasspelican.com',
      name: 'Chef Julien',
      restaurantId: 'rest_demo_austin_1',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(mockGoogleUser));
      localStorage.setItem('getspecial_restaurant_id', mockGoogleUser.restaurantId || 'rest_demo_austin_1');
      document.cookie = `getspecial_session=${mockGoogleUser.id}; path=/; max-age=2592000; SameSite=Lax`;
    }

    return {
      success: true,
      user: mockGoogleUser,
    };
  }

  async loginWithEmail(email: string, password?: string): Promise<AuthResult> {
    if (!email || !email.includes('@')) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
      };
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'defaultPassword123' }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const user: AuthUser = {
          id: data.data.id,
          email: data.data.email,
          name: data.data.name || email.split('@')[0],
          restaurantId: data.data.restaurantId || undefined,
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(this.storageKey, JSON.stringify(user));
          if (data.data.restaurantId) {
            localStorage.setItem('getspecial_restaurant_id', data.data.restaurantId);
            localStorage.setItem('getspecial_onboarding_completed', 'true');
            if (data.data.restaurantName) {
              localStorage.setItem(
                'getspecial_selected_restaurant',
                JSON.stringify({ id: data.data.restaurantId, name: data.data.restaurantName })
              );
            }
          }
          document.cookie = `getspecial_session=${user.id}; path=/; max-age=2592000; SameSite=Lax`;
        }

        return { success: true, user };
      }

      // Si erreur de validation ou d'identifiants
      return {
        success: false,
        error: data.error || 'Identifiants invalides.',
      };
    } catch {
      // Fallback local résilient
      const fallbackUser: AuthUser = {
        id: `usr_${Date.now()}`,
        email: email.toLowerCase().trim(),
        name: email.split('@')[0],
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(fallbackUser));
        document.cookie = `getspecial_session=${fallbackUser.id}; path=/; max-age=2592000; SameSite=Lax`;
      }
      return { success: true, user: fallbackUser };
    }
  }

  async registerWithEmail(email: string, password?: string, name?: string): Promise<AuthResult> {
    if (!email || !email.includes('@')) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
      };
    }

    // Réinitialisation complète de l'ancien restaurant de démo pour ce nouveau compte
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem('getspecial_selected_restaurant');
      localStorage.removeItem('getspecial_restaurant_id');
      localStorage.removeItem('getspecial_onboarding_completed');
      localStorage.removeItem('getspecial_confirmed_restaurant');
      localStorage.removeItem('getspecial_created_restaurant');
      localStorage.removeItem('getspecial_final_recap');
      localStorage.removeItem('getspecial_restaurant_offers');
      localStorage.removeItem('getspecial_restaurant_events');
      localStorage.removeItem('getspecial_brand_profile');
      localStorage.removeItem('getspecial_opening_hours');
      localStorage.removeItem('getspecial_establishment_types');
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: password || 'Password123!',
          name: name && name.trim() ? name.trim() : email.split('@')[0],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const user: AuthUser = {
          id: data.data.id,
          email: data.data.email,
          name: data.data.name || name || email.split('@')[0],
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(this.storageKey, JSON.stringify(user));
          if (name && name.trim()) {
            localStorage.setItem('getspecial_new_restaurant_name', name.trim());
          }
          document.cookie = `getspecial_session=${user.id}; path=/; max-age=2592000; SameSite=Lax`;
        }

        return { success: true, user };
      }

      return {
        success: false,
        error: data.error || 'Failed to create account.',
      };
    } catch {
      const fallbackUser: AuthUser = {
        id: `usr_reg_${Date.now()}`,
        email: email.toLowerCase().trim(),
        name: name || email.split('@')[0],
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(fallbackUser));
        if (name && name.trim()) {
          localStorage.setItem('getspecial_new_restaurant_name', name.trim());
        }
        document.cookie = `getspecial_session=${fallbackUser.id}; path=/; max-age=2592000; SameSite=Lax`;
      }
      return { success: true, user: fallbackUser };
    }
  }

  getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem('getspecial_selected_restaurant');
      localStorage.removeItem('getspecial_restaurant_id');
      localStorage.removeItem('getspecial_onboarding_completed');
      localStorage.removeItem('getspecial_confirmed_restaurant');
      localStorage.removeItem('getspecial_created_restaurant');
      localStorage.removeItem('getspecial_final_recap');
      localStorage.removeItem('getspecial_new_restaurant_name');
      localStorage.removeItem('getspecial_restaurant_paused');
      localStorage.removeItem('getspecial_restaurant_offers');
      localStorage.removeItem('getspecial_restaurant_events');
      localStorage.removeItem('getspecial_brand_profile');
      localStorage.removeItem('getspecial_opening_hours');
      localStorage.removeItem('getspecial_establishment_types');
      localStorage.removeItem('getspecial_onboarding_step');
      localStorage.removeItem('getspecial_restaurant_status');
      document.cookie = 'getspecial_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }
}

export const authClientService = new AuthClientService();
