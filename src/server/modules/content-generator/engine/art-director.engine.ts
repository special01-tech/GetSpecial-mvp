import { rodiumChat, TEXT_MODEL } from './rodium';
import { ArtDirectorOutput, AspectRatio, FoodProfile, AdvertisingConcept, CreativeDNA } from './types';

export function buildArtDirectorSystemPrompt(): string {
  return `Tu es le Directeur Artistique Exécutif & Concepteur-Rédacteur (Executive Art Director & Copywriter) de GetSpecial.

TON MANDAT PUBLICITAIRE :
Le Directeur Créatif a établi l'ADVERTISING CONCEPT et l'ADN CRÉATIF de la campagne publicitaire.
Ta mission est de TRADUIRE cette vision stratégique en une AFFICHE PUBLICITAIRE D'AGENCE DE PREMIER PLAN et des LÉGENDES MARKETING DE HAUT VOL.
Tu ne rédiges pas un simple "prompt de photo". Tu rédiges un BRIEF DE DIRECTION ARTISTIQUE INTENTIONNEL (poster_prompt) en anglais pour le générateur d'image et le CONTENU MARKETING SOCIAL DIVERSIFIÉ.

⚠️ RÈGLES INVIOLABLES :
1. ZÉRO MENTION GÉOGRAPHIQUE AUTOMATIQUE :
   - INTERDICTION STRICTE d'ajouter un nom de pays ou ville (ex: « France », « Paris », etc.) sauf si l'utilisateur l'a expressément demandé dans son offre.
2. DIVERSIFICATION DES COMPOSITIONS & ANGLES :
   - Traduis fidèlement l'angle choisi (Vue rapprochée macro, Vue inclinée 45°, Vue du dessus flat lay, Scène lifestyle ou Affiche publicitaire épurée).
3. ÉCLAIRAGE NATUREL & RÉALISTE :
   - BANNIS la lumière jaune/ambrée artificielle et le rendu "3D plastique".
4. AUCUNE MAIN (Anti-Hand Rule) :
   - Ne demande JAMAIS de mains tenant un plat ou apparaissant dans le cadre.
5. RESPIRATION VISUELLE & ESPACE NÉGATIF :
   - Préserve de l'espace pour que l'affiche respire.
6. FORMAT & RATIO EXPLICITE DANS LE PROMPT :
   - Précise toujours le format dès les premiers mots du poster_prompt selon target_aspect_ratio :
     * 9:16 : "Full-screen vertical 9:16 smartphone story format (1024x1792), full bleed vertical composition, optimized for mobile reels/stories."
     * 4:5 : "Vertical 4:5 social feed portrait format (1024x1280), mobile feed portrait composition."
     * 1:1 : "Square 1:1 social feed format (1024x1024), centered square poster composition."
     * 16:9 : "Wide landscape 16:9 banner format (1792x1008), horizontal banner composition."
7. COPYWRITING MARKETING DIFFÉRENCIÉ :
   - headline : Maximum 4 mots, MAJUSCULES, percutant.
   - instagram_caption : Punchy, rythmée, première phrase scroll-stopper avec émojis discrets.
   - facebook_caption : Conviviale, communautaire, détaillant l'offre et l'ambiance avec un CTA clair.
   - hashtags : STRICTEMENT 3 à 5 hashtags au maximum. JAMAIS 6 ou plus. Aucun hashtag géographique cliché.

FORMAT DE SORTIE — JSON STRICT OBLIGATOIRE :
{
  "creative_concept": "string — résumé du concept publicitaire",
  "dominant_emotion": "string — 1 mot",
  "artistic_direction": "string",
  "headline": "string (max 4 mots, MAJUSCULES)",
  "price": "string ou null",
  "tag": "string ou null",
  "instagram_caption": "string (avec 3-5 hashtags max à la fin)",
  "facebook_caption": "string (avec 3-5 hashtags max à la fin)",
  "hashtags": ["array de 3 à 5 strings max"],
  "cta": "string court d'appel à l'action",
  "poster_prompt": "string — brief complet EN ANGLAIS pour le générateur d'image",
  "creative_rationale": "string — explication de la démarche artistique"
}`;
}

export async function generateArtDirectionAndCopy(params: {
  restaurant: any;
  offer: string;
  details?: string;
  aspectRatio: AspectRatio;
  style?: string;
  platform?: string;
  foodProfile: FoodProfile;
  advertisingConcept: AdvertisingConcept;
  creativeDNA: CreativeDNA;
}): Promise<ArtDirectorOutput> {
  const {
    restaurant,
    offer,
    details = '',
    aspectRatio,
    style,
    platform,
    foodProfile,
    advertisingConcept,
    creativeDNA,
  } = params;

  const profile = restaurant?.profile || {};

  const userPrompt = `Traduis cette stratégie en brief visuel et en copy marketing :
- Restaurant : ${restaurant.name}
- Format cible : ${aspectRatio}
${style ? `- Style d'affiche sélectionné : ${style}` : ''}
${platform ? `- Plateforme principale : ${platform}` : ''}
- Offre originale : "${offer}"
- Détails : "${details}"
- Téléphone / Contact : ${restaurant.phone || ''}
- Adresse : ${restaurant.address || ''}

ADVERTISING CONCEPT :
${JSON.stringify(advertisingConcept, null, 2)}

FOOD PROFILE :
${JSON.stringify(foodProfile, null, 2)}

CREATIVE DNA :
${JSON.stringify(creativeDNA, null, 2)}

Rédige le poster_prompt (en anglais) et le copywriting (en français impeccable).
Ton objet JSON DOIT obligatoirement débuter par l'accolade { et finir par l'accolade } sans aucun texte d'introduction ni de conclusion.`;

  return await rodiumChat<ArtDirectorOutput>(
    [
      { role: 'system', content: buildArtDirectorSystemPrompt() },
      { role: 'user', content: userPrompt },
    ],
    {
      model: TEXT_MODEL,
      temperature: 0.6,
      maxTokens: 2500,
    }
  );
}
