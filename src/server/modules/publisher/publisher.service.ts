import { prisma } from '@/server/db/prisma.client';
import { NotFoundError, ValidationError } from '@/server/lib/errors';
import {
  SchedulePublicationSchema,
  type SchedulePublicationInput,
  type PublicationRecord,
} from './publisher.schema';

/* =============================================================================
 * Module PUBLISH : Publisher — Service
 *
 * Rôle : Orchestration de la planification et du suivi des posts multi-plateformes.
 * ============================================================================= */

export class PublisherService {
  /**
   * Planifie ou prépare une publication.
   */
  async schedulePublication(data: SchedulePublicationInput): Promise<PublicationRecord> {
    const validated = SchedulePublicationSchema.safeParse(data);
    if (!validated.success) {
      throw new ValidationError(validated.error.issues[0]?.message ?? 'Planification invalide');
    }

    const created = await (prisma as any).publication.create({
      data: {
        platform: validated.data.platform,
        status: 'pending',
        postId: validated.data.contentId,
        restaurantId: validated.data.restaurantId,
        sendIdempotencyKey: `legacy_pub_${Date.now()}`,
      },
    });

    return created as unknown as PublicationRecord;
  }

  /**
   * Marque une publication comme réussie avec l'identifiant distant.
   */
  async markAsPublished(id: string, externalPostId?: string): Promise<PublicationRecord> {
    const exists = await (prisma as any).publication.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundError('Publication');
    }

    const updated = await (prisma as any).publication.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        outstandPostId: externalPostId ?? null,
      },
    });

    return updated as unknown as PublicationRecord;
  }

  /**
   * Liste les publications d'un restaurant (planifiées, publiées ou échouées).
   */
  async getPublicationsByRestaurant(
    restaurantId: string,
    status?: string
  ): Promise<PublicationRecord[]> {
    const publications = await (prisma as any).publication.findMany({
      where: {
        restaurantId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return publications as unknown as PublicationRecord[];
  }
}

/** Instance singleton du service Publisher */
export const publisherService = new PublisherService();
