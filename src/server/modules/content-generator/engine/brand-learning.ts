import { prisma } from '@/server/db/prisma.client';

const DECAY = 0.85;
const SIGNAL = 0.15;

/**
 * Met à jour les préférences de marque apprises lors d'une publication ou notation réussie
 */
export async function updateBrandLearning(restaurantId: string, post: any): Promise<void> {
  if (!restaurantId || !post) return;

  try {
    const posterFamily = post?.generationPayload?.advertising_concept?.poster_family;
    const mainHero = post?.generationPayload?.advertising_concept?.main_hero;
    const styleReference = post?.generationPayload?.creative_dna?.style_reference;

    if (!posterFamily && !mainHero && !styleReference) return;

    const profile = await (prisma as any).restaurantProfile.findUnique({
      where: { restaurantId },
    });

    if (!profile) return;

    const customRules = (profile.customRules as Record<string, any>) || {};
    const brandLearning = customRules.brandLearning || {};

    const posterFamilies = { ...(brandLearning.posterFamilies || {}) };
    const mainHeroes = { ...(brandLearning.mainHeroes || {}) };
    const styleReferences = { ...(brandLearning.styleReferences || {}) };

    const bump = (bag: Record<string, number>, key?: string) => {
      if (!key) return;
      const prev = typeof bag[key] === 'number' ? bag[key] : 0;
      bag[key] = Math.round((DECAY * prev + SIGNAL * 1) * 1000) / 1000;
    };

    bump(posterFamilies, posterFamily);
    bump(mainHeroes, mainHero);
    bump(styleReferences, styleReference);

    const generationCount = (brandLearning.generationCount || 0) + 1;

    await (prisma as any).restaurantProfile.update({
      where: { restaurantId },
      data: {
        customRules: {
          ...customRules,
          brandLearning: {
            posterFamilies,
            mainHeroes,
            styleReferences,
            generationCount,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    });
  } catch (err: any) {
    // Non bloquant : l'apprentissage ne doit jamais empêcher la publication
    console.warn('[BRAND_LEARNING_UPDATE_WARN]', err?.message);
  }
}
