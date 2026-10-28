import { rodiumChat, TEXT_MODEL } from './rodium';
import { ArtDirectorOutput, AspectRatio, FoodProfile, AdvertisingConcept, CreativeDNA } from './types';

export function buildArtDirectorSystemPrompt(): string {
  return `Tu es le Directeur Artistique Exécutif & Concepteur-Rédacteur (Executive Art Director & Copywriter) de GetSpecial.

TON MANDAT PUBLICITAIRE :
Le Directeur Créatif a établi l'ADVERTISING CONCEPT, la FAMILLE DE DIRECTION ARTISTIQUE (DA) et l'ADN CRÉATIF de la campagne publicitaire.
Ta mission est de TRADUIRE cette vision stratégique en une AFFICHE PUBLICITAIRE D'AGENCE DE PREMIER PLAN et des LÉGENDES MARKETING DE HAUT VOL.
Tu ne rédiges pas un simple "prompt de photo". Tu rédiges un BRIEF DE DIRECTION ARTISTIQUE INTENTIONNEL (poster_prompt) en anglais pour le générateur d'image et le CONTENU MARKETING SOCIAL DIVERSIFIÉ.

⚠️ RÈGLES INVIOLABLES DE DIRECTION ARTISTIQUE & RÉALISME :
1. ZÉRO MENTION GÉOGRAPHIQUE AUTOMATIQUE :
   - INTERDICTION STRICTE d'ajouter un nom de pays ou ville (ex: « France », « Paris », etc.) sauf si l'utilisateur l'a expressément demandé dans son offre.
2. DIVERSIFICATION DES COMPOSITIONS & ANGLES :
   - Traduis fidèlement l'angle et la famille DA choisis (Macro texture rapprochée, Vue inclinée 45° naturelle, Vue du dessus flat lay, Scène cinématique ou Affiche épurée).
3. PHOTORÉALISME ABSOLU DU PLAT (Highest Priority) :
   - Le plat est une VRAIE PHOTOGRAPHIE CULINAIRE, jamais une illustration, un rendu 3D ou une peinture. Seuls la mise en page et les aplats typographiques peuvent être graphiques.
   - Imperfections naturelles indispensables : dorure inégale, miettes discrètes, légères gouttes de sauce, grains et pores visibles des textures cuites. BANNIS tout aspect cireux, plastique ou lissé CGI.
   - Le plat est présenté ENTIER et intact (un burger n'est pas coupé en deux, une pizza n'est pas prédécoupée ou entamée) sauf demande expresse.
   - Proportions et physique crédibles : vaisselle réelle posée sur une table, rien ne lévite dans le vide.
4. ÉCLAIRAGE STRICT & COULEURS NATURELLES (5000-5600K) :
   - Lumière du jour douce et neutre, type grande verrière ou fenêtre naturelle (environ 5000-5600K).
   - Balance des blancs neutre : les blancs restent blancs.
   - INTERDICTION FORMELLE : dominante jaune/orangée/ambrée artificielle, halo de bougie brumeux, lueur tungstène artificielle, bokeh brun répétitif. Les ombres sont douces et naturelles.
   - Les couleurs de la marque s'appliquent aux aplats graphiques ou typographiques. Le plat conserve ses couleurs alimentaires naturelles.
5. PHYSIQUE DE LA TEMPÉRATURE DE SERVICE :
   - Plat CHAUD (hot) : fines volutes de vapeur réalistes là où la physique l'autorise (douce lumière arrière neutre, jamais de brouillard lumineux), sauces brillantes, textures fondantes (fil de fromage, jaune coulant).
   - Plat/Boisson FRAÎCHE (cold) : fines gouttelettes de condensation sur le verre ou la bouteille, glaçons limpides aux arêtes nettes en train de fondre, garniture d'herbes ou d'agrumes humide et croquante. ZÉRO vapeur, ZÉRO fumée.
   - Produit GLACÉ (frozen) : léger début de fonte en surface, givre fin, bords évidés nets. ZÉRO fumée.
   - Température AMBIANTE (room) : surfaces mates naturelles, lumière rasante révélant la texture et le grain. ZÉRO vapeur, ZÉRO condensation.
6. PREUVES PHYSIQUES DE FRAÎCHEUR (Material Freshness Signals) :
   - Inclure des détails instantanés réalistes : ruban de vapeur fin, sauce brillante captant la lumière, marques de grill texturées et irrégulières, gouttelettes de buée, miettes naturelles à la base.
7. COMPOSITION, RESPIRATION & ESPACE NÉGATIF :
   - Hiérarchie claire : le sujet culinaire occupe 50-60% de l'image.
   - Au moins 8% de marge respirante sur tous les bords. L'affiche respire, le texte n'écrase jamais le plat.
   - ZÉRO bandeau ou barre saturée pleine largeur en bas d'affiche (interdit de faire un template lourd).
   - CTA compact présenté sous forme de pastille, badge ou sticker élégant.
8. AUCUNE MAIN (Anti-Hand Rule) :
   - Ne demande JAMAIS de mains tenant un plat ou apparaissant dans le cadre sauf si la DA le requiert explicitement.
9. ANTI-CLICHÉ PUBLICITAIRE (Counter-Example Rule) :
   - BANNIS le fond brun/orange doré générique, le bokeh flou répétitif, les bulles de prix rouges criardes, les dominantes jaunes sur la nourriture et la typographie serif condensée omniprésente.
10. FORMAT & RATIO EXPLICITE DANS LE PROMPT :
   - Précise toujours le format dès les premiers mots du poster_prompt selon target_aspect_ratio :
     * 9:16 : "Full-screen vertical 9:16 smartphone story format (1024x1792), full bleed vertical composition, optimized for mobile reels/stories."
     * 4:5 : "Vertical 4:5 social feed portrait format (1024x1280), mobile feed portrait composition."
     * 1:1 : "Square 1:1 social feed format (1024x1024), centered square poster composition."
     * 16:9 : "Wide landscape 16:9 banner format (1792x1008), horizontal banner composition."
11. COPYWRITING MARKETING DIFFÉRENCIÉ :
   - headline : Maximum 4 mots, MAJUSCULES, percutant.
   - cta : 2 à 4 mots percutants.
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
  "poster_prompt": "string — brief complet EN ANGLAIS pour le générateur d'image intégrant la DA, le photoréalisme (lumière neutre 5000-5600K), les preuves physiques de fraîcheur et la température de service",
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
  daFamily?: any;
  servingTemperature?: string;
  materials?: any[];
  offerStructure?: any;
  variety?: any;
  realismDirective?: string;
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
    daFamily,
    servingTemperature,
    materials,
    offerStructure,
    variety,
    realismDirective,
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

${daFamily ? `FAMILLE DE DIRECTION ARTISTIQUE SÉLECTIONNÉE :
- Nom : ${daFamily.name}
- Description : ${daFamily.description}
- Ordre des couches (Layer order) : ${daFamily.orderOfLayers}
- Typographie : ${daFamily.typoPersonality}
- Règle de couleur : ${daFamily.colorRule}
- Éléments à éviter : ${Array.isArray(daFamily.avoid) ? daFamily.avoid.join(', ') : daFamily.avoid}
` : ''}

${servingTemperature ? `TEMPÉRATURE DE SERVICE DU PLAT : ${servingTemperature.toUpperCase()}` : ''}
${materials && materials.length > 0 ? `PREUVES PHYSIQUES DE FRAÎCHEUR À MONTRER : ${materials.map((m: any) => m.text).join(' ; ')}` : ''}
${offerStructure ? `STRUCTURE DE L'OFFRE : ${Array.isArray(offerStructure.guidance) ? offerStructure.guidance.join(' ') : ''}` : ''}
${variety ? `VARIATION CRÉATIVE : Caméra=${variety.camera?.brief || ''}, Placement=${variety.placement?.brief || ''}, Style CTA=${variety.cta?.brief || ''}, Échelle texte=${variety.textScale?.brief || ''}` : ''}

${realismDirective ? `CONSIGNES STRICTES DE RÉALISME PHOTOGRAPHIQUE :\n${realismDirective}\n` : ''}

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
