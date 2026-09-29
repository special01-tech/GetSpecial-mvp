import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/server/db/prisma.client';
import { logAudit } from '@/server/lib/audit';

export class ContentGeneratorService {
  private anthropic: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  /**
   * Génère le texte d'un post à partir d'une opportunité validée
   * Seuls les faits vérifiés de l'opportunité et du restaurant sont autorisés.
   */
  async generatePostForOpportunity(opportunityId: string, restaurantId: string, platform: 'instagram' | 'facebook' = 'instagram') {
    const opp = await (prisma as any).opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        restaurant: { include: { profile: true } },
      },
    });

    if (!opp) throw new Error('Opportunité introuvable');

    const restaurant = opp.restaurant;
    const facts = (opp.factsCited as string[]) || [];

    let postText = '';

    if (!this.anthropic) {
      postText = `✨ ${opp.title} !\n\n${opp.description}\n\n📍 Rendez-vous chez ${restaurant.name}, ${restaurant.address}.\n\n#restaurant #${restaurant.type.replace('-', '')} #food`;
    } else {
      const prompt = `Rédige un post percutant pour ${platform} pour le restaurant "${restaurant.name}".
Thème : ${opp.title} (${opp.description}).
Ton souhaité : ${opp.recommendedTone || restaurant.profile?.tone || 'chaleureux'}.
Faits autorisés (stricte interdiction d'en inventer d'autres) :
${facts.map((f: string) => `- ${f}`).join('\n')}

Format : Texte prêt à être publié avec émojis adaptés et 3 hashtags. Aucun commentaire hors du texte du post.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      });

      postText = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
    }

    // Création du post en statut 'pending_approval' (Machine à états)
    const post = await (prisma as any).post.create({
      data: {
        restaurantId,
        opportunityId,
        platform,
        text: postText,
        status: 'pending_approval',
        verifiedFacts: facts,
      },
    });

    await logAudit({
      restaurantId,
      action: 'post.generated',
      entityType: 'post',
      entityId: post.id,
      details: { platform, opportunityId },
    });

    return post;
  }

  /**
   * Modification du texte du post par le gérant
   */
  async updatePost(postId: string, restaurantId: string, text: string) {
    const updated = await (prisma as any).post.update({
      where: { id: postId, restaurantId },
      data: { text },
    });

    await logAudit({
      restaurantId,
      action: 'post.update_text',
      entityType: 'post',
      entityId: postId,
    });

    return updated;
  }
}

export const contentGeneratorService = new ContentGeneratorService();
