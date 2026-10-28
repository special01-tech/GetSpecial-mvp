import { DA_FAMILIES } from './daDraw';
import type { DAFamily } from './daDraw';

// Choix de la famille de direction artistique (DA).
// Un restaurant garde une identite stable : au plus 3 familles pour ses plats et boissons, plus 1 famille fixe pour
// ses evenements. Ces familles sont celles qu'il a deja utilisees (aucune table a ajouter) ; les 2 premieres creations
// fixent deux « looks », la 3e peut en ajouter un troisieme si aucun ne convient a l'offre, puis le compte tourne
// entre ses looks. Un look mal note est retire et remplace. Les familles different d'un compte a l'autre.

const EVENT_TAGS = new Set([
  'evenement', 'concert', 'karaoke', 'soiree_dj', 'live_music', 'night_club', 'girls_night',
  'jeux_et_musique', 'retransmission_match', 'soiree_foot', 'bar_sportif',
]);

// Mot-cle de l'offre -> etiquettes de compatibilite des familles.
const KEYWORD_TAGS: [RegExp, string[]][] = [
  [/burger|hamburger/i, ['burger', 'sandwich', 'fast_food', 'multi_burgers']],
  [/pizza/i, ['pizza', 'plat_italien']],
  [/p[aâ]tes|spaghetti|lasagne|italien/i, ['pates', 'plat_italien']],
  [/kebab|tacos|burrito|sandwich|chawarma|shawarma|wrap/i, ['kebab', 'tacos', 'sandwich', 'chawarma', 'burrito']],
  [/brais|grill|barbecue|bbq|brochette|poulet|chicken/i, ['poulet_braise', 'grillade', 'barbecue', 'poisson_braise']],
  [/poisson|fish/i, ['poisson_braise', 'grillade']],
  [/bi[eè]re|beer|pression/i, ['biere', 'boisson']],
  [/cocktail|mojito|spritz|aperol|ap[eé]ro|happy.?hour/i, ['cocktail', 'aperitif', 'apero', 'happy_hour', 'boisson']],
  [/jus|smoothie|soda|limonade|boisson|drink|bissap/i, ['boisson', 'boisson_maison']],
  [/dessert|g[aâ]teau|cake|p[aâ]tisserie|tarte|glace|brownie|gourmand/i, ['dessert', 'patisserie', 'cake']],
  [/pain|croissant|viennoiserie|boulangerie/i, ['pain', 'patisserie', 'petit_dejeuner']],
  [/petit.?d[eé]j|brunch/i, ['petit_dejeuner', 'brunch']],
  [/menu du jour|plat du jour|carte du jour/i, ['menu_du_jour', 'carte_du_jour']],
  [/combo|formule|menu [eé]tudiant/i, ['combo', 'combo_plat', 'formule_midi', 'menu_etudiant']],
  [/atti[eé]k[eé]|garba|aloko|igname|fufu|traditionnel/i, ['attieke', 'garba', 'plat_traditionnel']],
  [/riz|jollof|rice/i, ['riz_gras', 'riz_jollof']],
  [/soupe|nouilles|noodle|bouillon/i, ['soupe', 'nouilles']],
  [/1 achet|un achet|2 pour 1|buy 1|offert/i, ['promotion_1achete_1offert', 'combo']],
  [/buffet|festin|famille|family/i, ['buffet', 'grand_festin', 'menu_famille']],
  [/concert|karaok|dj |soir[eé]e|live|match|[eé]v[eé]nement/i, ['evenement']],
];

const CAMPAIGN_TAGS: Record<string, string[]> = {
  event: ['evenement'],
  drink: ['boisson', 'biere', 'cocktail'],
  daily_menu: ['menu_du_jour', 'carte_du_jour'],
  new_dish: ['nouveaute', 'plat_signature'],
};

const HUMAN_PATTERN = /main|humain|personnage|portrait|client souriant|artiste|chanteu|dj\b/i;
const HUMAN_REQUEST = /\bmains?\b|personnage|client|portrait|chanteu|artiste|\bdj\b|hands?/i;

/** Une famille deja utilisee par le compte (de la plus recente a la plus ancienne dans l'historique). */
export interface FamilyUse {
  id: string;
  rating?: number | null;
}

export interface DASelectionInput {
  accountId: string;
  offerId: string;
  dateStr: string;
  offerText: string;
  campaignType?: string | null;
  /** Familles des dernieres creations du compte, de la plus recente a la plus ancienne. */
  recentFamilies?: string[];
  /** Notes (1 a 5) donnees par l'utilisateur, par famille : les mal notees sont evitees, les bien notees favorisees. */
  familyRatings?: Record<string, number[]>;
  /** Historique plus long du compte (une quarantaine de creations) : sert a retrouver ses looks. */
  history?: FamilyUse[];
}

export interface DASelection {
  family: DAFamily;
  /** Pourquoi cette famille (utile pour l'admin et les tests). */
  reason: string;
  counterExample: string;
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function deriveTags(offerText: string, campaignType?: string | null): Set<string> {
  const tags = new Set<string>(['plat']);
  for (const [pattern, list] of KEYWORD_TAGS) if (pattern.test(offerText)) list.forEach((t) => tags.add(t));
  for (const tag of CAMPAIGN_TAGS[campaignType || ''] || []) tags.add(tag);
  return tags;
}

const COUNTER_EXAMPLE =
  'Avoid the generic brown/orange golden background, repetitive blurry bokeh, red price bubbles, an orange or yellow light cast on the food, and the same condensed serif typography on every poster.';

export const MAX_EVERYDAY_FAMILIES = 3;
export const MIN_EVERYDAY_FAMILIES = 2;
/** Poids du look principal du compte face aux autres looks (1). */
export const DOMINANT_LOOK_WEIGHT = 2.5;

const isEventFamily = (family: DAFamily) => family.compatiblePlats.some((t) => EVENT_TAGS.has(t));
const isHumanFamily = (family: DAFamily) => HUMAN_PATTERN.test(`${family.id} ${family.description}`);

const mean = (list: number[] | undefined) => (list && list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);

/** Les looks du compte : jusqu'a 3 familles pour les plats et boissons, 1 pour les evenements. */
export function accountLooks(history: FamilyUse[]): { everyday: string[]; event: string | null } {
  const stats = new Map<string, { count: number; first: number; ratings: number[] }>();
  history.forEach((use, index) => {
    if (!use.id || !DA_FAMILIES[use.id]) return;
    const entry = stats.get(use.id) || { count: 0, first: index, ratings: [] };
    entry.count += 1;
    if (use.rating) entry.ratings.push(use.rating);
    stats.set(use.id, entry);
  });
  const ranked = [...stats.entries()]
    // un look mal note est abandonne
    .filter(([, st]) => (mean(st.ratings) ?? 3) > 2.5)
    .sort((x, y) => y[1].count - x[1].count || x[1].first - y[1].first)
    .map(([id]) => DA_FAMILIES[id]);
  return {
    everyday: ranked.filter((f) => !isEventFamily(f) && !isHumanFamily(f)).slice(0, MAX_EVERYDAY_FAMILIES).map((f) => f.id),
    event: ranked.find(isEventFamily)?.id || null,
  };
}

export function selectDAFamily(input: DASelectionInput): DASelection {
  const { accountId, offerId, dateStr, offerText, campaignType, recentFamilies = [], history = [] } = input;
  // Notes : tirees de l'historique complet quand il est fourni, sinon de celles passees par l'appelant.
  let familyRatings: Record<string, number[]> = input.familyRatings || {};
  if (history.length) {
    familyRatings = {};
    for (const use of history) if (use.id && use.rating) (familyRatings[use.id] ||= []).push(use.rating);
  }
  const average = (id: string) => mean(familyRatings[id]);
  const isEvent = campaignType === 'event';
  const wantsHuman = isEvent || HUMAN_REQUEST.test(offerText);
  const tags = deriveTags(offerText, campaignType);
  const scoreOf = (family: DAFamily) => family.compatiblePlats.filter((t) => tags.has(t) && t !== 'plat').length;
  const seed = hash(`${accountId}|${dateStr}|${offerId}`);
  const looks = accountLooks(history.length ? history : recentFamilies.map((id) => ({ id })));

  /** Choix libre (compte sans look, ou nouveau look a ajouter) : compatible, non recent, propre au compte. */
  const pickNew = (exclude: Set<string>): DASelection => {
    const all = Object.values(DA_FAMILIES);
    const allowed = all.filter((family) => {
      if (isEventFamily(family) && !isEvent) return false;
      if (!wantsHuman && isHumanFamily(family)) return false;
      return true;
    });
    const open = allowed.filter((family) => !exclude.has(family.id));
    const pool = open.length ? open : allowed.length ? allowed : all;

    const scored = pool.map((family) => ({ family, score: scoreOf(family) })).sort((a, b) => b.score - a.score);
    const best = scored[0]?.score ?? 0;
    // Familles les plus pertinentes ; si aucune ne correspond, tout le pool autorise.
    const relevant = best > 0 ? scored.filter((st) => st.score >= Math.max(1, best - 1)) : scored;

    const recentSet = new Set(recentFamilies);
    let candidates = relevant.filter((st) => !recentSet.has(st.family.id));
    let reason = 'compatible avec l\'offre, non utilisee recemment';
    if (!candidates.length) {
      candidates = scored.filter((st) => !recentFamilies.slice(0, 3).includes(st.family.id));
      reason = 'groupe pertinent deja utilise, elargissement au pool autorise';
    }
    if (!candidates.length) {
      candidates = scored;
      reason = 'repli : toutes les familles ont servi recemment';
    }

    // Notes de l'utilisateur : on ecarte les familles mal notees (si d'autres choix existent), on double la chance des bien notees.
    const liked = candidates.filter((c) => (average(c.family.id) ?? 0) >= 4);
    const notDisliked = candidates.filter((c) => (average(c.family.id) ?? 3) > 2.5);
    if (notDisliked.length) candidates = notDisliked;
    const weighted = [...candidates, ...liked.filter((c) => candidates.includes(c))];
    const picked = weighted[seed % weighted.length];
    return { family: picked.family, reason, counterExample: COUNTER_EXAMPLE };
  };

  // Evenement : toujours la meme famille evenement pour le compte (la premiere fois, choix libre qui devient la sienne).
  if (isEvent) {
    const fixed = looks.event ? DA_FAMILIES[looks.event] : null;
    if (fixed) return { family: fixed, reason: 'famille evenement fixe du compte', counterExample: COUNTER_EXAMPLE };
    return pickNew(new Set());
  }
  // Demande explicite de mains ou de personnage : exception ponctuelle, hors des looks du compte.
  if (wantsHuman) return pickNew(new Set());

  const members = looks.everyday;
  // Pas encore deux looks : on en ajoute un (different de ceux du compte).
  if (members.length < MIN_EVERYDAY_FAMILIES) {
    const picked = pickNew(new Set(members));
    return { ...picked, reason: `nouveau look du compte (${members.length + 1} sur ${MAX_EVERYDAY_FAMILIES}) : ${picked.reason}` };
  }

  const scored = members.map((id) => ({ family: DA_FAMILIES[id], score: scoreOf(DA_FAMILIES[id]) }));
  const best = Math.max(...scored.map((st) => st.score));
  // Un troisieme look seulement si aucun des looks du compte ne convient a cette offre.
  if (members.length < MAX_EVERYDAY_FAMILIES && best === 0) {
    const fresh = pickNew(new Set(members));
    if (scoreOf(fresh.family) > 0) return { ...fresh, reason: `nouveau look du compte (${members.length + 1} sur ${MAX_EVERYDAY_FAMILIES}) : aucun look existant ne convient` };
  }
  const candidates = best > 0 ? scored.filter((st) => st.score >= best - 1 && st.score > 0) : scored;
  // Tirage pondere : le look principal du compte (le plus utilise) pese 2,5 fois plus que les autres pour revenir
  // le plus souvent ; un look bien note gagne +1 ; celui de la derniere creation est divise par 2 pour garder de la variete.
  const weightOf = (id: string) => {
    let w = id === members[0] ? DOMINANT_LOOK_WEIGHT : 1;
    if ((average(id) ?? 0) >= 4) w += 1;
    if (id === recentFamilies[0] && candidates.length > 1) w /= 2;
    return w;
  };
  const total = candidates.reduce((sum, c) => sum + weightOf(c.family.id), 0);
  let ticket = ((seed % 10_000) / 10_000) * total;
  const picked = candidates.find((c) => (ticket -= weightOf(c.family.id)) < 0) || candidates[candidates.length - 1];
  return { family: picked.family, reason: 'look habituel du compte, adapte a l\'offre', counterExample: COUNTER_EXAMPLE };
}
