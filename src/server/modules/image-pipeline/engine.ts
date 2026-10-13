import { createHash } from "node:crypto";

/* ───────────── CONTRATS ───────────── */

export type Scenario =
  | "rain_evening" | "rain_now" | "heat" | "cold" | "patio"
  | "game_night" | "concert" | "holiday" | "daily_special" | "special_hours";

export type ImageFormat = "square_1080" | "portrait_4x5" | "landscape_4x3";

export interface BrandDNA {
  restaurantId: string;
  version: number;
  palette: string[];              // hex
  typographyStyle: string;        // ex: "bold condensed sans, uppercase"
  moodKeywords: string[];
  photoStyle: string;
  layoutFamilies: string[];       // 2-3 familles, on fait tourner
  doList: string[];
  dontList: string[];
  seed: number;
}

export interface FactString {
  key: string;                    // ex: "offre_titre"
  value: string;                  // texte EXACT à écrire dans l'image
}

export interface ImageJob {
  jobId: string;
  restaurantId: string;
  campaignId: string;
  scenario: Scenario;
  format: ImageFormat;
  channel: "instagram" | "facebook" | "google";
  facts: FactString[];            // issus de la Fact Sheet, jamais du LLM
  brand: BrandDNA;
  restaurantName?: string;        // autorisé dans l'image (logo) lors du contrôle du texte
}

export interface InspirationRef {
  id: string;
  ownerRestaurantId: string | null;   // null = bibliothèque globale
  scenarios: Scenario[];
  styleDescriptor: string;            // décrit par un modèle vision, en texte
  tags: string[];
  rights: "own" | "licensed" | "generated";
  polarity: "positive" | "negative";
  similarity: number;                 // 0-1, fournie par pgvector
  lastUsedAt: Date | null;
}

export interface ImageResult {
  url: string;
  mode: "full_ai" | "text_free_fallback";
  ocrMatch: boolean;
  attempts: number;
  model: string;
  costUsd: number;
  promptHash: string;
  inspirationIds: string[];
  fallbackReason?: string;
  cached?: boolean;
}

/* ───────────── SÉLECTION DES INSPIRATIONS ───────────── */

const PROTECTED_TAGS = ["nfl", "nba", "mlb", "nhl", "fifa", "disney", "coca-cola"];

export function selectInspirations(
  job: ImageJob,
  candidates: InspirationRef[],
  now = new Date(),
  k = 3,
): { positives: InspirationRef[]; negatives: InspirationRef[] } {
  const eligible = candidates.filter(
    (c) =>
      // isolation multi-tenant : global ou propriétaire uniquement
      (c.ownerRestaurantId === null || c.ownerRestaurantId === job.restaurantId) &&
      c.scenarios.includes(job.scenario) &&
      !c.tags.some((t) => PROTECTED_TAGS.includes(t.toLowerCase())),
  );

  const score = (c: InspirationRef) => {
    const ownBoost = c.ownerRestaurantId === job.restaurantId ? 0.15 : 0;
    const hoursAgo = c.lastUsedAt ? (now.getTime() - c.lastUsedAt.getTime()) / 36e5 : Infinity;
    const novelty = hoursAgo > 72 ? 0.2 : 0; // évite de réutiliser toujours les mêmes
    return 0.65 * c.similarity + ownBoost + novelty;
  };

  const rank = (list: InspirationRef[]) =>
    [...list].sort((a, b) => score(b) - score(a)).slice(0, k);

  return {
    positives: rank(eligible.filter((c) => c.polarity === "positive")),
    negatives: rank(eligible.filter((c) => c.polarity === "negative")).slice(0, 2),
  };
}

/* ───────────── PROMPT BUILDER (6 couches) ───────────── */

const GLOBAL_RULES = [
  "Write ONLY the exact text strings provided in EXACT TEXT, character for character.",
  "Do not add any other words, numbers, prices, dates or slogans.",
  "Keep important text inside safe margins (8% from every edge).",
  "No league, team, or brand logos. No recognizable real people.",
];

const SCENARIO_BLOCKS: Record<Scenario, string> = {
  rain_evening: "rainy evening mood, raindrops on a window, warm interior glow",
  rain_now: "sudden rain outside, cozy shelter feeling, urgent and inviting",
  heat: "hot sunny day, condensation on cold drinks, bright fresh light",
  cold: "cold day, steam rising from a hot dish, comforting warm tones",
  patio: "golden hour patio, relaxed outdoor aperitif atmosphere",
  game_night: "energetic watch-party atmosphere, stadium-like lights, generic sports feel",
  concert: "pre-show evening, stage-light bokeh, dinner-before-the-show feel",
  holiday: "festive themed decoration, generic celebration without protected brands",
  daily_special: "hero close-up of the featured dish, appetizing, clean composition",
  special_hours: "calm, clear, informational layout, minimal decoration",
};

const FORMAT_BLOCKS: Record<ImageFormat, string> = {
  square_1080: "square 1:1 composition",
  portrait_4x5: "portrait 4:5 composition",
  landscape_4x3: "landscape 4:3 composition",
};

/** Rôle d'une image envoyée au modèle (l'ordre dans le tableau = "Image 1", "Image 2"…). */
export type ReferenceRole = "subject_photo" | "logo" | "style";

const ROLE_TEXT: Record<ReferenceRole, string> =
  {
    logo:
      "the restaurant's official logo. Reproduce it exactly as given: same shapes, colors and spelling. Do not redraw, restyle or translate it.",
    subject_photo:
      "the restaurant's real photo of its own food. Keep the food itself unchanged and recognisable; you may recompose the scene around it.",
    style:
      "style reference only. Take mood, lighting and composition. Do not copy its subject, text, logos or people.",
  };

export function buildPrompt(
  job: ImageJob,
  refs: { positives: InspirationRef[]; negatives: InspirationRef[] },
  layoutFamily: string,
  referenceRoles: ReferenceRole[] = [],
  opts: { textFree?: boolean } = {},
): { prompt: string; hash: string } {
  const b = job.brand;
  const layers = [
    `[GLOBAL RULES]\n${(opts.textFree ? GLOBAL_RULES.slice(2) : GLOBAL_RULES).map((r) => `- ${r}`).join("\n")}`,
    `[BRAND DNA]\npalette: ${b.palette.join(", ")}\ntypography: ${b.typographyStyle}\n` +
      `mood: ${b.moodKeywords.join(", ")}\nphoto style: ${b.photoStyle}\n` +
      `do: ${b.doList.join("; ") || "-"}\ndon't: ${b.dontList.join("; ") || "-"}`,
    `[INSPIRATION]\nfollow: ${refs.positives.map((r) => r.styleDescriptor).join(" | ") || "-"}\n` +
      `avoid: ${refs.negatives.map((r) => r.styleDescriptor).join(" | ") || "-"}`,
    ...(referenceRoles.length
      ? [`[REFERENCE IMAGES]\n${referenceRoles.map((r, i) => `Image ${i + 1}: ${ROLE_TEXT[r]}`).join("\n")}`]
      : []),
    `[SCENARIO]\n${SCENARIO_BLOCKS[job.scenario]}\nlayout family: ${layoutFamily}`,
    opts.textFree
      ? "[TEXT]\nDo not write any text, letters, numbers or logos anywhere in the image. Keep the lower third calm and empty."
      : `[EXACT TEXT]\n${job.facts.map((f) => `${f.key}: "${f.value}"`).join("\n")}`,
    `[FORMAT]\n${FORMAT_BLOCKS[job.format]}`,
  ];
  const prompt = layers.join("\n\n");
  const hash = createHash("sha256").update(prompt).digest("hex").slice(0, 16);
  return { prompt, hash };
}

/* ───────────── QA TEXTE (OCR vs Fact Sheet) ───────────── */

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9$%€\s-]/g, " ").replace(/\s+/g, " ").trim();

export interface TextQAResult {
  ok: boolean;
  missing: string[];      // textes attendus absents de l'image
  unexpectedWords: string[]; // mots lus par l'OCR qui ne viennent pas de la Fact Sheet
}

export function checkImageText(ocrText: string, facts: FactString[], allowedExtra: string[] = []): TextQAResult {
  const ocr = norm(ocrText);
  const missing = facts.filter((f) => !ocr.includes(norm(f.value))).map((f) => f.value);
  const allowed = new Set([...facts.map((f) => f.value), ...allowedExtra].flatMap((v) => norm(v).split(" ")));
  const unexpectedWords = ocr.split(" ").filter((w) => w.length > 1 && !allowed.has(w));
  return { ok: missing.length === 0 && unexpectedWords.length === 0, missing, unexpectedWords };
}

/* ───────────── GATE (matrice L2 + garde-fous) ───────────── */

export type VenueType =
  | "sports_bar" | "pub" | "kebab" | "bakery" | "bbq_grill"
  | "food_truck" | "fast_food" | "family_restaurant" | "cafe";

export interface VenueProfile {
  type: VenueType;
  hasPatio: boolean;
  closedToday: boolean;
  enabledThemes: string[];     // "sport" | "concert" | "weather" | "holiday"
  blockedTopics: string[];     // "alcohol"
}

export interface GateContext {
  venue: VenueProfile;
  severeWeatherAlert: boolean;
}

export type GateReason =
  | "severe_weather" | "closed_today" | "incompatible_type" | "theme_not_enabled"
  | "no_patio" | "protected_brand" | "blocked_topic" | "headline_too_long";

export interface GateResult { allowed: boolean; reasons: GateReason[] }

type Level = "yes" | "opt_in" | "no";

// Table de données (à terme en base). Absent = "yes".
export const COMPAT: Partial<Record<Scenario, Partial<Record<VenueType, Level>>>> = {
  game_night: {
    sports_bar: "yes", pub: "yes", kebab: "opt_in", bakery: "no", bbq_grill: "opt_in",
    food_truck: "opt_in", fast_food: "opt_in", family_restaurant: "opt_in", cafe: "no",
  },
  concert: { cafe: "opt_in", bakery: "opt_in" },
};

const THEME: Partial<Record<Scenario, string>> = { game_night: "sport", concert: "concert" };

const PROTECTED_RE =
  /\b(nfl|nba|mlb|nhl|ncaa|fifa|uefa|super bowl|world series|march madness|world cup|olympics)\b/i;
export const findProtectedTerms = (text: string) => text.match(new RegExp(PROTECTED_RE, "gi")) ?? [];

const TOPIC_KEYWORDS: Record<string, RegExp> = {
  alcohol: /\b(beer|wine|cocktail|pint|pints|shot|shots|whiskey|vodka|margarita|bourbon)\b/i,
};

export const MAX_HEADLINE_WORDS = 6;

export function imageGate(job: ImageJob, ctx: GateContext): GateResult {
  const reasons: GateReason[] = [];
  const v = ctx.venue;
  if (ctx.severeWeatherAlert) reasons.push("severe_weather");           // M8
  if (v.closedToday) reasons.push("closed_today");                      // X10
  const level = COMPAT[job.scenario]?.[v.type] ?? "yes";
  if (level === "no") reasons.push("incompatible_type");
  if (level === "opt_in" && !v.enabledThemes.includes(THEME[job.scenario] ?? "")) {
    reasons.push("theme_not_enabled");
  }
  if (job.scenario === "patio" && !v.hasPatio) reasons.push("no_patio");

  const allText = job.facts.map((f) => f.value).join(" ");
  if (findProtectedTerms(allText).length) reasons.push("protected_brand"); // X9
  if (v.blockedTopics.some((t) => TOPIC_KEYWORDS[t]?.test(allText))) reasons.push("blocked_topic");
  const headline = job.facts.find((f) => f.key === "headline");
  if (headline && headline.value.trim().split(/\s+/).length > MAX_HEADLINE_WORDS) {
    reasons.push("headline_too_long");
  }
  return { allowed: reasons.length === 0, reasons };
}

/* ───────────── ROTATION DES LAYOUTS ───────────── */

// recent = familles récemment utilisées, la plus récente en premier
export function pickLayoutFamily(brand: BrandDNA, recent: string[]): string {
  const age = (f: string) => {
    const i = recent.indexOf(f);
    return i === -1 ? Infinity : i;
  };
  return [...brand.layoutFamilies].sort((a, b) => age(b) - age(a))[0];
}
