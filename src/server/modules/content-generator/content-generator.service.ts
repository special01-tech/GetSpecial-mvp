import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/server/db/prisma.client';
import { logAudit } from '@/server/lib/audit';
import { getCountryConfig } from '@/server/lib/country-config';
import fs from 'fs';
import path from 'path';

export class ContentGeneratorService {
  private anthropic: Anthropic | null = null;
  private openRouterKey: string;
  private openRouterBaseUrl: string;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    this.openRouterKey = (process.env.OPENROUTER_API_KEY || '').replace(/^["']|["']$/g, '').trim();
    this.openRouterBaseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  }

  /**
   * Chaîne de production IA en 3 étapes connectées :
   * 1. GPT-4o-mini : Rédige le post (légende réseaux sociaux, mot-code oral, ton et public cible)
   * 2. Claude (Claude 3.5 Sonnet / Haiku) : Rédige le prompt d'image photoréaliste (Brand DNA, plat, composition)
   * 3. GPT-Image-2 (OpenRouter Images) : Génère l'image haute définition
   */
  async generatePostForOpportunity(
    opportunityId: string,
    restaurantId: string,
    platform: 'instagram' | 'facebook' | 'google_business' = 'instagram'
  ) {
    const opp = await (prisma as any).opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        restaurant: { include: { profile: true, dishes: true } },
      },
    });

    if (!opp) throw new Error('Opportunité introuvable');

    const restaurant = opp.restaurant;
    const profile = restaurant?.profile || {};
    const country = (restaurant?.country || profile?.country || 'FR').toUpperCase();
    const config = getCountryConfig(country);

    const facts = Array.isArray(opp.factsCited)
      ? opp.factsCited
      : Array.isArray((opp.factsCited as any)?.facts)
      ? (opp.factsCited as any).facts
      : [];

    const customRules = (profile.customRules as Record<string, any>) || {};
    const targetAudience = customRules.targetAudience?.join(', ') || 'Clientèle locale et actifs du quartier';
    const brandTone = profile.tone || profile.toneOfVoice || 'Chaleureux, authentique et accueillant';
    const colorPalette = profile.colors || ['#ff5a00', '#111827', '#f3f4f6'];

    // Mot-code oral au comptoir
    const codeWord = opp.offerDetails?.codeWord || opp.codeWord || 'SPECIAL';

    // Plat ciblé
    const offerLabel = opp.offerDetails?.label || opp.title;
    const offerDetails = opp.offerDetails?.details || opp.description;

    // =========================================================================
    // ÉTAPE 1 : GPT-4O-MINI RÉDIGE LA LÉGENDE DU POST
    // =========================================================================
    let postText = '';
    const cleanName = restaurant.name.replace(/[^a-zA-Z0-9]/g, '');

    if (this.openRouterKey) {
      try {
        const miniSystemPrompt = `Tu es le rédacteur réseaux sociaux expert de GetSpecial pour les restaurants indépendants.
Ton objectif est de rédiger un post court, percutant et ultra-gourmand pour ${platform}, adapté au public cible et au ton de marque de l'établissement.

RÈGLES D'OR :
1. Respecte le ton demandé : ${brandTone}.
2. Adresse-toi au public cible : ${targetAudience}.
3. Mets en avant l'offre : "${offerLabel}" (${offerDetails}).
4. Intègre impérativement le mot-code oral au comptoir : "${codeWord}". Le client doit prononcer ce mot au serveur pour profiter de l'avantage.
5. Inclus des émojis pertinents, un appel à l'action direct et 3 à 4 hashtags locaux pertinents.
6. Ne mentionne aucun jargon technique. Rédaction directe prête à publier.`;

        const miniUserPrompt = `Voici le restaurant et l'opportunité :
- Restaurant : ${restaurant.name} à ${restaurant.city || restaurant.address}
- Opportunité / Événement : ${opp.title} (${opp.description})
- Formule / Plat promu : ${offerLabel} (${offerDetails})
- Mot-code comptoir : ${codeWord}
- Faits vérifiés : ${facts.join(' • ') || 'Offre du jour'}

Rédige le texte complet pour ${platform} en français naturel.`;

        const gptMiniRes = await fetch(`${this.openRouterBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://getspecial.dev',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            temperature: 0.7,
            messages: [
              { role: 'system', content: miniSystemPrompt },
              { role: 'user', content: miniUserPrompt },
            ],
          }),
        });

        if (gptMiniRes.ok) {
          const gptMiniData = await gptMiniRes.json();
          const generatedCaption = gptMiniData.choices?.[0]?.message?.content?.trim();
          if (generatedCaption) {
            postText = generatedCaption;
          }
        }
      } catch (miniErr: any) {
        console.warn('[GPT4O_MINI_CAPTION_ERROR]', miniErr.message);
      }
    }

    // Fallback texte si nécessaire
    if (!postText) {
      postText = `✨ ${opp.title} chez ${restaurant.name} !\n\nProfitez de notre offre spéciale : ${offerLabel} (${offerDetails}).\n\n👉 Dites simplement le code "${codeWord}" à notre équipe au comptoir pour en profiter !\n\n📍 ${restaurant.name}, ${restaurant.address}\n#${cleanName} #restaurant #gastronomie #bonplan`;
    }

    // =========================================================================
    // ÉTAPE 2 : CLAUDE RÉDIGE LE PROMPT D'IMAGE ULTRA-DÉTAILLÉ
    // =========================================================================
    let visualPrompt = '';
    const claudeSystemPrompt = `You are the master food photography and culinary art director for GetSpecial.
Your role is to write an ultra-realistic, mouth-watering image generation prompt in English for a commercial food photo.

STRICT INSTRUCTIONS:
- Focus entirely on visual styling: composition, camera angle, soft warm cinematic lighting, textures, appetizing steam or glossy sauces.
- NEVER include any written text, words, prices, or letters inside the image prompt.
- Integrate the restaurant brand atmosphere (palette: ${Array.isArray(colorPalette) ? colorPalette.join(', ') : '#ff5a00'}, mood: ${brandTone}).
- Target aspect ratio: 1:1 square.
- Output ONLY the raw descriptive prompt in English (1-2 compact paragraphs), without quotes or commentary.`;

    const claudeUserPrompt = `Create a photorealistic prompt for:
- Dish / Offer: ${offerLabel} (${offerDetails})
- Cuisine type: ${restaurant.type || 'Bistrot'}
- Setting & Ambience: Cozy atmospheric table setting, authentic restaurant tableware, complementary ingredients in background
- Target audience: ${targetAudience}`;

    // Tentative via Claude (OpenRouter ou Anthropic SDK direct)
    if (this.openRouterKey) {
      try {
        const claudeModels = ['anthropic/claude-haiku-4.5', 'anthropic/claude-3.5-sonnet:beta', 'anthropic/claude-3-5-sonnet-20241022'];
        for (const cMod of claudeModels) {
          const claudeRes = await fetch(`${this.openRouterBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://getspecial.dev',
            },
            body: JSON.stringify({
              model: cMod,
              temperature: 0.6,
              messages: [
                { role: 'system', content: claudeSystemPrompt },
                { role: 'user', content: claudeUserPrompt },
              ],
            }),
          });

          if (claudeRes.ok) {
            const claudeData = await claudeRes.json();
            const p = claudeData.choices?.[0]?.message?.content?.trim();
            if (p) {
              visualPrompt = p;
              break;
            }
          }
        }
      } catch (claudeErr: any) {
        console.warn('[CLAUDE_IMAGE_PROMPT_ERROR]', claudeErr.message);
      }
    }

    // Fallback prompt si Claude est inaccessible
    if (!visualPrompt) {
      visualPrompt = `Professional commercial food photography of ${offerLabel}, beautifully presented on a rustic dining table, warm ambient restaurant lighting, shallow depth of field, 8k resolution, highly appetizing`;
    }

    // =========================================================================
    // ÉTAPE 3 : GPT-IMAGE-2 GÉNÈRE L'IMAGE
    // =========================================================================
    let imageUrl: string | null = null;
    const imageModelToUse = process.env.IMAGE_MODEL || 'openai/gpt-image-2';

    if (this.openRouterKey) {
      try {
        const imgRes = await fetch(`${this.openRouterBaseUrl}/images`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.openRouterKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: imageModelToUse,
            prompt: visualPrompt,
          }),
        });

        if (imgRes.ok) {
          const imgData = await imgRes.json();
          const firstImg = imgData.data?.[0];
          if (firstImg?.url) {
            imageUrl = firstImg.url;
          } else if (firstImg?.b64_json) {
            // Sauvegarder localement l'image base64 dans public/generated/
            const uploadsDir = path.join(process.cwd(), 'public', 'generated');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const fileName = `post-${opportunityId}-${Date.now()}.png`;
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, Buffer.from(firstImg.b64_json, 'base64'));
            imageUrl = `/generated/${fileName}`;
          }
        }
      } catch (imgErr: any) {
        console.warn('[GPT_IMAGE_2_ERROR]', imgErr.message);
      }
    }

    // Fallback photographique contextuel certifié si pas d'image générée
    if (!imageUrl) {
      const factsStr = (opp.title + ' ' + opp.description + ' ' + offerLabel).toLowerCase();
      if (factsStr.includes('soleil') || factsStr.includes('terrasse') || factsStr.includes('salade') || factsStr.includes('patio')) {
        imageUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
      } else if (factsStr.includes('burger') || factsStr.includes('match') || factsStr.includes('sport') || factsStr.includes('pinte')) {
        imageUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';
      } else if (factsStr.includes('fête') || factsStr.includes('soir') || factsStr.includes('vin') || factsStr.includes('cocktail')) {
        imageUrl = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80';
      } else {
        imageUrl = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';
      }
    }

    // Sauvegarde en base de données Supabase / Prisma
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
      action: 'post.generated_multi_model',
      entityType: 'post',
      entityId: post.id,
      details: {
        platform,
        opportunityId,
        captionModel: 'openai/gpt-4o-mini',
        promptModel: 'anthropic/claude-haiku-4.5',
        imageModel: imageModelToUse,
      },
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

