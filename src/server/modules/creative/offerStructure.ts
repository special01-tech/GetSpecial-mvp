// Structure de l'offre : combien de produits montrer et comment organiser l'information.
// Règles tirées de l'analyse de 20 affiches professionnelles réelles et de l'ancienne « économie d'information ».
// Les consignes sont en anglais : elles partent telles quelles vers le générateur d'image.

export type OfferKind = 'single' | 'duo' | 'bogo' | 'menu' | 'combo';

export interface OfferStructure {
  kind: OfferKind;
  /** Nombre de prix (menu) ou d'éléments (formule) détectés ; 0 si indéterminé. */
  items: number;
  guidance: string[];
}

const PRICE = /\d[\d\s.,]*\s?(?:f\s?cfa|fcfa|cfa|xof|f\b|€|eur|\$|usd|dollars?|euros?)/gi;
const BOGO = /(?:\b1\b|\bun\b|\bune\b)\s*(?:achet|offert)|2\s*pour\s*1|buy\s*(?:1|one)\s*get\s*(?:1|one)|\bbogo\b|1\s*\+\s*1/i;
const DUO = /\bduo\b|\b(?:2|deux)\s+(?:burgers?|pizzas?|sandwichs?|sandwiches|plats?|menus?|tacos|kebabs?)/i;
const MENU_WORD = /\bmenu\b|formule|combo|carte du jour|plat du jour|set\b/i;
const MYSTERY = /(?:boisson|dessert|cadeau|surprise|gift|drink)\s+(?:offert|gratuit|free|offerte)/i;

function countParts(text: string): number {
  return text.split(/,|\+|;|\bet\b|\band\b|•|:/i).map((p) => p.trim()).filter((p) => p.length > 2).length;
}

/** Analyse la structure de l'offre : un plat, un duo, du 1+1, une formule à prix unique ou un menu à plusieurs prix. */
export function analyzeOffer(text: string, campaignType?: string | null): OfferStructure {
  const prices = (text.match(PRICE) || []).length;
  const parts = countParts(text);
  const menuLike = MENU_WORD.test(text) || campaignType === 'daily_menu';

  let kind: OfferKind = 'single';
  let items = 0;
  if (BOGO.test(text)) kind = 'bogo';
  else if (DUO.test(text)) kind = 'duo';
  else if (prices >= 3) { kind = 'menu'; items = prices; }
  else if (menuLike && parts >= 4) { kind = 'combo'; items = parts - 1; }

  const guidance: string[] = [];
  if (kind === 'single') {
    guidance.push('ONE hero dish, about 50-60% of the frame, never glued to the edges.');
    guidance.push('INFORMATION ECONOMY: show only 2-3 text elements (product, price, action). Less text means more impact.');
  } else if (kind === 'duo') {
    guidance.push('The offer is for TWO items: show both together, side by side, with visible margins around them.');
    guidance.push('INFORMATION ECONOMY: 2-3 text elements only (product, price, action).');
  } else if (kind === 'bogo') {
    guidance.push('The offer is a 1+1 mechanic: show both items and make the mechanic obvious with one clear, high-contrast badge. A bright, light background works best: avoid dark backgrounds for this offer.');
  } else if (kind === 'combo') {
    guidance.push('The offer is a COMBO sold at ONE price: show all its components together on one tray or table setting, with a single clear price badge.');
    guidance.push('INFORMATION ECONOMY: name the components briefly, keep generous spacing.');
  } else {
    const shown = Math.min(items, 6);
    guidance.push(`The offer is a MENU of ${items} priced items: show every item (${shown} at most), never cut one out. With 3 items, the main one is largest in the centre and the others sit behind it in depth; with 4 items, use a clean 2x2 grid seen from above. Each item keeps its own readable price.`);
    guidance.push('INFORMATION ECONOMY: for a menu, list everything it contains, even if that means more than 3 text elements, while keeping generous spacing.');
  }
  if (campaignType === 'event') guidance.push('EVENT: the date and time must be large and impossible to miss.');
  if (MYSTERY.test(text)) guidance.push('The offer mentions an unspecified free item: do NOT invent or draw a specific one, keep it a mystery or mention it in text only.');
  guidance.push('If a band sits behind text, make it about 85% opaque so the photo stays visible. If ingredients float around the dish, use 3 at most.');

  return { kind, items, guidance };
}

/** Ordre d'importance prix / étiquette / appel à l'action selon le type de campagne (repris de l'ancien Campaign Engine). */
export function emphasisFor(campaignType?: string | null): string {
  switch (campaignType) {
    case 'new_dish': return 'Emphasis order: the dish and its tag first, then the call to action. NO large price badge: the price stays discreet.';
    case 'event': return 'Emphasis order: date and time first, then the call to action, then the price.';
    case 'drink': return 'Emphasis order: the drink and its tag first, then the price, then the call to action. Convey an immediate craving.';
    case 'daily_menu': return 'Emphasis order: prices first, then the tag, then the call to action. Informative, no artificial urgency and no heavy promotional styling.';
    case 'promotion': return 'Emphasis order: price first, then the tag, then the call to action. Convey urgency without crowding the price with competing text.';
    default: return '';
  }
}
