import { prisma } from '@/server/db/prisma.client';
import { NotFoundError, ValidationError } from '@/server/lib/errors';
import {
  CreateRestaurantSchema,
  UpdateRestaurantSchema,
  type CreateRestaurantInput,
  type UpdateRestaurantInput,
  type RestaurantProfile,
} from './context-store.schema';

/* =============================================================================
 * Module KNOW : Context Store — Service
 *
 * Rôle : Gère la persistance et la lecture du contexte de chaque restaurant.
 * ============================================================================= */

export class ContextStoreService {
  /**
   * Récupère le profil d'un restaurant par son identifiant.
   */
  async getRestaurantById(id: string): Promise<RestaurantProfile> {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundError('Restaurant');
    }

    return restaurant as unknown as RestaurantProfile;
  }

  /**
   * Récupère le premier restaurant associé à un utilisateur.
   */
  async getRestaurantByUserId(userId: string): Promise<RestaurantProfile | null> {
    const restaurant = await prisma.restaurant.findFirst({
      where: { userId },
    });

    return (restaurant as unknown as RestaurantProfile) ?? null;
  }

  /**
   * Crée un nouveau profil de restaurant.
   */
  async createRestaurant(data: CreateRestaurantInput): Promise<RestaurantProfile> {
    const validated = CreateRestaurantSchema.safeParse(data);
    if (!validated.success) {
      throw new ValidationError(validated.error.issues[0]?.message ?? 'Données invalides');
    }

    const created = await prisma.restaurant.create({
      data: {
        name: validated.data.name,
        type: validated.data.type,
        address: validated.data.address,
        latitude: validated.data.latitude,
        longitude: validated.data.longitude,
        timezone: validated.data.timezone,
        openingHours: validated.data.openingHours ? JSON.parse(JSON.stringify(validated.data.openingHours)) : undefined,
        specialties: validated.data.specialties,
        userId: validated.data.userId,
      },
    });

    return created as unknown as RestaurantProfile;
  }

  /**
   * Met à jour les informations d'un restaurant.
   */
  async updateRestaurant(id: string, data: UpdateRestaurantInput): Promise<RestaurantProfile> {
    const validated = UpdateRestaurantSchema.safeParse(data);
    if (!validated.success) {
      throw new ValidationError(validated.error.issues[0]?.message ?? 'Données invalides');
    }

    // Vérifier l'existence
    await this.getRestaurantById(id);

    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        ...validated.data,
        openingHours: validated.data.openingHours ? JSON.parse(JSON.stringify(validated.data.openingHours)) : undefined,
      },
    });

    return updated as unknown as RestaurantProfile;
  }
}

/** Instance singleton du service ContextStore */
export const contextStoreService = new ContextStoreService();
