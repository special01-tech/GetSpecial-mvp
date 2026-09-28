import { prisma } from '@/server/db/prisma.client';
import { NotFoundError, ValidationError } from '@/server/lib/errors';
import {
  CreateContentSchema,
  UpdateContentSchema,
  type CreateContentInput,
  type UpdateContentInput,
  type ContentRecord,
} from './content-generator.schema';

/* =============================================================================
 * Module CREATE : Content Generator — Service
 *
 * Rôle : Persistance et cycle de vie des contenus éditoriaux (brouillon, validation).
 * ============================================================================= */

export class ContentGeneratorService {
  /**
   * Crée un nouveau brouillon ou contenu finalisé.
   */
  async createContent(data: CreateContentInput): Promise<ContentRecord> {
    const validated = CreateContentSchema.safeParse(data);
    if (!validated.success) {
      throw new ValidationError(validated.error.issues[0]?.message ?? 'Contenu invalide');
    }

    const created = await prisma.content.create({
      data: {
        text: validated.data.text,
        imageUrl: validated.data.imageUrl ?? null,
        platform: validated.data.platform,
        status: validated.data.status,
        restaurantId: validated.data.restaurantId,
        opportunityId: validated.data.opportunityId ?? null,
      },
    });

    return created as unknown as ContentRecord;
  }

  /**
   * Récupère un contenu par son identifiant.
   */
  async getContentById(id: string): Promise<ContentRecord> {
    const content = await prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundError('Contenu');
    }

    return content as unknown as ContentRecord;
  }

  /**
   * Liste les contenus d'un restaurant (par statut ou plateforme).
   */
  async listContents(restaurantId: string, status?: string): Promise<ContentRecord[]> {
    const contents = await prisma.content.findMany({
      where: {
        restaurantId,
        ...(status ? { status } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });

    return contents as unknown as ContentRecord[];
  }

  /**
   * Met à jour un contenu existant.
   */
  async updateContent(id: string, data: UpdateContentInput): Promise<ContentRecord> {
    const validated = UpdateContentSchema.safeParse(data);
    if (!validated.success) {
      throw new ValidationError(validated.error.issues[0]?.message ?? 'Données de mise à jour invalides');
    }

    await this.getContentById(id);

    const updated = await prisma.content.update({
      where: { id },
      data: validated.data,
    });

    return updated as unknown as ContentRecord;
  }
}

/** Instance singleton du service ContentGenerator */
export const contentGeneratorService = new ContentGeneratorService();
