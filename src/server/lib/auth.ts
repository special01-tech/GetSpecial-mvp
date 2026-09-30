import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/server/db/prisma.client'

/**
 * Récupère l'utilisateur Supabase authentifié et son profil Prisma.
 * Si l'utilisateur Prisma n'existe pas encore (ex: premier login avant trigger DB),
 * il est auto-provisionné de manière transparente.
 * Retourne null si non connecté.
 */
export async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  let dbUser = null
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    // Robustesse : auto-provisioning si l'utilisateur Prisma n'est pas encore créé
    if (!dbUser && user.email) {
      try {
        dbUser = await prisma.user.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
          },
          create: {
            id: user.id,
            email: user.email,
            name: (user.user_metadata?.name as string) || (user.user_metadata?.full_name as string) || null,
            avatarUrl: (user.user_metadata?.avatar_url as string) || null,
          },
        })
      } catch {
        // Ignorer si une race condition survient avec un trigger externe
        dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
      }
    }

    if (dbUser) {
      try {
        const { ensureUserHasRestaurant } = await import('@/server/lib/seed-user-data');
        await ensureUserHasRestaurant(dbUser.id);
      } catch (seedErr) {
        console.warn('Initialisation automatique restaurant ignorée:', seedErr);
      }
    }
  } catch (dbErr) {
    console.warn('Base de données inaccessible via Prisma, utilisation du profil Supabase Auth direct:', dbErr);
  }

  return { supabaseUser: user, dbUser };
}

/**
 * Comme getAuthUser, mais lance une erreur si non connecté.
 * À utiliser dans les routes API protégées.
 */
export async function requireAuth() {
  const auth = await getAuthUser()
  if (!auth || !auth.dbUser) {
    throw new Error('Non autorisé')
  }
  return auth
}

/**
 * Vérifie que l'utilisateur connecté possède bien le restaurant donné.
 * Retourne le restaurant et l'utilisateur ou lance une erreur.
 */
export async function requireRestaurantOwnership(restaurantId: string) {
  const { dbUser, supabaseUser } = await requireAuth()

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, userId: dbUser.id },
  })

  if (!restaurant) {
    throw new Error('Restaurant non trouvé ou accès refusé')
  }

  return { dbUser, supabaseUser, restaurant }
}

/**
 * Récupère le restaurant actif de l'utilisateur connecté (ou le premier disponible).
 */
export async function getCurrentRestaurant() {
  const { dbUser } = await requireAuth();
  const { ensureUserHasRestaurant } = await import('@/server/lib/seed-user-data');
  return ensureUserHasRestaurant(dbUser.id);
}

