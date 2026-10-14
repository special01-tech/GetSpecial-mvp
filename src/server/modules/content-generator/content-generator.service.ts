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
    platform: 'instagram' | 'facebook' | 'google_business' = 'instagram',
    opportunityPayload?: any
  ) {
    const key = (this.openRouterKey || process.env.OPENROUTER_API_KEY || '').replace(/^["']|["']$/g, '').trim();
    const baseUrl = this.openRouterBaseUrl || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

    // 1. Recherche de l'opportunité et du restaurant en base avec timeout sécurisé
    const withDbTimeout = <T>(promise: Promise<T>, ms = 2000, fallback: T): Promise<T> => {
      return Promise.race([
        promise.catch(() => fallback),
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
      ]);
    };

    let opp = await withDbTimeout(
      (prisma as any).opportunity.findUnique({
        where: { id: opportunityId },
        include: {
          restaurant: { include: { profile: true } },
        },
      }),
      2000,
      null
    );

    let restaurant = opp?.restaurant;

    if (!restaurant && restaurantId) {
      restaurant = await withDbTimeout(
        (prisma as any).restaurant.findUnique({
          where: { id: restaurantId },
          include: { profile: true },
        }),
        2000,
        null
      );
    }

    if (!restaurant) {
      restaurant = await withDbTimeout(
        (prisma as any).restaurant.findFirst({
          orderBy: { createdAt: 'desc' },
          include: { profile: true },
        }),
        2000,
        null
      );
    }

    // Profil de restaurant contextualisé par défaut si non persisté
    if (!restaurant) {
      restaurant = {
        id: restaurantId || 'rest_active',
        name: opportunityPayload?.restaurantName || 'Chez Chiro',
        address: 'Paris, France',
        city: 'Paris',
        country: 'FR',
        type: 'Bistrot & Gastronomie',
        profile: {
          tone: 'Chaleureux, authentique et accueillant',
          colors: ['#ff5a00', '#111827', '#f3f4f6'],
          customRules: {
            targetAudience: ['Clientèle locale', 'Habitués du quartier', 'Amateurs de cuisine du terroir']
          }
        }
      };
    }

    // Si opportunité non trouvée en base, construction avec le payload reçu
    const oppTitle = opportunityPayload?.title || opp?.title || 'Offre Spéciale du Jour';
    const oppDesc = opportunityPayload?.description || opp?.description || opportunityPayload?.signalOrigin || 'Formule exclusive préparée pour ce midi.';
    const factsList = Array.isArray(opportunityPayload?.factsCited)
      ? opportunityPayload.factsCited
      : Array.isArray(opportunityPayload?.verifiedFacts)
      ? opportunityPayload.verifiedFacts
      : Array.isArray(opp?.factsCited)
      ? opp.factsCited
      : [opportunityPayload?.signalOrigin || 'Action alignée sur les signaux du jour.'];

    const codeWord = (
      opportunityPayload?.codeWord ||
      opportunityPayload?.offer?.codeWord ||
      opp?.offerDetails?.codeWord ||
      opp?.codeWord ||
      'SPECIAL'
    ).toString().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'SPECIAL';

    const offerLabel =
      opportunityPayload?.offer?.label ||
      opp?.offerDetails?.label ||
      oppTitle;
    const offerDetails =
      opportunityPayload?.offer?.details ||
      opp?.offerDetails?.details ||
      oppDesc;

    if (!opp) {
      try {
        opp = await (prisma as any).opportunity.create({
          data: {
            id: opportunityId,
            restaurantId: restaurant.id,
            title: oppTitle,
            description: oppDesc,
            urgency: 'high',
            relevanceScore: 0.85,
            factsCited: factsList,
            status: 'pending',
          },
          include: {
            restaurant: { include: { profile: true } },
          },
        });
      } catch {
        opp = {
          id: opportunityId,
          restaurantId: restaurant.id,
          title: oppTitle,
          description: oppDesc,
          factsCited: factsList,
          codeWord,
          offerDetails: {
            label: offerLabel,
            details: offerDetails,
            codeWord,
          },
          restaurant,
        };
      }
    }

    const profile = restaurant?.profile || {};
    const customRules = (profile.customRules as Record<string, any>) || {};
    const targetAudience = Array.isArray(customRules.targetAudience)
      ? customRules.targetAudience.join(', ')
      : 'Clientèle locale et actifs du quartier';
    const brandTone = profile.tone || profile.toneOfVoice || 'Chaleureux, authentique et accueillant';
    const colorPalette = profile.colors || ['#ff5a00', '#111827', '#f3f4f6'];

    // =========================================================================
    // ÉTAPE 1 : GPT-4O-MINI RÉDIGE LA LÉGENDE DU POST
    // =========================================================================
    let postText = '';
    const cleanName = (restaurant.name || 'Restaurant').replace(/[^a-zA-Z0-9]/g, '');

    if (key) {
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
- Restaurant : ${restaurant.name} à ${restaurant.city || restaurant.address || 'France'}
- Opportunité / Événement : ${oppTitle} (${oppDesc})
- Formule / Plat promu : ${offerLabel} (${offerDetails})
- Mot-code comptoir : ${codeWord}
- Faits vérifiés : ${factsList.join(' • ')}

Rédige le texte complet pour ${platform} en français naturel.`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const gptMiniRes = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${key}`,
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
        }).finally(() => clearTimeout(timeoutId));

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

    // Fallback texte soigné en français
    if (!postText) {
      postText = `✨ ${oppTitle} chez ${restaurant.name} !\n\nProfitez de notre offre spéciale : ${offerLabel} (${offerDetails}).\n\n👉 Dites simplement le code "${codeWord}" à notre équipe au comptoir pour en profiter !\n\n📍 ${restaurant.name}, ${restaurant.address || restaurant.city || ''}\n#${cleanName} #restaurant #gastronomie #bonplan`;
    }

    // =========================================================================
    // ÉTAPE 2 : CLAUDE (OPENROUTER) DIRECTEUR ARTISTIQUE : AFFICHE PUBLICITAIRE RESTAURANT
    // =========================================================================
    let visualPrompt = '';
    const artDirectionPrompt = `High-end commercial restaurant advertising poster for Instagram and Facebook featuring delicious ${offerLabel}, ${offerDetails}. The composition is styled as an authentic ${restaurant.type || 'warm French bistro'} promotional campaign poster with elegant chalkboard and slate banner layout, warm ambient candlelight, decorative culinary herbs, appetizing presentation, 8k resolution, professional food promo flyer artwork, no distorted letters.`;

    if (key) {
      try {
        const claudeSystemPrompt = `You are an elite graphic designer and advertising creative director specializing in restaurant marketing posters and social media promotional flyers.
Your mission is to write an image generation prompt in English for an EYE-CATCHING RESTAURANT ADVERTISING POSTER / SOCIAL MEDIA PROMO FLYER.

CRITICAL DIRECTIVES:
1. THIS IS AN ADVERTISING POSTER / PROMO GRAPHIC FLYER, NOT A SIMPLE PHOTO OF A DISH.
2. The visual must look like a high-end commercial restaurant campaign poster designed for Instagram & Facebook.
3. Central focal point: The featured culinary specialty ("${offerLabel}") presented with stunning styling, appetizing textures, soft steam, rich colors, and delicious presentation.
4. Poster composition & layout: Integrate sleek restaurant promotional poster aesthetics—warm ambient dining atmosphere, slate or chalkboard textured menu framing, elegant subtle decorative culinary herbs, warm festive bistro bokeh lights, and stylish advertising flyer balance.
5. Brand atmosphere: ${brandTone}, color accents matching ${Array.isArray(colorPalette) ? colorPalette.join(', ') : '#ff5a00'}.
6. Aspect ratio: 1:1 square.
7. Output ONLY the raw descriptive prompt in English (2-3 rich, evocative sentences). No title, no quotes, no markdown, no commentary.`;

        const claudeUserPrompt = `Create an advertising poster image prompt for:
- Restaurant: ${restaurant.name} (${restaurant.type || 'Bistrot & Gastronomie'})
- City: ${restaurant.city || restaurant.address || 'France'}
- Promoted Offer / Dish: ${offerLabel} (${offerDetails})
- Code Word: ${codeWord}
- Occasion / Signal: ${oppTitle} (${oppDesc})
- Target audience: ${targetAudience}`;

        const claudeModels = [
          'anthropic/claude-haiku-4.5',
          'anthropic/claude-3.5-sonnet:beta',
          'openai/gpt-4o-mini',
        ];

        for (const cMod of claudeModels) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const claudeRes = await fetch(`${baseUrl}/chat/completions`, {
              method: 'POST',
              signal: controller.signal,
              headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://getspecial.dev',
                'X-Title': 'GetSpecial Poster Art Director',
              },
              body: JSON.stringify({
                model: cMod,
                temperature: 0.6,
                messages: [
                  { role: 'system', content: claudeSystemPrompt },
                  { role: 'user', content: claudeUserPrompt },
                ],
              }),
            }).finally(() => clearTimeout(timeoutId));

            if (claudeRes.ok) {
              const claudeData = await claudeRes.json();
              const p = claudeData.choices?.[0]?.message?.content?.trim();
              if (p && !p.startsWith('{') && p.length > 30) {
                // Nettoyer les éventuels préfixes markdown
                visualPrompt = p.replace(/^#+.*?\n+/g, '').replace(/^"|"$/g, '').trim();
                break;
              }
            }
          } catch (cErr: any) {
            console.warn(`[CLAUDE_${cMod}_ERROR]`, cErr.message);
          }
        }
      } catch (promptErr: any) {
        console.warn('[IMAGE_PROMPT_GEN_ERROR]', promptErr.message);
      }
    }

    if (!visualPrompt) {
      visualPrompt = artDirectionPrompt;
    }

    // =========================================================================
    // ÉTAPE 3 : GPT-IMAGE-2 GÉNÈRE L'IMAGE HAUTE DÉFINITION
    // =========================================================================
    let imageUrl: string | null = null;
    const imageModelToUse = process.env.IMAGE_MODEL || 'openai/gpt-image-2';

    if (key) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const imgRes = await fetch(`${baseUrl}/images`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: imageModelToUse,
            prompt: visualPrompt,
          }),
        }).finally(() => clearTimeout(timeoutId));

        if (imgRes.ok) {
          const imgData = await imgRes.json();
          const firstImg = imgData.data?.[0];
          if (firstImg?.url) {
            imageUrl = firstImg.url;
          } else if (firstImg?.b64_json) {
            const uploadsDir = path.join(process.cwd(), 'public', 'generated');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const cleanId = String(opportunityId).replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileName = `post-${cleanId}-${Date.now()}.png`;
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, Buffer.from(firstImg.b64_json, 'base64'));
            imageUrl = `/generated/${fileName}`;
          }
        } else {
          const errText = await imgRes.text();
          console.warn('[GPT_IMAGE_2_HTTP_ERROR]', imgRes.status, errText);
        }
      } catch (imgErr: any) {
        console.warn('[GPT_IMAGE_2_ERROR]', imgErr.message);
      }
    }

    // Fallback photographique contextuel gastronomique
    if (!imageUrl) {
      const factsStr = (oppTitle + ' ' + oppDesc + ' ' + offerLabel + ' ' + (restaurant.type || '')).toLowerCase();
      if (factsStr.includes('soleil') || factsStr.includes('terrasse') || factsStr.includes('salade') || factsStr.includes('patio')) {
        imageUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
      } else if (factsStr.includes('burger') || factsStr.includes('match') || factsStr.includes('sport') || factsStr.includes('pinte')) {
        imageUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';
      } else if (factsStr.includes('viande') || factsStr.includes('steak') || factsStr.includes('grill') || factsStr.includes('chiro')) {
        imageUrl = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
      } else if (factsStr.includes('fête') || factsStr.includes('soir') || factsStr.includes('vin') || factsStr.includes('cocktail')) {
        imageUrl = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80';
      } else {
        imageUrl = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';
      }
    }

    // Sauvegarde en base de données Supabase / Prisma avec résilience totale
    let post;
    try {
      post = await withDbTimeout(
        (prisma as any).post.create({
          data: {
            restaurantId: restaurant.id,
            opportunityId: opp?.id === opportunityId ? opp.id : null,
            platform,
            text: postText,
            imageUrl,
            status: 'pending_approval',
            verifiedFacts: factsList,
          },
        }),
        2500,
        null
      );
    } catch {
      post = null;
    }

    if (!post) {
      try {
        post = await withDbTimeout(
          (prisma as any).post.create({
            data: {
              restaurantId: restaurant.id,
              platform,
              text: postText,
              imageUrl,
              status: 'pending_approval',
              verifiedFacts: factsList,
            },
          }),
          2500,
          null
        );
      } catch {
        post = null;
      }
    }

    if (!post) {
      post = {
          id: `post_${Date.now()}`,
          restaurantId: restaurant.id,
          opportunityId,
          platform,
          text: postText,
          imageUrl,
          status: 'pending_approval',
          verifiedFacts: factsList,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
    }

    try {
      await logAudit({
        restaurantId: restaurant.id,
        action: 'post.generated_multi_model',
        entityType: 'post',
        entityId: post.id,
        details: {
          platform,
          opportunityId,
          captionModel: 'openai/gpt-4o-mini',
          promptModel: 'openai/gpt-4o-mini',
          imageModel: imageModelToUse,
        },
      });
    } catch {
      // Non bloquant
    }

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

