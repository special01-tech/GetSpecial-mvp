import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase Admin (service_role).
 * Uniquement pour les opérations serveur privilégiées (contournement RLS).
 * NE JAMAIS exposer côté client.
 *
 * Pour l'auth et les requêtes utilisateur, utiliser les clients SSR dans src/lib/supabase/.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis pour le client admin.')
  }

  return createClient(url, serviceRoleKey)
}
