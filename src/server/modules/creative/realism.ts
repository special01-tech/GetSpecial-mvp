// Realisme des plats : lumiere, temperature de service et fidelite aux photos de reference.
// Les consignes sont redigees en anglais car elles partent directement vers le generateur d'image.

export type ServingTemperature = 'hot' | 'cold' | 'frozen' | 'room';

const FROZEN = /(glace|sorbet|milk-?shake|granit|frozen|ice cream|gelato|frapp)/i;
const COLD = /(cocktail|mojito|jus|smoothie|bi[eè]re|beer|soda|limonade|bissap|gnamakou|eau |salade|salad|sushi|poke|ceviche|tartare|yaourt|tiramisu|cheesecake|verre|boisson|drink|vin |wine|spritz|aperol|punch)/i;
const HOT = /(grill|brais|r[oô]ti|frit|frites|burger|pizza|soupe|bouillon|sauce|riz|poulet|chicken|viande|steak|brochette|tacos|kebab|chawarma|shawarma|p[aâ]tes|spaghetti|lasagne|rago[uû]t|curry|fumant|chaud|caf[eé]|th[eé]|cr[eê]pe|gaufre|omelette|poisson|atti[eé]k[eé]|garba|aloko|igname|fufu|p[aâ]t[eé]e|nouilles|noodle|wings|nuggets|croque|raclette|fondue)/i;

const FOOD = /(plat|menu|repas|manger|d[iî]ner|d[ée]jeuner|buffet|brunch|food|cuisine|boisson|cocktail|ap[ée]ro|tapas|grignot|snack|dessert|g[aâ]teau)/i;

/** L'offre parle-t-elle de nourriture ou de boisson ? (un evenement sans repas n'a pas de plat a montrer) */
export function mentionsFood(text: string): boolean {
  return FOOD.test(text) || FROZEN.test(text) || COLD.test(text) || HOT.test(text);
}

/** Temperature de service probable d'apres le texte de l'offre (repli si le modele ne la donne pas). */
export function inferServingTemperature(text: string): ServingTemperature {
  if (FROZEN.test(text)) return 'frozen';
  if (COLD.test(text) && !HOT.test(text)) return 'cold';
  if (HOT.test(text)) return 'hot';
  return 'room';
}

const TEMPERATURE_RULES: Record<ServingTemperature, string> = {
  hot: 'The food is served HOT: show only thin, realistic wisps of steam where physics allows it, moist glossy sauces, melted textures (cheese stretch, runny yolk, juices). Steam is rendered by soft backlight and stays neutral, never as a glowing haze.',
  cold: 'The item is served COLD: show fine condensation droplets on the glass or bottle, clear ice cubes with sharp transparent edges, fresh crisp garnish. NO steam, NO smoke.',
  frozen: 'The item is FROZEN: show a slight surface melt, light frost and clean scooped edges. NO steam, NO smoke.',
  room: 'The item is served at ROOM temperature: NO steam, NO condensation, NO smoke. Matte natural surfaces.',
};

export interface ReferenceRoles {
  /** Photos du plat fournies par l'utilisateur (en premier dans la liste envoyee au generateur). */
  dish: number;
  /** Charte graphique du restaurant. */
  brandGuide: number;
  /** Images de gout / direction artistique choisies par le restaurant. */
  taste: number;
  /** Logo. */
  logo: number;
}

export const NO_REFERENCES: ReferenceRoles = { dish: 0, brandGuide: 0, taste: 0, logo: 0 };

/** Decrit au generateur le role de chaque image de reference, dans l'ordre d'envoi. */
export function describeReferences(roles: ReferenceRoles, event = false): string {
  const lines: string[] = [];
  let index = 1;
  const range = (count: number) => (count === 1 ? `image ${index}` : `images ${index}-${index + count - 1}`);
  if (roles.dish > 0 && event) {
    // Evenement : les images envoyees montrent les artistes, invites ou le lieu, a mettre en valeur.
    lines.push(`- ${range(roles.dish)}: photos supplied by the restaurant for this EVENT (performers, artists, guests, venue or food). Feature the people shown PROMINENTLY and FAITHFULLY: same faces, skin tones, hair and clothing, never altered, never stylised into someone else. If an image shows food, treat it as the restaurant's real dish. Never take the dominant color of these photos as the poster palette.`);
    index += roles.dish;
  } else if (roles.dish > 0) {
    lines.push(`- ${range(roles.dish)}: the restaurant's REAL DISH. It is the ground truth. Reproduce the same food items, plating, proportions, colors, textures and quantity. Do not add, remove or "improve" ingredients. Only the framing, background and lighting may change.`);
    index += roles.dish;
  }
  if (roles.brandGuide > 0) {
    lines.push(`- ${range(roles.brandGuide)}: brand guide. Take colors, typography mood and spacing from it. Never copy any dish shown on it.`);
    index += roles.brandGuide;
  }
  if (roles.taste > 0) {
    lines.push(`- ${range(roles.taste)}: style inspiration chosen by the restaurant. Borrow composition, light treatment and graphic mood only. Never copy their dishes, and never copy their colors when brand colors are given.`);
    index += roles.taste;
  }
  if (roles.logo > 0) {
    lines.push(`- ${range(roles.logo)}: the restaurant LOGO. Reproduce it exactly, without redrawing or altering it.`);
  }
  if (!lines.length) return '';
  return `REFERENCE IMAGES (in the order received):\n${lines.join('\n')}`;
}

export interface RealismInput {
  temperature: ServingTemperature;
  roles: ReferenceRoles;
  dishNotes?: { presentation?: string; aiAvoidErrors?: string[] } | null;
  /** Evenement (spectacle, concert, soiree...). */
  event?: boolean;
  /** L'offre parle de nourriture ou de boisson. Sans cela, un evenement n'a pas de plat a l'affiche. */
  withFood?: boolean;
}

/** Bloc de consignes de realisme ajoute au prompt de composition. */
export function buildRealismDirective({ temperature, roles, dishNotes, event = false, withFood = true }: RealismInput): string {
  const references = describeReferences(roles, event);
  if (event && !withFood) {
    return [
      'THE EVENT IS THE SUBJECT: show what the event really is (show, comedy, concert, party...), its atmosphere and its people. NO dish, NO plate, NO food or drink anywhere on the poster, since the offer does not mention any.',
      '- Photographic elements look like real photographs; only the layout, typography and flat graphic shapes may be stylised.',
      references,
    ].filter(Boolean).join('\n');
  }
  const avoid = dishNotes?.aiAvoidErrors?.length ? `Typical AI mistakes for this dish to avoid: ${dishNotes.aiAvoidErrors.join('; ')}.` : '';
  const presentation = dishNotes?.presentation ? `Authentic presentation of this dish: ${dishNotes.presentation}` : '';
  return [
    'PHOTOREALISM OF THE FOOD (highest priority):',
    '- The dish is a REAL food photograph, never an illustration, 3D render or painting, whatever the graphic style of the poster. Only the layout, typography and flat graphic shapes may be stylised.',
    '- Natural imperfections: uneven browning, crumbs, small sauce drips, irregular shapes, visible grain and pores of cooked surfaces. No plastic or waxy gloss, no CGI sheen, no over-saturation, no perfect symmetry.',
    '- The dish is shown WHOLE and intact (a burger is not cut in half, a pizza is not sliced apart) unless the offer asks for it.',
    '- Believable physics and proportions: realistic portion size, real tableware, nothing floating or defying gravity, correct ingredient count.',
    '',
    'LIGHT (strict):',
    '- Soft NEUTRAL natural daylight, like a large window, about 5000-5600K. White balance is neutral: whites stay white.',
    '- FORBIDDEN: orange, amber, golden or yellow color cast, warm tungsten glow, candle-like haze, glowing halos, artificial rim light. Shadows are gentle and natural.',
    `- ${TEMPERATURE_RULES[temperature]}`,
    '- The graphic color palette applies to flat graphic elements only. The food keeps its own natural colors.',
    presentation,
    avoid,
    references,
  ]
    .filter(Boolean)
    .join('\n');
}
