/**
 * Client Supabase Auth — Léger et robuste pour le navigateur
 * Gère l'initialisation OAuth et la session sans alourdir le bundle Webpack
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uiijdktqnulkipwspxjh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpaWpka3RxbnVsa2lwd3NweGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NjMxNzgsImV4cCI6MjEwNjIzOTE3OH0.qsMeGrFMeHegt8RZbqjgBzoOT2k8dVHqzvGD1f9FFFI';

export interface OAuthOptions {
  provider: 'google';
  options?: {
    redirectTo?: string;
    queryParams?: Record<string, string>;
  };
}

export const supabase = {
  auth: {
    async signInWithOAuth({ provider, options }: OAuthOptions) {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const redirectTo = options?.redirectTo || `${origin}/auth/callback`;

        const params = new URLSearchParams({
          provider,
          redirect_to: redirectTo,
        });

        if (options?.queryParams) {
          Object.entries(options.queryParams).forEach(([k, v]) => {
            params.append(k, v);
          });
        }

        const authUrl = `${supabaseUrl}/auth/v1/authorize?${params.toString()}`;

        return {
          data: {
            url: authUrl,
            provider,
          },
          error: null,
        };
      } catch (err: any) {
        return {
          data: null,
          error: { message: err?.message || 'Erreur d’initialisation OAuth' },
        };
      }
    },

    async signOut() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('getspecial_auth_user');
        localStorage.removeItem('getspecial_selected_restaurant');
        localStorage.removeItem('getspecial_restaurant_id');
        localStorage.removeItem('getspecial_onboarding_completed');
        document.cookie = 'getspecial_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'getspecial_restaurant_id=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      return { error: null };
    },
  },
};
