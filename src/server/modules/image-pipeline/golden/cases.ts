import type { FactString, GateReason, ImageFormat, Scenario } from "../engine";

export interface GoldenCase {
  id: string;
  restaurantId: string;
  scenario: Scenario;
  format: ImageFormat;
  channel: "instagram" | "facebook" | "google";
  facts: FactString[];
  ctx?: { severeWeatherAlert?: boolean; closedToday?: boolean };
  expected: { allowed: boolean; reasons?: GateReason[] };
  tags?: string[];
  note?: string;
}

const F = (headline: string, subline?: string, badge?: string): FactString[] => [
  { key: "headline", value: headline },
  ...(subline ? [{ key: "subline", value: subline }] : []),
  ...(badge ? [{ key: "badge", value: badge }] : []),
];

const ok = { allowed: true };
const no = (...reasons: GateReason[]) => ({ allowed: false, reasons });

const counters: Record<string, number> = {};
const c = (
  restaurantId: string, scenario: Scenario, format: ImageFormat, channel: GoldenCase["channel"],
  facts: FactString[], expected: GoldenCase["expected"],
  extra: Pick<GoldenCase, "ctx" | "tags" | "note"> = {},
): GoldenCase => ({ id: `${restaurantId}-${String((counters[restaurantId] = (counters[restaurantId] ?? 0) + 1)).padStart(2, "0")}`, restaurantId, scenario, format, channel, facts, expected, ...extra });

export const GOLDEN_CASES: GoldenCase[] = [
  // Sports bar
  c("tap", "rain_evening", "square_1080", "instagram", F("Wings -50%", "Tonight 5-7 PM"), ok, { tags: ["rain-compare"] }),
  c("tap", "game_night", "portrait_4x5", "instagram", F("Game Night", "Kickoff 8 PM", "Burger + Beer $14"), ok),
  c("tap", "special_hours", "landscape_4x3", "google", F("Open Late Friday", "Kitchen until 1 AM"), ok),
  c("tap", "game_night", "square_1080", "facebook", F("NFL Sunday", "Wings $10"), no("protected_brand"), { note: "X9 marque protégée" }),
  c("tap", "rain_evening", "square_1080", "instagram", F("Wings -50%", "Tonight 5-7 PM"), no("closed_today"), { ctx: { closedToday: true }, note: "X10 / scénario 10" }),

  // Boulangerie
  c("crust", "cold", "square_1080", "instagram", F("Fresh Croissants", "Out of the oven at 6 AM"), ok),
  c("crust", "daily_special", "portrait_4x5", "instagram", F("Sourdough Loaf", "$6 today"), ok),
  c("crust", "holiday", "square_1080", "facebook", F("Pie Pre-Orders", "Order by Nov 20"), ok),
  c("crust", "game_night", "square_1080", "instagram", F("Game Night", "Kickoff 8 PM"), no("incompatible_type"), { note: "scénario 3 adapté" }),

  // Kebab
  c("kebab", "heat", "square_1080", "instagram", F("Cold Ayran", "Wrap + Drink $11"), ok),
  c("kebab", "rain_now", "square_1080", "instagram", F("Hot Doner Wrap", "Ready in 15 min"), ok, { tags: ["urgent"] }),
  c("kebab", "heat", "square_1080", "instagram", F("Wrap + Beer Deal", "$12"), no("blocked_topic"), { note: "contrainte dure : pas d'alcool" }),
  c("kebab", "game_night", "square_1080", "instagram", F("Big Game Wraps", "$10 all night"), no("theme_not_enabled")),
  c("kebab", "special_hours", "landscape_4x3", "google", F("Late Night Hours", "Fri-Sat until 3 AM"), ok),

  // Grill / BBQ
  c("bbq", "patio", "portrait_4x5", "instagram", F("Smoked Brisket Plate", "$16 on the patio"), ok),
  c("bbq", "holiday", "square_1080", "facebook", F("4th of July Ribs", "Family pack $45"), ok),
  c("bbq", "game_night", "square_1080", "instagram", F("Game Day Platter", "$39 feeds four"), ok, { note: "opt_in activé" }),
  c("bbq", "rain_evening", "square_1080", "instagram", F("Smoked Brisket Plate", "$16 tonight"), no("severe_weather"), { ctx: { severeWeatherAlert: true }, note: "M8 / scénario 9" }),

  // Food truck
  c("truck", "daily_special", "portrait_4x5", "instagram", F("Al Pastor Tacos", "3 for $9 at Pier 5"), ok, { tags: ["location-override"], note: "lieu saisi par le gérant, pas par GPS fixe" }),
  c("truck", "heat", "square_1080", "instagram", F("Frozen Horchata", "$4 today"), ok),
  c("truck", "rain_now", "square_1080", "instagram", F("Hot Tacos", "Come get 'em"), no("closed_today"), { ctx: { closedToday: true } }),
  c("truck", "patio", "square_1080", "instagram", F("Patio Tacos", "$9"), no("no_patio")),

  // Fast-food
  c("burger", "rain_now", "square_1080", "facebook", F("Delivery Deal", "2 combos for $18"), ok, { tags: ["urgent"] }),
  c("burger", "daily_special", "portrait_4x5", "instagram", F("Double Smash", "$8 all day"), ok),
  c("burger", "heat", "square_1080", "instagram", F("Shake Season", "Any shake $5"), ok),
  c("burger", "daily_special", "square_1080", "instagram", F("Come Try Our Amazing New Spicy Chicken Sandwich Today", "$9"), no("headline_too_long")),
  c("burger", "rain_now", "square_1080", "facebook", F("Delivery Deal", "2 combos for $18"), no("severe_weather"), { ctx: { severeWeatherAlert: true } }),

  // Restaurant familial
  c("tonys", "rain_evening", "square_1080", "instagram", F("Pasta Night", "Family bundle $32"), ok, { tags: ["rain-compare"] }),
  c("tonys", "holiday", "portrait_4x5", "instagram", F("Mother's Day Brunch", "Sunday 10 AM to 2 PM"), ok, { note: "apostrophe" }),
  c("tonys", "concert", "square_1080", "facebook", F("Dinner Before the Show", "Seating from 5 PM"), ok),

  // Café
  c("brew", "cold", "square_1080", "instagram", F("Pumpkin Latte", "$5 until noon"), ok),
  c("brew", "rain_evening", "square_1080", "instagram", F("Rainy Day Combo", "Pastry + coffee $7"), ok, { tags: ["rain-compare"] }),
  c("brew", "daily_special", "square_1080", "instagram", F("Crème Brûlée Latte", "New today"), ok, { note: "accents" }),
  c("brew", "concert", "square_1080", "instagram", F("After the Show", "Coffee until 9 PM"), no("theme_not_enabled")),

  // Pub
  c("pub", "rain_evening", "square_1080", "instagram", F("Pint + Pie", "$12 tonight"), ok, { tags: ["rain-compare"] }),
  c("pub", "game_night", "portrait_4x5", "instagram", F("Match Night", "Pints $5 all game"), ok),
  c("pub", "holiday", "square_1080", "facebook", F("St. Paddy's Party", "Live music 9 PM"), ok),
  c("pub", "concert", "square_1080", "instagram", F("Drinks After the Show", "Open until 2 AM"), ok),
];
