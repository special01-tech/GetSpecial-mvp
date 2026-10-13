import type { BrandDNA, VenueProfile } from "../engine";

export interface GoldenRestaurant {
  id: string;
  name: string;
  venue: Omit<VenueProfile, "closedToday">;
  brand: BrandDNA;
}

const dna = (
  restaurantId: string,
  seed: number,
  p: Omit<BrandDNA, "restaurantId" | "version" | "seed">,
): BrandDNA => ({ restaurantId, version: 1, seed, ...p });

// Trois restaurants du même "type" de contexte (météo) doivent quand même rendre très différemment :
// palettes disjointes, typographies et familles de layout différentes.
export const RESTAURANTS: GoldenRestaurant[] = [
  {
    id: "rest_paris_atelier_1", name: "L'Atelier Culinaire",
    venue: { type: "family_restaurant", hasPatio: true, enabledThemes: ["weather", "holiday", "concert", "sport"], blockedTopics: [] },
    brand: dna("rest_paris_atelier_1", 2468, {
      palette: ["#1F2937", "#D97706", "#F3F4F6"], typographyStyle: "bold modern sans-serif, elegant capital headlines",
      moodKeywords: ["gourmet", "warm", "bistro", "convivial"], photoStyle: "rich warm lighting, seasonal fresh food close-ups",
      layoutFamilies: ["poster_bold", "magazine", "photo_full"], doList: ["show fresh food close-up"], dontList: ["no distorted text"],
    }),
  },
  {
    id: "tap", name: "The Corner Tap",
    venue: { type: "sports_bar", hasPatio: true, enabledThemes: ["sport", "concert", "weather", "holiday"], blockedTopics: [] },
    brand: dna("tap", 48213, {
      palette: ["#0F4D3A", "#D4A437", "#F5EFE0"], typographyStyle: "bold condensed sans, uppercase headlines",
      moodKeywords: ["rowdy", "friendly", "neighborhood"], photoStyle: "warm, grainy, low-light close-ups",
      layoutFamilies: ["poster_bold", "neon"], doList: ["show food close-up"], dontList: ["no league logos"],
    }),
  },
  {
    id: "crust", name: "Golden Crust Bakery",
    venue: { type: "bakery", hasPatio: false, enabledThemes: ["weather", "holiday"], blockedTopics: [] },
    brand: dna("crust", 1102, {
      palette: ["#F2E3C6", "#B5651D", "#3E2A1A"], typographyStyle: "soft serif, sentence case",
      moodKeywords: ["artisan", "morning", "flour-dusted"], photoStyle: "natural window light, top-down bread",
      layoutFamilies: ["photo_full", "kraft_paper"], doList: ["show steam and crust texture"], dontList: [],
    }),
  },
  {
    id: "kebab", name: "Istanbul Grill Kebab",
    venue: { type: "kebab", hasPatio: false, enabledThemes: ["weather", "holiday"], blockedTopics: ["alcohol"] },
    brand: dna("kebab", 7781, {
      palette: ["#8B1E2D", "#E8A33D", "#1F1F1F"], typographyStyle: "rounded bold sans, high contrast",
      moodKeywords: ["generous", "street-food", "late-night"], photoStyle: "saturated, sizzling close-ups",
      layoutFamilies: ["sticker_pop", "poster_bold"], doList: ["show wraps and grill"], dontList: ["no alcohol imagery"],
    }),
  },
  {
    id: "bbq", name: "Smoke & Ember BBQ",
    venue: { type: "bbq_grill", hasPatio: true, enabledThemes: ["weather", "holiday", "sport"], blockedTopics: [] },
    brand: dna("bbq", 3390, {
      palette: ["#1C1C1C", "#D2401E", "#E9C46A"], typographyStyle: "slab serif, stamped look",
      moodKeywords: ["smoky", "hearty", "weekend"], photoStyle: "dark moody, smoke and embers",
      layoutFamilies: ["chalkboard", "poster_bold"], doList: ["show smoke"], dontList: [],
    }),
  },
  {
    id: "truck", name: "Taco Rodeo Truck",
    venue: { type: "food_truck", hasPatio: false, enabledThemes: ["weather", "holiday", "concert"], blockedTopics: [] },
    brand: dna("truck", 9001, {
      palette: ["#00A896", "#F26CA7", "#FFD23F"], typographyStyle: "hand-painted playful sans",
      moodKeywords: ["colorful", "festival", "fun"], photoStyle: "bright daylight, street scene",
      layoutFamilies: ["sticker_pop", "magazine"], doList: ["show tacos and truck window"], dontList: [],
    }),
  },
  {
    id: "burger", name: "Burger Yard",
    venue: { type: "fast_food", hasPatio: false, enabledThemes: ["weather", "holiday"], blockedTopics: [] },
    brand: dna("burger", 555, {
      palette: ["#FFC300", "#D62828", "#FFFFFF"], typographyStyle: "chunky heavy sans, tight tracking",
      moodKeywords: ["fast", "loud", "craveable"], photoStyle: "studio-bright, product hero",
      layoutFamilies: ["poster_bold", "sticker_pop"], doList: ["hero product centered"], dontList: [],
    }),
  },
  {
    id: "tonys", name: "Tony's Family Kitchen",
    venue: { type: "family_restaurant", hasPatio: true, enabledThemes: ["weather", "holiday", "concert"], blockedTopics: [] },
    brand: dna("tonys", 2468, {
      palette: ["#2F6B3B", "#C8553D", "#FFF6E5"], typographyStyle: "friendly rounded serif",
      moodKeywords: ["homey", "generous", "family"], photoStyle: "warm table scenes, shared plates",
      layoutFamilies: ["magazine", "photo_full"], doList: ["show shared dishes"], dontList: [],
    }),
  },
  {
    id: "brew", name: "Brew & Bean Café",
    venue: { type: "cafe", hasPatio: true, enabledThemes: ["weather", "holiday"], blockedTopics: [] },
    brand: dna("brew", 6120, {
      palette: ["#5B3A29", "#E6D5B8", "#7A9E7E"], typographyStyle: "light geometric sans, lowercase accents",
      moodKeywords: ["calm", "cozy", "slow-morning"], photoStyle: "soft, muted, latte art close-ups",
      layoutFamilies: ["minimal", "photo_full"], doList: ["leave breathing room"], dontList: [],
    }),
  },
  {
    id: "pub", name: "The Rusty Anchor",
    venue: { type: "pub", hasPatio: true, enabledThemes: ["sport", "concert", "weather", "holiday"], blockedTopics: [] },
    brand: dna("pub", 8843, {
      palette: ["#14213D", "#C9A227", "#8D99AE"], typographyStyle: "vintage signage, engraved caps",
      moodKeywords: ["old-school", "warm", "regulars"], photoStyle: "wood, brass, pint glasses, amber light",
      layoutFamilies: ["chalkboard", "neon"], doList: ["show pint and wood bar"], dontList: [],
    }),
  },
];
