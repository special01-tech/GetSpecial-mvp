// Variete des affiches d'un meme restaurant : style d'accroche, presentation de l'appel a l'action
// et echelle du texte changent d'une creation a l'autre. Tout est deterministe (testable) et evite les dernieres valeurs.

export interface Choice {
  id: string;
  brief: string;
}

export const HEADLINE_STYLES: Choice[] = [
  { id: 'question', brief: 'Accroche sous forme de question qui interpelle le lecteur.' },
  { id: 'humor', brief: 'Ton drôle et complice, jeu de mots léger, toujours respectueux.' },
  { id: 'serious_premium', brief: 'Ton sérieux et élégant, phrases sobres qui inspirent la qualité.' },
  { id: 'imperative', brief: 'Verbe d\'action direct qui donne envie d\'agir.' },
  { id: 'benefit', brief: 'Affirmation simple du bénéfice : le goût, le prix, l\'avantage.' },
  { id: 'emotion', brief: 'Évoque une sensation ou une émotion : plaisir, réconfort, partage.' },
  { id: 'casual_slang', brief: 'Langage familier et vivant, comme on parle entre amis, sans vulgarité.' },
];

/** Presentations de l'appel a l'action. Aucune n'est un bandeau pleine largeur en bas. */
export const CTA_PRESENTATIONS: Choice[] = [
  { id: 'sticker', brief: 'a round sticker/seal badge carrying the short action phrase, slightly rotated' },
  { id: 'pill_button', brief: 'a small pill-shaped button placed near the price, not full width' },
  { id: 'text_arrow', brief: 'plain text with a thin arrow or underline integrated in the layout, no background shape' },
  { id: 'handwritten', brief: 'a hand-written style note with a small arrow pointing at the dish' },
  { id: 'corner_tag', brief: 'a corner ribbon or a tag attached to the dish' },
  { id: 'speech_bubble', brief: 'a speech bubble coming from the dish' },
  { id: 'info_line', brief: 'a minimal icon + short phrase set quietly in the information zone' },
  { id: 'burst', brief: 'a starburst shape combining the offer and the action in one compact element' },
];

/** Angle de prise de vue : alterne d'une création à l'autre pour qu'un même restaurant ne se répète pas. */
export const CAMERA_ANGLES: Choice[] = [
  { id: 'top_down', brief: 'top-down flat lay, seen from directly above' },
  { id: 'front', brief: 'straight-on front view at table height' },
  { id: 'three_quarter', brief: 'three-quarter view at about 45 degrees' },
  { id: 'low_hero', brief: 'low angle looking slightly up, giving the dish a hero stance' },
  { id: 'close_up', brief: 'tight close-up that reveals texture' },
  { id: 'wide_airy', brief: 'wider shot with generous empty space around the dish' },
];

/** Placement du produit dans le cadre. */
export const PLACEMENTS: Choice[] = [
  { id: 'centered', brief: 'dish centered in the frame with text above and below' },
  { id: 'offset_left', brief: 'dish offset to the left, text on the right' },
  { id: 'offset_right', brief: 'dish offset to the right, text on the left' },
  { id: 'bottom_weighted', brief: 'dish in the lower part of the frame, text above' },
  { id: 'top_weighted', brief: 'dish in the upper part of the frame, text below' },
  { id: 'diagonal', brief: 'dish placed along a diagonal, text balancing the opposite corner' },
];

export const TEXT_SCALES: Choice[] = [
  { id: 'compact', brief: 'small and elegant headline, at most about 12% of the poster height, lots of empty space' },
  { id: 'balanced', brief: 'medium headline, at most about 18% of the poster height, generous margins' },
  { id: 'bold', brief: 'strong headline, never more than about 25% of the poster height, never touching the edges' },
];

// "bold" sort rarement : les gros titres etaient le defaut le plus visible.
const SCALE_POOL = ['compact', 'compact', 'balanced', 'balanced', 'balanced', 'bold'];

export interface VarietyHistory {
  headlineStyles?: string[];
  ctaPresentations?: string[];
  textScales?: string[];
  cameras?: string[];
  placements?: string[];
}

export interface VarietyInput {
  seed: string;
  history: VarietyHistory;
  /** Public cible declare par le restaurant (ex. ["etudiants", "familles"]). */
  audience?: string[] | string | null;
  businessType?: string | null;
}

export interface Variety {
  headlineStyle: Choice;
  cta: Choice;
  textScale: Choice;
  camera: Choice;
  placement: Choice;
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Choisit dans `all` en evitant les 2 derniers usages ; `weights` duplique les options favorisees. */
function pick(all: Choice[], recent: string[] | undefined, seed: string, favored: string[] = []): Choice {
  const avoid = new Set((recent || []).slice(0, 2));
  let pool = all.filter((c) => !avoid.has(c.id));
  if (!pool.length) pool = all;
  const weighted = [...pool, ...pool.filter((c) => favored.includes(c.id))];
  return weighted[hash(seed) % weighted.length];
}

export function favoredHeadlineStyles(audience: VarietyInput['audience'], businessType?: string | null): string[] {
  const text = `${Array.isArray(audience) ? audience.join(' ') : audience || ''} ${businessType || ''}`.toLowerCase();
  const favored: string[] = [];
  if (/jeune|[eé]tudiant|youth|student|ado|g[eé]n[eé]ration/.test(text)) favored.push('humor', 'casual_slang', 'question');
  if (/famil|enfant|parent/.test(text)) favored.push('emotion', 'benefit');
  if (/cadre|business|affaires|premium|luxe|gastro|gourmet|fine|raffin/.test(text)) favored.push('serious_premium', 'benefit');
  if (/bar|club|nuit|lounge/.test(text)) favored.push('humor', 'imperative');
  return favored;
}

export function selectVariety({ seed, history, audience, businessType }: VarietyInput): Variety {
  const scaleChoices = SCALE_POOL.map((id) => TEXT_SCALES.find((s) => s.id === id) as Choice);
  const recentScales = new Set((history.textScales || []).slice(0, 1));
  const scaleOptions = scaleChoices.filter((s) => !recentScales.has(s.id));
  const scalePool = scaleOptions.length ? scaleOptions : scaleChoices;
  return {
    headlineStyle: pick(HEADLINE_STYLES, history.headlineStyles, `${seed}|h`, favoredHeadlineStyles(audience, businessType)),
    cta: pick(CTA_PRESENTATIONS, history.ctaPresentations, `${seed}|c`),
    textScale: scalePool[hash(`${seed}|t`) % scalePool.length],
    camera: pick(CAMERA_ANGLES, history.cameras, `${seed}|k`),
    placement: pick(PLACEMENTS, history.placements, `${seed}|p`),
  };
}

/**
 * Profil transmis au modele de concept : volontairement sans ville ni pays, pour qu'aucun nom de lieu
 * ne finisse sur l'affiche ou dans les legendes.
 */
export function publicProfileForConcept(profile: Record<string, any>, audience?: string[] | string | null): Record<string, unknown> {
  return {
    name: profile.name,
    type: profile.type,
    cuisine: profile.cuisine_type || null,
    brand_colors: Array.isArray(profile.brand_colors) ? profile.brand_colors.filter(Boolean) : [],
    description: profile.description || null,
    recurring_offers: profile.recurring_offers || null,
    target_audience: audience || null,
  };
}
