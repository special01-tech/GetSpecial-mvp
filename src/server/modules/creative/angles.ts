// Angle marketing de chaque creation : varie d'un contenu a l'autre pour un meme restaurant,
// et suit le contexte (meteo, evenement, type de campagne) quand c'est pertinent.

export const MARKETING_ANGLES = [
  'scarcity_urgency',
  'comfort_cozy',
  'celebration_social',
  'indulgence_reward',
  'refreshing_escape',
  'premium_experience',
  'value_deal',
  'novelty_discovery',
  'game_night_energy',
  'family_gathering',
] as const;

export type MarketingAngle = (typeof MARKETING_ANGLES)[number];

const BRIEFS: Record<MarketingAngle, string> = {
  scarcity_urgency: 'Offre limitée dans le temps : donner envie d\'agir maintenant, sans agressivité.',
  comfort_cozy: 'Réconfort : plat qui fait du bien, chaleur d\'un repas partagé.',
  celebration_social: 'Se retrouver entre amis, fêter un moment ensemble.',
  indulgence_reward: 'Se faire plaisir, mériter une récompense gourmande.',
  refreshing_escape: 'Fraîcheur et évasion, parfait quand il fait chaud.',
  premium_experience: 'Qualité et raffinement, produit magnifié.',
  value_deal: 'Bon plan : le prix et l\'avantage sont immédiatement clairs.',
  novelty_discovery: 'Nouveauté : curiosité, première fois à goûter.',
  game_night_energy: 'Énergie collective d\'une soirée match ou d\'un événement.',
  family_gathering: 'Repas en famille, générosité et partage.',
};

export interface AngleInput {
  campaignType?: string | null;
  /** Texte de l'offre : un evenement n'est un match que si l'utilisateur le dit. */
  offerText?: string;
  weather?: { condition?: string | null; tempValue?: number | null; tempUnit?: string | null } | null;
  events?: { name?: string | null }[] | null;
  /** Angles des dernieres creations du compte, de la plus recente a la plus ancienne. */
  recentAngles?: string[];
  seed: string;
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Angles que le contexte rend naturellement pertinents (classes du plus fort au plus faible). */
const MATCH = /match|foot|coupe|cup|finale|derby|can|ligue|champions/i;

export function contextualAngles({ campaignType, offerText, weather, events }: Omit<AngleInput, 'recentAngles' | 'seed'>): MarketingAngle[] {
  const out: MarketingAngle[] = [];
  const condition = (weather?.condition || '').toLowerCase();
  const celsius = weather?.tempUnit === 'F' ? ((weather?.tempValue ?? 20) - 32) / 1.8 : (weather?.tempValue ?? 20);
  // Un evenement de l'utilisateur (spectacle, concert...) garde son propre sujet : pas de match s'il n'en parle pas.
  if (campaignType === 'event') out.push(...(MATCH.test(offerText || '') ? (['game_night_energy', 'celebration_social'] as MarketingAngle[]) : (['celebration_social'] as MarketingAngle[])));
  else if ((events || []).some((e) => MATCH.test(e?.name || ''))) out.push('game_night_energy', 'celebration_social');
  if (campaignType === 'new_dish') out.push('novelty_discovery');
  if (campaignType === 'promotion') out.push('value_deal', 'scarcity_urgency');
  if (campaignType === 'daily_menu') out.push('value_deal', 'family_gathering');
  if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('snow') || celsius <= 14) out.push('comfort_cozy');
  if (celsius >= 30) out.push('refreshing_escape');
  return out;
}

/** Choisit l'angle : contextuel s'il n'a pas servi recemment, sinon un angle encore peu utilise par ce compte. */
export function selectAngle(input: AngleInput): { id: MarketingAngle; brief: string } {
  const recent = input.recentAngles || [];
  const lastThree = new Set(recent.slice(0, 3));
  const contextual = contextualAngles(input).filter((a) => !lastThree.has(a));
  let pool: MarketingAngle[] = contextual;
  if (!pool.length) {
    const unused = MARKETING_ANGLES.filter((a) => !lastThree.has(a));
    pool = unused.length ? [...unused] : [...MARKETING_ANGLES];
  }
  const id = pool[hash(input.seed) % pool.length];
  return { id, brief: BRIEFS[id] };
}
