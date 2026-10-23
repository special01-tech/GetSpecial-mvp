import { z } from 'zod';

export const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL obligatoire'),
  DIRECT_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL invalide').optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(1).default('gs_session_secret_default_fallback_2026'),
  ADMIN_SETUP_TOKEN: z.string().optional().default('gs_initial_setup_token_change_me'),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('google/gemini-3.8-flash'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(): EnvConfig {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    console.error(`[CONFIG_FATAL] Erreur de validation de configuration : ${errorDetails}`);
    // En production, lever une erreur bloquante
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Configuration d'environnement invalide : ${errorDetails}`);
    }
    // En développement, renvoyer les valeurs parsées avec les fallbacks
    return EnvSchema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/gs_mvp',
    });
  }
  return result.data;
}

export const env = validateEnv();
