import { prisma } from '@/server/db/prisma.client';
import { logAudit } from '@/server/lib/audit';
import { buildCreativeMemory } from './engine/creative-memory';
import { generateCreativeDNA } from './engine/strategist.engine';
import { generateArtDirectionAndCopy } from './engine/art-director.engine';
import { generatePostImage } from './engine/openrouter-image';
import { updateBrandLearning } from './engine/brand-learning';
import {
  AspectRatio,
  CampaignType,
  GenerationMode,
  GenerationResult,
  FoodProfile,
  AdvertisingConcept,
  CreativeDNA,
} from './engine/types';

export class ContentGeneratorService {
  /**
   * Pipeline IA unifié à 3 cerveaux avec mémoire créative et régénération guidée
   */
  async generateOrRegeneratePost(params: {
    restaurantId: string;
    mode?: GenerationMode;
    postId?: string;
    offer: string;
    details?: string;
    campaignType?: CampaignType;
    aspectRatio?: AspectRatio;
    style?: string;
    platform?: string;
    referenceImages?: string[];
    userFeedback?: string;
    opportunityId?: string;
    codeWord?: string;
    weatherSummary?: string;
  }): Promise<GenerationResult> {
    const {
      restaurantId,
      mode = 'generate',
      postId,
      offer,
      details = '',
      campaignType = 'promotion',
      aspectRatio = '4:5',
      style,
      platform = 'instagram',
      referenceImages = [],
      userFeedback,
      opportunityId,
      codeWord,
      weatherSummary,
    } = params;

    // 1. Récupération du restaurant
    let restaurant = await (prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      include: { profile: true },
    });

    if (!restaurant) {
      restaurant = await (prisma as any).restaurant.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      });
    }

    if (!restaurant) {
      throw new Error(`Établissement introuvable (${restaurantId}).`);
    }

    // 2. Récupérer les 10 derniers posts pour la mémoire créative anti-répétition
    let recentPosts: any[] = [];
    try {
      recentPosts = await (prisma as any).post.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    } catch {
      recentPosts = [];
    }

    const creativeMemory = buildCreativeMemory(recentPosts, restaurant.profile || {});

    // 3. Si mode régénération, extraire le previousFoodProfile du post existant
    let existingPost: any = null;
    let previousFoodProfile: FoodProfile | null = null;

    if (postId) {
      try {
        existingPost = await (prisma as any).post.findUnique({
          where: { id: postId },
        });
        if (existingPost?.generationPayload?.food_profile) {
          previousFoodProfile = existingPost.generationPayload.food_profile;
        }
      } catch {}
    }

    // Enrichir l'offre avec le mot-code si opportunité
    let enrichedOffer = offer;
    if (codeWord && !enrichedOffer.includes(codeWord)) {
      enrichedOffer += ` (Code secret comptoir : ${codeWord})`;
    }

    // =========================================================================
    // CERVEAU 1 : STRATÈGE CRÉATIF (GPT-4o-mini)
    // =========================================================================
    let strategistResult: {
      food_profile: FoodProfile;
      advertising_concept: AdvertisingConcept;
      creative_dna: CreativeDNA;
    };

    try {
      strategistResult = await generateCreativeDNA({
        restaurant,
        offer: enrichedOffer,
        details,
        campaignType,
        style,
        platform,
        creativeMemory,
        previousFoodProfile: mode === 'regenerate_different' ? previousFoodProfile : undefined,
        userFeedback,
        weatherSummary,
      });
    } catch (stratErr: any) {
      console.warn('[STRATEGIST_FALLBACK]', stratErr?.message);
      // Fallback déterministe
      strategistResult = {
        food_profile: {
          meal_category: 'plat',
          cuisine: restaurant.type || 'Bistrot',
          hero_product: offer,
          authenticity_notes: ['Fait maison', 'Produits frais'],
        },
        advertising_concept: {
          poster_family: 'Editorial',
          camera_angle: 'tilted_45deg',
          lighting_family: 'natural_window',
          main_message: offer,
          visual_hook: 'Présentation gourmande et fraîche',
          main_hero: 'food',
        },
        creative_dna: {
          brand_personality: restaurant.profile?.tone || 'Chaleureux',
          visual_world: 'Bistrot moderne et accueillant',
          photography_style: 'Lumière naturelle et textures gourmandes',
          food_scale: 'medium shot aéré',
        },
      };
    }

    // Régénération : verrouillage programmatique de l'identité du plat même si le modèle dérive
    if (mode === 'regenerate_different' && previousFoodProfile?.hero_product) {
      strategistResult.food_profile = {
        ...strategistResult.food_profile,
        hero_product: previousFoodProfile.hero_product,
        cuisine: previousFoodProfile.cuisine || strategistResult.food_profile?.cuisine,
        serving_style: previousFoodProfile.serving_style || strategistResult.food_profile?.serving_style,
      };
    }

    // =========================================================================
    // CERVEAU 2 : DIRECTEUR ARTISTIQUE & COPYWRITER (Claude 3.5 Sonnet / Haiku)
    // =========================================================================
    let copyResult;
    try {
      copyResult = await generateArtDirectionAndCopy({
        restaurant,
        offer: enrichedOffer,
        details,
        aspectRatio,
        style,
        platform,
        foodProfile: strategistResult.food_profile,
        advertisingConcept: strategistResult.advertising_concept,
        creativeDNA: strategistResult.creative_dna,
      });
    } catch (artErr: any) {
      console.warn('[ART_DIRECTOR_FALLBACK]', artErr?.message);
      const cleanRestTag = '#' + restaurant.name.replace(/[^a-zA-Z0-9]/g, '');
      const defaultHeadline = offer
        .replace(/['’‘`]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 4)
        .join(' ')
        .toUpperCase();
      copyResult = {
        creative_concept: 'Mise en avant gourmande du plat',
        dominant_emotion: 'Désir',
        artistic_direction: 'Photographie naturelle de restaurant',
        headline: defaultHeadline,
        instagram_caption: `✨ Découvrez notre création du jour : ${offer} !\n\n${details || 'Préparé avec passion par notre équipe.'}\n\n📍 ${restaurant.name}, ${restaurant.address || 'centre-ville'}\n👉 Rendez-vous au restaurant pour vous régaler !\n\n${cleanRestTag} #restaurant #bonneadresse #faitmaison`,
        facebook_caption: `Envie d'un moment gourmand chez ${restaurant.name} ? 🍽️\n\nAujourd'hui, profitez de notre spécialité : ${offer}.\n${details ? `\n${details}\n` : ''}\nPrenez place dans notre salle chaleureuse ou contactez-nous pour réserver. À très vite !\n\n${cleanRestTag} #restaurant #convivialite #foodlover`,
        hashtags: [cleanRestTag, '#restaurant', '#foodie', '#bonneadresse'],
        cta: `Rendez-vous chez ${restaurant.name}`,
        poster_prompt: `Commercial high-end food photography of ${offer}, appetizing presentation, warm natural bistro lighting, 8k professional promo flyer layout, negative space for text, aspect ratio ${aspectRatio}.`,
      };
    }

    // Normalisation stricte du headline (≤ 4 mots MAJUSCULES) et des hashtags (3 à 5 max)
    copyResult.headline = String(copyResult.headline || offer)
      .replace(/['’‘`"]/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 4)
      .join(' ')
      .toUpperCase();

    if (Array.isArray(copyResult.hashtags)) {
      copyResult.hashtags = copyResult.hashtags
        .map((h: string) => '#' + String(h).replace(/^#+/, '').trim())
        .filter((h: string) => h.length > 1)
        .slice(0, 5);
    }

    // =========================================================================
    // CERVEAU 3 : GÉNÉRATEUR VISUEL (GPT-Image-2 via OpenRouter)
    // =========================================================================
    let imageUrl = '';
    try {
      const imgRes = await generatePostImage(copyResult.poster_prompt, {
        aspectRatio,
        referenceImages,
        logoUrl: restaurant.profile?.logoUrl || null,
        restaurantName: restaurant.name,
      });
      imageUrl = imgRes.imageUrl;
    } catch (imgErr: any) {
      console.warn('[IMAGE_GENERATOR_ERROR]', imgErr?.message);
      // Fallback vers photo existante du plat ou du restaurant
      const dishCandidates = (restaurant.profile as any)?.customRules?.dishes;
      const matchedDish = Array.isArray(dishCandidates)
        ? dishCandidates.find(
            (d: any) =>
              d.photoUrl &&
              (offer.toLowerCase().includes(d.name.toLowerCase()) ||
                d.name.toLowerCase().includes(offer.toLowerCase()))
          )
        : null;

      if (matchedDish?.photoUrl) {
        imageUrl = matchedDish.photoUrl;
      } else if (restaurant.profile?.photos && restaurant.profile.photos.length > 0) {
        imageUrl = restaurant.profile.photos[0];
      }
    }

    // 4. Persistance en base de données
    const generationPayload = {
      food_profile: strategistResult.food_profile,
      advertising_concept: strategistResult.advertising_concept,
      creative_dna: strategistResult.creative_dna,
      poster_prompt: copyResult.poster_prompt,
      headline: copyResult.headline,
      cta: copyResult.cta,
      creative_concept: copyResult.creative_concept,
      artistic_direction: copyResult.artistic_direction,
      aspect_ratio: aspectRatio,
      campaign_type: campaignType,
    };

    let post: any;
    if (postId && existingPost) {
      post = await (prisma as any).post.update({
        where: { id: postId },
        data: {
          platform,
          text: copyResult.instagram_caption,
          headline: copyResult.headline,
          instagramCaption: copyResult.instagram_caption,
          facebookCaption: copyResult.facebook_caption,
          hashtags: copyResult.hashtags,
          imageUrl: imageUrl || existingPost.imageUrl,
          aspectRatio,
          campaignType,
          referenceImages,
          generationPayload,
          status: 'ready',
        },
      });
    } else {
      post = await (prisma as any).post.create({
        data: {
          restaurantId: restaurant.id,
          opportunityId: opportunityId || null,
          platform,
          status: 'ready',
          origin: 'generated',
          text: copyResult.instagram_caption,
          headline: copyResult.headline,
          instagramCaption: copyResult.instagram_caption,
          facebookCaption: copyResult.facebook_caption,
          hashtags: copyResult.hashtags,
          imageUrl,
          aspectRatio,
          campaignType,
          referenceImages,
          generationPayload,
          verifiedFacts: [offer, details, restaurant.name].filter(Boolean),
        },
      });
    }

    await logAudit({
      restaurantId: restaurant.id,
      action: mode === 'regenerate_different' ? 'post.regenerated' : 'post.generated_3_brains',
      entityType: 'post',
      entityId: post.id,
      details: {
        campaignType,
        aspectRatio,
        mode,
        hasReferences: referenceImages.length > 0,
      },
    });

    return {
      post,
      generatedData: {
        id: post.id,
        headline: copyResult.headline,
        instagramCaption: copyResult.instagram_caption,
        facebookCaption: copyResult.facebook_caption,
        caption: copyResult.instagram_caption,
        hashtags: copyResult.hashtags,
        imageUrl,
        aspectRatio,
        campaignType,
        posterPrompt: copyResult.poster_prompt,
        foodProfile: strategistResult.food_profile,
        advertisingConcept: strategistResult.advertising_concept,
        creativeDNA: strategistResult.creative_dna,
      },
    };
  }

  /**
   * Création directe d'un post avec upload utilisateur (Workflow B : 0 crédit IA, carrousel ou vidéo)
   */
  async createDirectUploadPost(params: {
    restaurantId: string;
    caption: string;
    mediaUrls: string[];
    mediaType?: 'image' | 'carousel' | 'video';
    aspectRatio?: AspectRatio;
    platform?: string;
    scheduledAt?: Date;
  }) {
    const {
      restaurantId,
      caption,
      mediaUrls,
      mediaType = mediaUrls.length > 1 ? 'carousel' : 'image',
      aspectRatio = '4:5',
      platform = 'instagram',
      scheduledAt,
    } = params;

    // Extraction automatique des hashtags du texte (#hashtag)
    const hashtagRegex = /#([a-zA-Z0-9_\u00C0-\u017F]+)/g;
    const matches = caption.match(hashtagRegex) || [];
    const hashtags = Array.from(new Set(matches));

    const post = await (prisma as any).post.create({
      data: {
        restaurantId,
        platform,
        status: scheduledAt ? 'scheduled' : 'pending_approval',
        origin: 'user_upload',
        text: caption,
        instagramCaption: caption,
        facebookCaption: caption,
        hashtags,
        imageUrl: mediaUrls[0] || null,
        mediaUrls,
        mediaType,
        aspectRatio,
        scheduledAt: scheduledAt || null,
        verifiedFacts: [caption.slice(0, 50)],
      },
    });

    await logAudit({
      restaurantId,
      action: 'post.direct_upload',
      entityType: 'post',
      entityId: post.id,
      details: {
        mediaType,
        mediaCount: mediaUrls.length,
        hasSchedule: Boolean(scheduledAt),
      },
    });

    return post;
  }

  /**
   * Méthode appelée depuis les opportunités automatiques du Dashboard
   */
  async generatePostForOpportunity(
    opportunityId: string,
    restaurantId: string,
    platform: 'instagram' | 'facebook' | 'google_business' = 'instagram',
    opportunityPayload?: any
  ) {
    const oppTitle = opportunityPayload?.title || 'Offre Spéciale du Jour';
    const oppDesc = opportunityPayload?.description || opportunityPayload?.signalOrigin || 'Formule exclusive préparée pour ce midi.';
    const codeWord = opportunityPayload?.codeWord || 'SPECIAL';

    const result = await this.generateOrRegeneratePost({
      restaurantId,
      opportunityId,
      offer: oppTitle,
      details: oppDesc,
      codeWord,
      campaignType: 'promotion',
      aspectRatio: '4:5',
    });

    // Rendre le post prêt
    return result.post;
  }

  /**
   * Mise à jour d'un post par le gérant
   */
  async updatePost(
    postId: string,
    restaurantId: string,
    text?: string,
    imageUrl?: string,
    platform?: string,
    extraFields?: {
      headline?: string;
      instagramCaption?: string;
      facebookCaption?: string;
      hashtags?: string[];
      rating?: number;
    }
  ) {
    const data: Record<string, any> = {};
    if (text !== undefined) data.text = text;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (platform !== undefined) data.platform = platform;
    if (extraFields?.headline !== undefined) data.headline = extraFields.headline;
    if (extraFields?.instagramCaption !== undefined) data.instagramCaption = extraFields.instagramCaption;
    if (extraFields?.facebookCaption !== undefined) data.facebookCaption = extraFields.facebookCaption;
    if (extraFields?.hashtags !== undefined) data.hashtags = extraFields.hashtags;

    const updated = await (prisma as any).post.update({
      where: { id: postId, restaurantId },
      data,
    });

    if (extraFields?.rating) {
      await updateBrandLearning(restaurantId, updated);
    }

    await logAudit({
      restaurantId,
      action: 'post.update',
      entityType: 'post',
      entityId: postId,
      details: data,
    });

    return updated;
  }

  /**
   * Wrapper de compatibilité pour l'ancienne route /api/posts/generate-image
   */
  async generateAiImage(params: {
    title: string;
    description?: string;
    style?: string;
    restaurantName?: string;
    platform?: string;
    discountValue?: string;
  }): Promise<{ imageUrl: string; visualPrompt: string }> {
    const prompt = `Commercial advertising poster photograph of ${params.title}, appetizing presentation, natural restaurant lighting, high resolution.`;
    const res = await generatePostImage(prompt, {
      aspectRatio: '4:5',
      restaurantName: params.restaurantName,
    });
    return {
      imageUrl: res.imageUrl,
      visualPrompt: prompt,
    };
  }

  /**
   * Génération / Réécriture de légende via le Cerveau 2 (Art Director & Copywriter)
   * avec fallback dynamique à 4 angles créatifs
   */
  async generateCopywriting(input: {
    restaurantId?: string;
    restaurantName: string;
    address?: string;
    city?: string;
    sourceType?: 'offer' | 'event' | 'custom';
    title: string;
    description?: string;
    discountValue?: string;
    platform?: 'instagram' | 'facebook' | 'google_business';
    style?: 'gourmet' | 'festive' | 'chic' | 'deal';
    tone?: string;
    angleIndex?: number;
  }): Promise<{
    caption: string;
    instagramCaption?: string;
    facebookCaption?: string;
    hook: string;
    cta: string;
    hashtags: string[];
    isAiGenerated: boolean;
    modelUsed: string;
  }> {
    const angleDirections = [
      'Sensations gustatives, savoir-faire artisanal et fraîcheur des produits',
      'Convivialité, partage et ambiance chaleureuse en salle',
      'Offre exclusive irrésistible et appel à l’action direct',
      'Le mot du Chef et inspiration du marché du jour',
    ];
    const chosenAngle =
      typeof input.angleIndex === 'number'
        ? Math.abs(input.angleIndex) % angleDirections.length
        : Math.floor(Math.random() * angleDirections.length);

    try {
      const copyOut = await generateArtDirectionAndCopy({
        restaurant: {
          name: input.restaurantName,
          address: input.address || '',
          city: input.city || '',
          profile: { tone: input.tone || 'Chaleureux et gourmand' },
        },
        offer: input.discountValue ? `${input.title} (${input.discountValue})` : input.title,
        details: input.description || '',
        aspectRatio: '4:5',
        foodProfile: {
          hero_product: input.title,
          cuisine: 'Bistrot & Gastronomie',
        },
        advertisingConcept: {
          poster_family: input.style === 'chic' ? 'Luxury' : input.style === 'festive' ? 'Lifestyle' : 'Editorial',
          main_message: input.title,
          emotion_goal: angleDirections[chosenAngle],
        },
        creativeDNA: {
          brand_personality: input.tone || 'Chaleureux et gourmand',
          creative_direction: `Angle éditorial imposé : ${angleDirections[chosenAngle]}`,
        },
      });

      const selectedCaption =
        input.platform === 'facebook'
          ? copyOut.facebook_caption || copyOut.instagram_caption
          : copyOut.instagram_caption;

      return {
        caption: selectedCaption,
        instagramCaption: copyOut.instagram_caption,
        facebookCaption: copyOut.facebook_caption,
        hook: copyOut.headline || input.title,
        cta: copyOut.cta || `Rendez-vous chez ${input.restaurantName}`,
        hashtags: copyOut.hashtags || [],
        isAiGenerated: true,
        modelUsed: process.env.OPENROUTER_TEXT_MODEL || process.env.OPENROUTER_MODEL || 'google/gemini-3.8-flash',
      };
    } catch {
      const cleanRestTag = '#' + input.restaurantName.replace(/[^a-zA-Z0-9]/g, '');
      const cleanTitle = input.title.trim();
      const details = input.description?.trim() ? `\n\n${input.description.trim()}` : '';
      const discountLine = input.discountValue?.trim() ? `\n\nAvantage exclusif : ${input.discountValue.trim()}` : '';

      const hooks = [
        `À la carte : ${cleanTitle}`,
        `Envie d'une pause gourmande chez ${input.restaurantName} ?`,
        `Formule du moment : ${cleanTitle}`,
        `La création du jour par le Chef : ${cleanTitle}`,
      ];
      const bodies = [
        `Des ingrédients soigneusement sélectionnés, une cuisson maîtrisée et toute la passion de notre brigade réunis dans votre assiette.${details}${discountLine}`,
        `Prenez place dans notre salle chaleureuse et découvrez notre spécialité : ${cleanTitle}.${details}${discountLine}`,
        `Faites voyager vos papilles aujourd'hui avec notre coup de cœur du moment.${details}${discountLine}`,
        `Inspiré par le marché du matin, notre chef a imaginé cette recette gourmande et généreuse.${details}${discountLine}`,
      ];

      const hook = hooks[chosenAngle];
      const cta = `Rendez-vous chez ${input.restaurantName}${input.address ? ` (${input.address})` : ''}.`;
      const hashtags = [cleanRestTag, '#restaurant', '#foodie', '#bonneadresse', '#faitmaison'];
      const caption = `${hook}\n\n${bodies[chosenAngle]}\n\n${cta}\n\n${hashtags.join(' ')}`;

      return {
        caption,
        instagramCaption: caption,
        facebookCaption: caption,
        hook,
        cta,
        hashtags,
        isAiGenerated: false,
        modelUsed: 'deterministic-4-angles',
      };
    }
  }

}

export const contentGeneratorService = new ContentGeneratorService();
