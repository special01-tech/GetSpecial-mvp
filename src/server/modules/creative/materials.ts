// Preuves physiques de fraîcheur (condensation, vapeur, sauce brillante...) : ce qui fait lire l'image comme une vraie
// photo prise à un instant précis. Repris de l'ancien « Material Signal Pool » et adapté : lumière neutre uniquement,
// jamais de mains, de personnes ni de lieu identifiable, et la vapeur seulement pour ce qui est servi chaud.

import type { ServingTemperature } from './realism';

export interface Signal { id: string; text: string }

const GROUPS: Record<string, Signal[]> = {
  cold: [
    { id: 'condensation', text: 'Fine condensation beading across the glass, a few drops caught mid-run down the side' },
    { id: 'ice', text: 'Clear ice cubes visibly melting, one catching a crisp highlight' },
    { id: 'garnish', text: 'A citrus or herb garnish still wet, water clinging along its edge' },
  ],
  frozen: [
    { id: 'melt', text: 'A slight surface melt with a slow, glossy drip beginning to form' },
    { id: 'frost', text: 'A light layer of frost on the container and clean scooped edges' },
  ],
  hot_savory: [
    { id: 'steam', text: 'A thin, realistic ribbon of steam rising off the hot surface' },
    { id: 'glossy_sauce', text: 'Sauce still wet and glossy, catching the light' },
    { id: 'char', text: 'Char marks with real texture, irregular and slightly blistered at the edges' },
    { id: 'cheese_pull', text: 'A cheese pull or sauce drip caught in motion, not yet fallen' },
  ],
  hot_drink: [
    { id: 'foam', text: 'Foam or crema carrying visible relief and fine bubble texture' },
    { id: 'steam_drink', text: 'Gentle steam curling off the surface' },
    { id: 'pour', text: 'Milk mid-pour, the surface still folding into itself' },
  ],
  sweet_pastry: [
    { id: 'dust', text: 'Powdered sugar or cocoa caught mid-fall, dusting the surface' },
    { id: 'crumbs', text: 'A few crumbs scattered naturally around the base' },
    { id: 'glaze', text: 'Glaze still setting, holding a slow highlight along its edge' },
  ],
  room: [
    { id: 'texture', text: 'Soft directional daylight raking across the surface to reveal crust, grain and texture' },
    { id: 'fresh_ingredient', text: 'A fresh ingredient from the recipe placed naturally beside the dish, still glistening' },
  ],
  launch_motion: [
    { id: 'airborne', text: 'One ingredient caught in mid-air an instant before landing, no hand visible' },
    { id: 'shallow_dof', text: 'Shallow depth of field, one detail razor sharp while the rest falls softly away' },
  ],
};

const DRINK_WORDS = /caf[eé]|th[eé]|latte|cappuccino|espresso|chocolat chaud|coffee|tea\b/i;
const PASTRY_WORDS = /g[aâ]teau|cake|dessert|tarte|croissant|p[aâ]tisserie|brownie|beignet|cookie|donut|gaufre|cr[eê]pe|pastry/i;

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export interface MaterialInput {
  temperature: ServingTemperature;
  offerText: string;
  campaignType?: string | null;
  /** Identifiants utilisés par les dernières créations du compte (les plus récents d'abord). */
  recentIds?: string[];
  seed: string;
}

/** Choisit 2 preuves physiques cohérentes avec la température de service, sans répéter les dernières. */
export function selectMaterials({ temperature, offerText, campaignType, recentIds = [], seed }: MaterialInput): Signal[] {
  let pool: Signal[];
  if (temperature === 'cold') pool = GROUPS.cold;
  else if (temperature === 'frozen') pool = [...GROUPS.frozen, GROUPS.cold[0]];
  else if (temperature === 'hot') pool = DRINK_WORDS.test(offerText) ? GROUPS.hot_drink : GROUPS.hot_savory;
  else pool = PASTRY_WORDS.test(offerText) ? [...GROUPS.sweet_pastry, GROUPS.room[0]] : GROUPS.room;

  if (campaignType === 'new_dish') pool = [...pool, ...GROUPS.launch_motion];

  const avoid = new Set(recentIds.slice(0, 4));
  const fresh = pool.filter((s) => !avoid.has(s.id));
  const source = fresh.length >= 2 ? fresh : pool;

  const first = source[hash(`${seed}|m1`) % source.length];
  const rest = source.filter((s) => s.id !== first.id);
  if (!rest.length) return [first];
  return [first, rest[hash(`${seed}|m2`) % rest.length]];
}
