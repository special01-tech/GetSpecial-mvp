import { getLocalePack } from './localePack';
import { getDishProfile, DishProfile } from './dishProfile';
import { runConceptStep, ConceptOutput } from './concept';
import { selectDAFamily, DASelection } from './daSelect';
import { buildCompositionPrompt, runCompositionStep } from './composition';
import { runCaptionsStep, CaptionChannel } from './captions';
import { selectAngle } from './angles';
import { selectMaterials } from './materials';
import { analyzeOffer } from './offerStructure';
import { selectVariety, publicProfileForConcept, Variety } from './variety';
import { hasRealBrandColor, resolvePalette } from './palettes';
import { inferServingTemperature, NO_REFERENCES, ReferenceRoles, ServingTemperature } from './realism';

/** Une creation precedente du restaurant, pour eviter les repetitions. */
export interface RecentCreation {
  headline?: string | null;
  cta?: string | null;
  caption?: string | null;
  daFamily?: string | null;
  marketingAngle?: string | null;
  variety?: { headlineStyle?: string; cta?: string; textScale?: string; camera?: string; placement?: string } | null;
  materials?: string[] | null;
  /** Note (1 a 5) donnee par l'utilisateur, si elle existe. */
  rating?: number | null;
}

export interface PipelineInput {
  userId: string;
  publicationId: string;
  profile: Record<string, any>;
  offer: string;
  details: string;
  campaignType?: string | null;
  aspectRatio: string;
  outputLanguage: string;
  /** Meteo, evenements, apprentissage de la marque. */
  context?: Record<string, unknown> | null;
  recent: RecentCreation[];
  /** Images de reference deja converties en data URI, dans l'ordre decrit par `referenceRoles`. */
  referenceImages: string[];
  referenceRoles?: ReferenceRoles;
  mode?: string;
  userFeedback?: string | null;
  /** Famille de la creation en cours de regeneration. */
  previousFamilyId?: string | null;
  /** Date du jour dans le fuseau du restaurant (AAAA-MM-JJ). */
  dateStr: string;
  /** Familles de direction artistique deja utilisees par le compte (une quarantaine de creations, de la plus recente a la plus ancienne). */
  familyHistory?: { id: string; rating?: number | null }[];
  /** Essai sans compte : textes repères (« Votre numéro », « Votre logo ») au lieu de coordonnées inventées. */
  placeholders?: { phone: string; logo: string } | null;
}

export interface PipelineResult {
  concept: ConceptOutput;
  angle: { id: string; brief: string };
  variety: Variety;
  materialIds: string[];
  selection: DASelection;
  temperature: ServingTemperature;
  dishProfile: DishProfile | null;
  captions: CaptionChannel[];
  compositionPrompt: string;
  image: { buffer: Buffer; mimeType: string; referenceImagesDropped: boolean } | null;
  imageError: string | null;
  timings: Record<string, number>;
}

const pickText = (channel: CaptionChannel | undefined, tone?: string) => {
  const variants = channel?.variants || [];
  return variants.find((v) => v.tone === tone) || variants[0];
};

/** Texte et hashtags des legendes tels que l'application les stocke (Instagram / Facebook). */
export function captionFields(captions: CaptionChannel[]) {
  const ig = pickText(captions.find((c) => c.channel === 'instagram'));
  const fb = pickText(captions.find((c) => c.channel === 'facebook'));
  const clean = (tags: string[] | undefined) =>
    (tags || []).map((h) => String(h).replace(/^#+/, '').trim()).filter(Boolean).slice(0, 5);
  return {
    instagramCaption: ig?.text || '',
    facebookCaption: fb?.text || ig?.text || '',
    hashtags: clean(ig?.hashtags || fb?.hashtags),
  };
}

/**
 * Chaine complete de creation d'une affiche, dans une seule requete :
 * concept -> famille de direction artistique -> (composition || legendes).
 * Le controle qualite par modele de vision est volontairement absent pour l'instant.
 */
export async function runCreativePipeline(input: PipelineInput): Promise<PipelineResult> {
  const timings: Record<string, number> = {};
  const mark = (name: string, since: number) => { timings[name] = Date.now() - since; };
  const { profile, offer, details } = input;

  let t = Date.now();
  const [localePack, dishProfile] = await Promise.all([
    getLocalePack(null),
    getDishProfile(offer).catch(() => null),
  ]);
  mark('dish_profile_ms', t);

  const placeholders = input.placeholders || null;
  const phone = placeholders ? placeholders.phone : profile.phone_number || profile.phone || profile.whatsapp || null;
  // Couleurs de marque reelles uniquement : sans elles, la famille de direction artistique garde sa palette (plus de diversite).
  const realBrand = hasRealBrandColor(profile);
  const palette = realBrand ? resolvePalette(profile) : null;
  const brandColors: string[] = palette ? [palette.primary, palette.accent] : [];
  const recentHeadlines = input.recent.map((r) => r.headline).filter((x): x is string => !!x).slice(0, 8);
  const recentCtas = input.recent.map((r) => r.cta).filter((x): x is string => !!x).slice(0, 8);
  // Notes de l'utilisateur sur ses creations passees : le ton des mieux notees guide, celui des moins bien notees est evite.
  const ratingFeedback = {
    loved: input.recent.filter((r) => (r.rating || 0) >= 4 && r.headline).map((r) => r.headline as string).slice(0, 3),
    disliked: input.recent.filter((r) => r.rating && r.rating <= 2 && r.headline).map((r) => r.headline as string).slice(0, 3),
  };

  const isEvent = input.campaignType === 'event';
  // Pour un evenement de l'utilisateur, les evenements du calendrier (match, fete...) ne s'y melent pas.
  const context = isEvent && input.context ? { ...(input.context as object), events: [] } : input.context;
  const ctx = (context || {}) as { weather?: any; events?: any[] };
  const angle = selectAngle({
    campaignType: input.campaignType,
    offerText: `${offer} ${details}`,
    weather: ctx.weather || null,
    events: ctx.events || null,
    recentAngles: input.recent.map((r) => r.marketingAngle).filter((x): x is string => !!x),
    seed: `${input.userId}|${input.dateStr}|${input.publicationId}`,
  });

  const audience = (input.profile.creative_preferences?.targetAudience as string[] | undefined) || null;
  const variety = selectVariety({
    seed: `${input.userId}|${input.dateStr}|${input.publicationId}`,
    history: {
      headlineStyles: input.recent.map((r) => r.variety?.headlineStyle).filter((x): x is string => !!x),
      ctaPresentations: input.recent.map((r) => r.variety?.cta).filter((x): x is string => !!x),
      textScales: input.recent.map((r) => r.variety?.textScale).filter((x): x is string => !!x),
      cameras: input.recent.map((r) => r.variety?.camera).filter((x): x is string => !!x),
      placements: input.recent.map((r) => r.variety?.placement).filter((x): x is string => !!x),
    },
    audience,
    businessType: profile.type,
  });

  t = Date.now();
  const concept = await runConceptStep(
    offer,
    details,
    publicProfileForConcept(profile, audience),
    dishProfile as unknown as Record<string, unknown> | null,
    {
      logoUrl: profile.logo_url || null,
      phone,
      outputLanguage: input.outputLanguage,
      context: { ...(context || {}), user_ratings: ratingFeedback },
      recent: { headlines: recentHeadlines, ctas: recentCtas },
      userFeedback: input.userFeedback || null,
      marketingAngle: angle,
      headlineStyle: variety.headlineStyle,
      calendarEvent: null,
    },
  );
  mark('concept_ms', t);

  // Famille de direction artistique : propre au compte, compatible avec l'offre, differente des dernieres creations.
  const recentFamilies = input.recent.map((r) => r.daFamily).filter((x): x is string => !!x);
  if (input.mode === 'regenerate_different' && input.previousFamilyId) recentFamilies.unshift(input.previousFamilyId);
  const offerText = `${offer} ${details}`;
  const familyRatings: Record<string, number[]> = {};
  for (const r of input.recent) {
    if (r.daFamily && r.rating) (familyRatings[r.daFamily] ||= []).push(r.rating);
  }
  let selection = selectDAFamily({
    accountId: input.userId,
    offerId: input.publicationId,
    dateStr: input.dateStr,
    offerText,
    campaignType: input.campaignType,
    recentFamilies,
    familyRatings,
    history: input.familyHistory || input.recent.filter((r) => r.daFamily).map((r) => ({ id: r.daFamily as string, rating: r.rating })),
  });
  if (input.mode === 'regenerate_same' && input.previousFamilyId) {
    const { DA_FAMILIES } = await import('./daDraw');
    const same = DA_FAMILIES[input.previousFamilyId];
    if (same) selection = { ...selection, family: same, reason: 'regeneration a l\'identique' };
  }

  const temperature = concept.serving_temperature || inferServingTemperature(offerText);
  const materials = selectMaterials({
    temperature,
    offerText,
    campaignType: input.campaignType,
    recentIds: input.recent.flatMap((r) => r.materials || []),
    seed: `${input.userId}|${input.dateStr}|${input.publicationId}`,
  });
  const structure = analyzeOffer(offerText, input.campaignType);
  const compositionOptions = {
    structure,
    materials,
    campaignType: input.campaignType,
    formats: [input.aspectRatio],
    referenceImages: input.referenceImages,
    referenceRoles: input.referenceRoles || NO_REFERENCES,
    brandColors,
    textColor: palette?.text || null,
    variety,
    restaurantName: placeholders ? null : profile.name || null,
    logoPlaceholder: placeholders?.logo || null,
    dishNotes: dishProfile ? { presentation: dishProfile.presentation, aiAvoidErrors: dishProfile.aiAvoidErrors } : null,
    offerText,
  };
  const compositionPrompt = buildCompositionPrompt(concept, selection.family, selection.counterExample, localePack, input.aspectRatio, compositionOptions);

  // L'image est l'etape la plus longue : les legendes s'ecrivent pendant ce temps.
  t = Date.now();
  const imagePromise = runCompositionStep(concept, selection.family, selection.counterExample, localePack, compositionOptions)
    .then((results) => {
      mark('image_ms', t);
      return { ok: true as const, result: results[0] };
    })
    .catch((err: unknown) => {
      mark('image_ms', t);
      return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
    });

  const openings = input.recent.map((r) => (r.caption || '').slice(0, 60)).filter(Boolean).slice(0, 8);
  const captionsPromise = runCaptionsStep(concept, offer, localePack, {
    outputLanguage: input.outputLanguage,
    restaurantName: placeholders ? null : profile.name || null,
    // Essai : pas de numéro dans la légende, puisque ce n'est qu'un repère.
    phone: placeholders ? null : phone,
    recentOpenings: openings,
    headlineStyle: variety.headlineStyle,
  }).catch((err: unknown) => {
    console.warn('[pipeline] captions failed, fallback used:', err instanceof Error ? err.message : err);
    return [] as CaptionChannel[];
  });

  const [image, captions] = await Promise.all([imagePromise, captionsPromise]);

  return {
    concept,
    angle,
    variety,
    materialIds: materials.map((m) => m.id),
    selection,
    temperature,
    dishProfile,
    captions,
    compositionPrompt,
    image: image.ok
      ? { buffer: image.result.buffer, mimeType: image.result.mimeType, referenceImagesDropped: !!image.result.referenceImagesDropped }
      : null,
    imageError: image.ok ? null : image.error,
    timings,
  };
}
