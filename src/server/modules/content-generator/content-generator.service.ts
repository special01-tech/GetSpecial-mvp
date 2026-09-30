import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/server/db/prisma.client';
import { logAudit } from '@/server/lib/audit';
import { getCountryConfig } from '@/server/lib/country-config';

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
  async generatePostForOpportunity(
    opportunityId: string,
    restaurantId: string,
    platform: 'instagram' | 'facebook' | 'tiktok' | 'google_business' = 'instagram'
  ) {
    const opp = await (prisma as any).opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        restaurant: { include: { profile: true } },
      },
    });

    if (!opp) throw new Error('Opportunité introuvable');

    const restaurant = opp.restaurant;
    const facts = (opp.factsCited as string[]) || [];
    const config = getCountryConfig(restaurant.country);
    const cleanName = restaurant.name.replace(/[^a-zA-Z0-9]/g, '');

    let postText = '';

    if (!this.anthropic) {
      if (config.language === 'fr') {
        postText = `✨ ${opp.title} !\n\n${opp.description}\n\n📍 Rendez-vous chez ${restaurant.name}, ${restaurant.address}.\n\n#${cleanName} #restaurant #gastronomie`;
      } else if (config.language === 'es') {
        postText = `🔥 ${opp.title}!\n\n${opp.description}\n\n📍 Te esperamos en ${restaurant.name}, ${restaurant.address}.\n\n#${cleanName} #restaurante #gastronomia`;
      } else if (config.language === 'de') {
        postText = `✨ ${opp.title}!\n\n${opp.description}\n\n📍 Besucht uns bei ${restaurant.name}, ${restaurant.address}.\n\n#${cleanName} #restaurant #lecker`;
      } else {
        postText = `🔥 ${opp.title}!\n\n${opp.description}\n\n📍 Visit us at ${restaurant.name}, ${restaurant.address}.\n\n#${cleanName} #foodie #dining`;
      }
    } else {
      const prompt = `Write an engaging, high-converting social media post for ${platform} for the restaurant "${restaurant.name}" located in ${restaurant.city || config.name}, ${config.name}.
Target Language: Write naturally in the primary language of ${config.name} (${config.language.toUpperCase()}).
Currency: Use ${config.currencySymbol} (${config.currencyCode}) for any pricing references.
Theme: ${opp.title} (${opp.description}).
Tone: ${opp.recommendedTone || restaurant.profile?.toneOfVoice || 'Welcoming, authentic hospitality'}.
Strictly authorized facts (DO NOT invent anything outside these):
${facts.map((f: string) => `- ${f}`).join('\n')}

Format: Ready-to-publish copy with natural local phrasing, emojis, and 3 relevant hashtags. No meta-commentary.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      });

      postText = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
    }

    // Fallback template image based on opportunity facts / type
    const factsStr = facts.join(' ').toLowerCase();
    let imageUrl: string | null = null;
    if (factsStr.includes('weather') || factsStr.includes('sunny') || factsStr.includes('terrasse') || factsStr.includes('patio')) {
      imageUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
    } else if (factsStr.includes('event') || factsStr.includes('match') || factsStr.includes('nfl') || factsStr.includes('concert')) {
      imageUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';
    } else if (factsStr.includes('holiday') || factsStr.includes('fête') || factsStr.includes('day')) {
      imageUrl = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80';
    } else {
      imageUrl = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';
    }

    // Safety: Remove or flag forbidden terms / legal check
    const FORBIDDEN_WORDS = ['100% garanti', 'meilleur du monde', 'gratuit sans condition', 'cure miracle'];
    for (const badWord of FORBIDDEN_WORDS) {
      if (postText.toLowerCase().includes(badWord)) {
        postText = postText.replace(new RegExp(badWord, 'gi'), '');
      }
    }

    // Création du post en statut 'pending_approval' (Machine à états)
    const post = await (prisma as any).post.create({
      data: {
        restaurantId,
        opportunityId,
        platform,
        text: postText,
        imageUrl,
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
