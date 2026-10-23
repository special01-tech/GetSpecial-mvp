import { rodiumChat, STRATEGIST_MODEL } from './rodium';
import { StrategistOutput, FoodProfile, AdvertisingConcept, CreativeDNA } from './types';
import { resolveDaypartLighting, selectMaterialSignals, STYLE_TEMPLATES } from './creative-library';

export function buildStrategistSystemPrompt(): string {
  return `Tu es le Directeur Créatif d'une Agence de Publicité Mondiale Spécialisée en Restauration (AI Advertising Agency).

FILOSOPHIE & MANDAT :
Tu ne penses PAS comme un simple photographe culinaire. Tu penses comme un Directeur Créatif d'Agence Publicitaire de premier plan.
Ton objectif N'EST PAS de générer une simple photo de nourriture. Ton objectif est de concevoir une AFFICHE PUBLICITAIRE À FORT IMPACT COMMERCIAL.
Avant toute décision visuelle, tu réponds intérieurement :
1. Quel est l'objectif commercial exact ?
2. Quelle est l'idée publicitaire unique la plus puissante (Big Idea) ?
3. Qu'est-ce qui capture l'attention en moins d'une seconde (Scroll Stopper) ?
4. Que doit retenir le client 5 secondes plus tard ?

DIRECTIVES CRÉATIVES ESSENTIELLES :
- DIVERSITÉ EXTRÊME : Invente des compositions, des angles (face, plongée, 45° trois-quarts, macro, décentré, diagonale) et des ambiances radicalement différents à chaque génération.
- OFFRES IMPRÉCISES / CADEAUX : Si l'utilisateur mentionne "une boisson offerte" ou "une surprise" SANS PRÉCISER, N'INVENTE PAS une boisson spécifique. Garde le mystère visuellement.
- ESPACE NÉGATIF ET RESPIRATION : Laisse de l'espace vide pour la typographie. Ne surcharge jamais l'image.
- LUMIÈRE NATURELLE STRICTE : Interdiction de lumières ambrées artificielles typiques d'IA. Utilise exclusivement une lumière naturelle ou studio réaliste.
- ZÉRO CLICHÉ GÉOGRAPHIQUE : Ne JAMAIS injecter de nom de pays ou ville comme artifice décoratif sans demande explicite.
- MODE RÉGÉNÉRATION : Si previous_food_profile est fourni, conserve la même identité de plat (hero_product/cuisine) comme base, mais varie obligatoirement l'angle, la lumière, le décor et prends en compte le feedback utilisateur.

FORMAT DE SORTIE OBLIGATOIRE — JSON STRICT AVEC CES 3 OBJETS EXACTS :
{
  "food_profile": {
    "meal_category": "string",
    "cuisine": "string",
    "hero_product": "string",
    "secondary_products": ["array"],
    "serving_style": "string",
    "temperature": "string",
    "textures": ["array"],
    "hero_visual": "string",
    "recommended_environment": "string",
    "culinary_identity": "string",
    "authenticity_notes": ["array"]
  },
  "advertising_concept": {
    "poster_family": "Studio Premium | Lifestyle | Food Photography | Editorial | Street Food | Luxury | Bold Graphic | Commercial",
    "camera_angle": "close_up_macro | depth_field_30deg | tilted_45deg | top_down_flatlay | lifestyle_scene | outdoor_terrace | premium_hero",
    "lighting_family": "natural_window | studio_pro | soft_diffuse | side_textured | evening_warm | morning_crisp",
    "main_message": "string",
    "visual_hook": "string",
    "main_hero": "food | price | speed | drink | promotion | emotion | packaging",
    "secondary_hero": "string",
    "information_priority": ["array de 2-3 éléments max"],
    "eye_path": "string",
    "advertising_story": "string",
    "photo_role": "string",
    "graphic_role": "string",
    "emotion_goal": "string",
    "attention_strategy": "string"
  },
  "creative_dna": {
    "brand_personality": "string",
    "visual_world": "string",
    "color_strategy": "string",
    "style_reference": "string",
    "creative_direction": "string",
    "photography_style": "string",
    "camera_strategy": "string",
    "lighting_strategy": "string",
    "composition_strategy": "string",
    "food_scale": "string",
    "typography_strategy": "string",
    "background_direction": "string",
    "negative_space": "string",
    "elements_to_highlight": ["array"],
    "elements_to_avoid": ["array"]
  }
}`;
}

export async function generateCreativeDNA(params: {
  restaurant: any;
  offer: string;
  details?: string;
  campaignType?: string;
  style?: string;
  platform?: string;
  creativeMemory: any;
  previousFoodProfile?: any;
  userFeedback?: string;
  weatherSummary?: string;
}): Promise<StrategistOutput> {
  const {
    restaurant,
    offer,
    details = '',
    campaignType = 'promotion',
    style,
    platform,
    creativeMemory,
    previousFoodProfile,
    userFeedback,
    weatherSummary,
  } = params;

  const profile = restaurant?.profile || {};
  const daypartLighting = resolveDaypartLighting();
  const materialSignals = selectMaterialSignals(offer);

  const styleHint = style
    ? style === 'chic'
      ? 'Élégant, raffiné, épuré, haute gastronomie, fond sombre ou marbre'
      : style === 'festive'
      ? 'Convivial, chaleureux, festif, ambiance animée, partage'
      : style === 'deal'
      ? 'Impact promotionnel percutant, visuel franc et direct'
      : 'Gourmand, généreux, textures appétissantes, focus produit'
    : '';

  const userPrompt = `Voici la demande de campagne du restaurant :
- Établissement : ${restaurant.name} (${restaurant.type || 'Restauration'}) à ${restaurant.city || restaurant.address || 'France'}
- Ton de la marque : ${profile.tone || 'Chaleureux, authentique'}
- Type de campagne : ${campaignType}
${style ? `- Style visuel choisi : ${style} (${styleHint})` : ''}
${platform ? `- Canal cible prioritaire : ${platform}` : ''}
- Offre / Plat promu : "${offer}"
- Détails complémentaires : "${details}"
${weatherSummary ? `- Météo locale observée : ${weatherSummary}` : ''}
- Éclairage suggéré selon l'heure : ${daypartLighting}
- Signaux de matière suggérés : ${materialSignals.join(', ')}

MÉMOIRE CRÉATIVE (ce qui a déjà été produit pour ce restaurant) :
- Indication d'auto-compréhension : ${creativeMemory.self_awareness_hint}
- Angles récents : ${creativeMemory.angle_history?.join(' | ') || 'aucun'}
- Éléments à éviter : ${creativeMemory.patterns_to_avoid?.join(' ; ') || 'aucun'}

${previousFoodProfile ? `MODE RÉGÉNÉRATION ACTIF :
- Profil culinaire précédent à conserver : ${JSON.stringify(previousFoodProfile)}
- Demande de modification / Feedback utilisateur : "${userFeedback || 'Nouvel angle et nouvelle ambiance'}"
Conserve impérativement le même hero_product mais propose un angle et un décor totalement renouvelés.` : ''}

Génère la stratégie créative complète en JSON strict.`;

  return await rodiumChat<StrategistOutput>(
    [
      { role: 'system', content: buildStrategistSystemPrompt() },
      { role: 'user', content: userPrompt },
    ],
    {
      model: STRATEGIST_MODEL,
      temperature: 0.75,
      maxTokens: 1600,
    }
  );
}
