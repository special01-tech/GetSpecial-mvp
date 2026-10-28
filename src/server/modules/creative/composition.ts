import { generateImage } from '@/server/lib/openrouterImage';
import { DAFamily } from './daDraw';
import { ConceptOutput } from './concept';
import { LocalePack, formatPrice } from './localePack';
import type { Variety } from './variety';
import type { OfferStructure } from './offerStructure';
import type { Signal } from './materials';
import { emphasisFor } from './offerStructure';
import { buildRealismDirective, inferServingTemperature, mentionsFood, NO_REFERENCES, ReferenceRoles } from './realism';

export interface CompositionOptions {
  formats?: string[];
  referenceImages?: string[];
  retryFeedback?: string | null;
  /** Couleurs de marque du restaurant (hex). */
  brandColors?: string[];
  /** Couleur de texte lisible sur les aplats aux couleurs de la marque. */
  textColor?: string | null;
  /** Style de CTA et echelle du texte choisis pour cette creation. */
  variety?: Variety | null;
  /** Structure de l'offre (un plat, duo, 1+1, formule, menu). */
  structure?: OfferStructure | null;
  /** Preuves physiques de fraicheur choisies pour cette creation. */
  materials?: Signal[];
  campaignType?: string | null;
  restaurantName?: string | null;
  /** Essai sans compte : texte repère à la place du logo (ex. « Votre logo »). */
  logoPlaceholder?: string | null;
  /** Role de chaque image de reference envoyee, dans l'ordre. */
  referenceRoles?: ReferenceRoles;
  dishNotes?: { presentation?: string; aiAvoidErrors?: string[] } | null;
  /** Texte brut de l'offre, pour deduire la temperature si le concept ne la donne pas. */
  offerText?: string;
}

export interface RenderedFormatResult {
  format: string;
  url: string;
  buffer: Buffer;
  mimeType: string;
  referenceImagesDropped?: boolean;
}

const FORMAT_HINTS: Record<string, string> = {
  '9:16': 'Full-screen vertical 9:16 story format, full bleed, optimized for mobile stories and reels.',
  '4:5': 'Vertical 4:5 social feed portrait format.',
  '1:1': 'Square 1:1 social feed format, centered composition.',
  '16:9': 'Wide landscape 16:9 banner format, horizontal composition.',
};

// Echecs observes sur de vraies generations (repris de l'ancien promptExamples.js).
const KNOWN_FAILURES = [
  'A hard-edged flat saturated color band across the bottom or a black border around the image looks like a template.',
  'A fully realistic bar or dining scene as backdrop: keep backdrops abstract (soft blur, solid color or gradient) unless the artistic direction says otherwise.',
  'Never show two conflicting facts about the same offer (one-time and recurring).',
  'Never mix languages on one poster, not even a single word of the call to action.',
  'The headline must not simply repeat the price shown in the price badge.',
  'A stacked multi-line headline must never grow so tall that it demotes the dish or squeezes the price.',
];

/** Prompt complet envoye au generateur d'image. Fonction pure : testable sans appel reseau. */
export function buildCompositionPrompt(
  concept: ConceptOutput,
  daFamily: DAFamily,
  counterExample: string,
  localePack: LocalePack,
  format: string,
  options: CompositionOptions = {},
): string {
  // Le prix reste tel que l'utilisateur l'a ecrit (FCFA, F, $...). On ne le reformate que si un pack local precis est charge.
  const price = concept.price ? (localePack.code === 'generic' ? concept.price : formatPrice(concept.price, localePack)) : null;
  const temperature = concept.serving_temperature || inferServingTemperature(options.offerText || concept.headline);
  const event = options.campaignType === 'event';
  // Un evenement (spectacle, concert...) n'a de plat a l'affiche que si l'offre parle de nourriture.
  const withFood = !event || mentionsFood(options.offerText || `${concept.headline} ${concept.subheadline || ''}`);
  const realism = buildRealismDirective({ temperature, roles: options.referenceRoles || NO_REFERENCES, dishNotes: options.dishNotes, event, withFood });
  const subject = withFood ? 'dish' : 'event visual';

  const logoRule = concept.logo_config.logo_url
    ? `Place the supplied brand logo cleanly in the ${concept.logo_config.position} area with a protective margin, with good contrast. Do not redraw it.`
    : options.logoPlaceholder
      ? `No logo was supplied: in the ${concept.logo_config.position} area, show a small neutral placeholder badge (plain outlined shape) containing exactly the text "${options.logoPlaceholder}". Do not invent a logo, emblem or restaurant name.`
      : 'No logo was supplied: do not invent a logo or emblem. A simple text wordmark of the restaurant name is enough.';

  const contacts: string[] = [];
  if (concept.phone) contacts.push(`phone/WhatsApp "${concept.phone}"`);
  if (concept.social_handle) contacts.push(`social handle "${concept.social_handle}"`);

  const brand = options.brandColors?.filter(Boolean) || [];
  const colorRule = brand.length
    ? `Brand colors: ${brand.join(', ')}. They take priority over the family palette and over the colors of any reference image: replace the family's dominant colors by the brand colors (and harmonious tints of them) while keeping the family's layout and contrast.${options.textColor ? ` Text placed on brand-colored areas uses ${options.textColor}.` : ''}`
    : `Family palette: ${daFamily.colorRule}.`;

  const selected = concept.prompt_variants.find((v) => v.is_selected) || concept.prompt_variants[0];
  const retry = options.retryFeedback ? `\nCORRECTIONS REQUIRED FROM THE PREVIOUS ATTEMPT: ${options.retryFeedback}` : '';

  // Textes autorises : uniquement ceux-ci, ecrits exactement comme fournis.
  const texts = [
    `headline "${concept.headline}"`,
    concept.subheadline ? `subheadline "${concept.subheadline}"` : '',
    price ? `price "${price}"` : '',
    concept.schedule ? `schedule "${concept.schedule}"` : '',
    `call to action "${concept.cta}" (2-4 words) presented as ${options.variety ? options.variety.cta.brief : 'a badge or sticker'}`,
    options.restaurantName ? `restaurant name "${options.restaurantName}"` : '',
    contacts.length ? `contact ${contacts.join(' and ')}, shown ONCE only` : '',
  ].filter(Boolean);

  return [
    `${FORMAT_HINTS[format] || `Format ratio ${format}.`}`,
    `Professional advertising poster for a restaurant. Artistic direction: "${daFamily.name}" - ${daFamily.description}`,
    `Layer order: ${daFamily.orderOfLayers}. Typography: ${daFamily.typoPersonality}.`,
    colorRule,
    '',
    realism,
    '',
    'TEXT ON THE POSTER (render exactly these texts, correctly spelled, fully legible, nothing cut off, and NO other text):',
    ...texts.map((t) => `- ${t}`),
    'Every word shares the same language as the headline. Never invent a price, offer, gift or date.',
    'CONTACT: the phone number and the social handle each appear exactly ONCE on the whole poster, with their icon, never repeated in the call to action, a banner or a footer.',
    'NO city, country, district or nationality names anywhere on the poster.',
    'CALL TO ACTION: do NOT use a full-width bar or banner along the bottom edge. Use the presentation given above, kept compact.',
    `TYPE SIZE AND BREATHING ROOM: ${options.variety ? options.variety.textScale.brief : 'medium headline, generous margins'}. Keep at least 8% empty margin on every side, headline and ${subject} never touch the edges or each other, and the text never dominates the ${subject}. Vary scale between elements: the price and the secondary text are clearly smaller than the headline.`,
    'LEGIBILITY AT A GLANCE: every text, including the smallest line, must be easy to read on a phone held at arm length (like a printed poster seen from 1 metre): strong contrast with its background, no text over busy areas, no thin or tiny lines. Readable does not mean huge: the headline stays bold and clear but proportionate, never filling the poster.',
    'TYPOGRAPHY: clean, professional typefaces, at most one expressive display face (for the headline only) plus one simple sans-serif. No ornate, script, distressed or fantasy lettering on secondary text.',
    '',
    `LOGO: ${logoRule}`,
    event
      ? 'EVENT: understand the real nature of the event described by the restaurant (comedy show, concert, party, match...) and build the visual around it. Never add another theme it does not mention (no football for a show, no party props for a match).'
      : concept.event_context.event_name ? `THEME (${concept.event_context.active_priority}): reflect "${concept.event_context.event_name}" subtly in accents and mood, never at the expense of the dish.` : '',
    selected ? `CREATIVE ANGLE "${selected.angle_name}": ${selected.composition_brief}` : '',
    'MULTI-ITEM OFFERS: organise items in clean cards or a balanced grid with breathing room and legible individual prices.',
    event
      ? 'PEOPLE: show ONLY the people provided in the reference images, faithfully. NEVER invent a person or a face. A person named in the text without a photo is shown as their name in clean, legible typography (for example a line of artist names), never as an imagined portrait.'
      : 'NO hands holding the dish and no people unless the artistic direction explicitly requires them. NEVER invent the face of a named person.',
    withFood ? 'Show the dish WHOLE and intact, never cut, sliced, bitten or opened, unless the offer explicitly asks for it.' : '',
    '',
    options.variety ? `CAMERA AND PLACEMENT (unless the artistic direction's layout requires otherwise): ${options.variety.camera.brief}; ${options.variety.placement.brief}.` : '',
    withFood && options.materials && options.materials.length ? `PHYSICAL PROOFS OF FRESHNESS (show these naturally, subtle and believable): ${options.materials.map((m) => m.text).join('; ')}.` : '',
    options.structure ? `OFFER STRUCTURE: ${options.structure.guidance.join(' ')}` : '',
    emphasisFor(options.campaignType),
    `AVOID: ${[...daFamily.avoid, counterExample].join('; ')}.`,
    `KNOWN FAILURES TO AVOID: ${KNOWN_FAILURES.join(' ')}`,
    'Perfect legibility, clear reading flow, balanced negative space.',
    retry,
  ]
    .filter((line) => line !== undefined && line !== null)
    .join('\n');
}

export async function runCompositionStep(
  concept: ConceptOutput,
  daFamily: DAFamily,
  counterExample: string,
  localePack: LocalePack,
  options: CompositionOptions = {},
): Promise<RenderedFormatResult[]> {
  const formats = options.formats && options.formats.length > 0 ? options.formats : ['4:5'];
  const results: RenderedFormatResult[] = [];
  const referenceImages = [...(options.referenceImages || [])];

  for (const fmt of formats) {
    const prompt = buildCompositionPrompt(concept, daFamily, counterExample, localePack, fmt, options);
    const imgResult = await generateImage(prompt, {
      aspectRatio: fmt,
      inputReferences: referenceImages.length > 0 ? referenceImages : undefined,
    });
    results.push({ format: fmt, url: imgResult.url, buffer: imgResult.buffer, mimeType: imgResult.mimeType, referenceImagesDropped: !!imgResult.referenceImagesDropped });
  }
  return results;
}
