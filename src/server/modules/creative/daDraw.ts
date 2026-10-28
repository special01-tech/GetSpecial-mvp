import crypto from 'crypto';

export interface DAFamily {
  id: string;
  name: string;
  description: string;
  orderOfLayers: string;
  typoPersonality: string;
  colorRule: string;
  accents: string[];
  infoZone: string;
  compatiblePlats: string[];
  avoid: string[];
}

export const DA_FAMILIES: Record<string, DAFamily> = {
  sports_match_night_pop_illustration: {
    id: 'sports_match_night_pop_illustration',
    name: 'Soirée Match & Illustration Pop BD',
    description: 'Style illustration Pop/BD rétro avec aplat vert terrain (#0E7A45), contours noirs francs et typographie géante bicolore noire et blanche (MATCH NIGHT).',
    orderOfLayers: 'Aplat vert terrain -> Titre géant bicolore -> Illustration vectorielle foot/sport -> Bandeau d’informations au pied',
    typoPersonality: 'Typographie Extra-Bold droite bicolore (MATCH en blanc, NIGHT en noir)',
    colorRule: 'Vert Terrain (#0E7A45) + Orange Solaire + Noir & Blanc',
    accents: ['Ballon de foot / symbole sportif illustré', 'Ligne de sol cream'],
    infoZone: 'Adresse du bar sportif et horaire du match en bas sur bandeau blanc/vert',
    compatiblePlats: ['evenement', 'retransmission_match', 'soiree_foot', 'biere', 'bar_sportif'],
    avoid: ['Photo réaliste floue', 'Couleurs éteintes', 'Typographie trop classique'],
  },
  happy_hour_beer_splash_foam: {
    id: 'happy_hour_beer_splash_foam',
    name: 'Happy Hour Mousse Dorée & Splash Liquide',
    description: 'Arrière-plan en gros plan de mousse de bière dorée pétillante ou splash de liquide jaillissant d’une bouteille, surmonté du titre HAPPY HOUR et de l’offre 1 Acheté = 1 Offert.',
    orderOfLayers: 'Fond bière pétillante / splash -> Titre géant blanc HAPPY HOUR -> Mention Every Friday -> Offre 1 acheté = 1 offert',
    typoPersonality: 'Headline géante blanche extra-bold percutante',
    colorRule: 'Or Bière (#FF9900) + Mousse Blanche + Fond Crème',
    accents: ['Bulles et mousse de bière ultra-fraîches en macro', 'Gouttes de condensation'],
    infoZone: 'Mentions légales et site web au pied',
    compatiblePlats: ['biere', 'happy_hour', 'cocktail', 'apero', 'soiree_bar'],
    avoid: ['Boisson terne sans mousse', 'Texte illisible'],
  },
  humorous_character_neon_basic: {
    id: 'humorous_character_neon_basic',
    name: 'Personnage à Personnalité & Typo Néon Fluo',
    description: 'Portrait décalé et chaleureux d’un personnage faisant une pose cool en dégustant son plat/boisson, surmonté d’un titre géant jaune néon et d’un sticker rouge de fraîcheur.',
    orderOfLayers: 'Photo portrait décalée du personnage à table -> Titre géant jaune néon en haut -> Sticker rouge Fresh -> Plats dressés au 1er plan',
    typoPersonality: 'Typographie ultra-condensée géante jaune néon',
    colorRule: 'Jaune Néon Fluo (#FFFF00) + Rouge Vif (#FF0000) + Tonalités naturelles',
    accents: ['Sticker rectangulaire rouge oblique FRESH', 'Geste de main décalé'],
    infoZone: 'Bandeau minimaliste au bas',
    compatiblePlats: ['plat_signature', 'plat_traditionnel', 'menu_du_jour', 'boisson_maison', 'dessert'],
    avoid: ['Photo trop formelle', 'Manque d’humour/chaleur'],
  },
  vertical_stacked_condensed_yellow: {
    id: 'vertical_stacked_condensed_yellow',
    name: 'Aplat Jaune & Titre Vertical Empilé',
    description: 'Un aplat jaune d’or uniforme (#FFC700) avec un titre géant ultra-condensé blanc empilé à la verticale en arrière-plan, masqué au centre par le produit entier.',
    orderOfLayers: 'Aplat jaune d’or -> Titre géant condensé blanc empilé -> Produit coupé en 2 au premier plan -> Sous-titres minimalistes',
    typoPersonality: 'Sans-serif ultra-condensée extra-bold verticale (ex: KEBAB KEBAB)',
    colorRule: 'Jaune Bouton d’or (#FFC700) + Blanc Crème (#FFFFE0)',
    accents: ['Trait de séparation blanc fin au pied avec mention so delicious'],
    infoZone: 'Texte minimaliste en bas',
    compatiblePlats: ['kebab', 'sandwich', 'tacos', 'burger', 'burrito'],
    avoid: ['Surcharge visuelle', 'Couleurs sombres', 'Texte masquant le produit'],
  },
  terracotta_sunlit_script: {
    id: 'terracotta_sunlit_script',
    name: 'Terracotta Ensoleillée & Calligraphie Feutre',
    description: 'Ambiance terrasse italienne ensoleillée sur sol en terre cuite avec ombres portées naturelles, surmontée d’un titre en calligraphie feutre jaune soleil.',
    orderOfLayers: 'Photo naturelle terrasse/terracotta -> Plat et verre -> Titre calligraphique manuscrit feutre jaune -> Mentions horaires et prix au bas',
    typoPersonality: 'Calligraphie manuscrite feutre fluide jaune',
    colorRule: 'Terre cuite Terracotta (#C85A32) + Jaune Soleil (#FFD700) + Blanc',
    accents: ['Ombres portées du soleil', 'Verre de spritz en second plan'],
    infoZone: 'Mentions horaires et prix écrites en majuscules blanches épurées au pied',
    compatiblePlats: ['pates', 'pizza', 'apero', 'brunch', 'plat_italien'],
    avoid: ['Lumière studio artificielle', 'Fond plat', 'Police trop rigide'],
  },
  hands_breaking_pastry_nude: {
    id: 'hands_breaking_pastry_nude',
    name: 'Mains qui Cassent la Pâtisserie & Fond Nude',
    description: 'Photo en gros plan de deux mains humaines ouvrant et cassant une pâtisserie/pain gourmand en deux, sur fond crème/nude avec motif géométrique floral orange.',
    orderOfLayers: 'Fond crème épuré -> Motif floral orange en coin -> Deux mains cassant le gâteau -> Titre bicolore brossé -> Bouton d’action orange',
    typoPersonality: 'Titre moderne bicolore gris et orange (Take A Bite)',
    colorRule: 'Crème / Nude (#F9F6F0) + Orange Pêche (#FF8C00) + Gris Ardoise',
    accents: ['Morceaux de chocolat volants', 'Motif floral contemporain en coin'],
    infoZone: 'Capsule d’adresse et contact noire et orange au pied',
    compatiblePlats: ['patisserie', 'dessert', 'pain', 'cake', 'petit_dejeuner'],
    avoid: ['Produit statique sans geste humain', 'Couleurs trop vives sans harmonie'],
  },
  artist_portrait_sticker_cutout: {
    id: 'artist_portrait_sticker_cutout',
    name: 'Portrait Artiste Découpé & Contour Sticker Blanc',
    description: 'Photo de l’artiste/DJ détourée avec une bordure blanche épaisse style sticker papier, posée sur un fond texturé avec titre rétro bulle ou géant.',
    orderOfLayers: 'Fond texturé/couleur -> Titre géant arrière-plan -> Photo artiste détourée avec contour sticker blanc -> Étiquettes noms DJs -> Badges date/heure',
    typoPersonality: 'Typographie bulle pop 70s ou extra-bold ultra-condensée',
    colorRule: 'Rouge Vif / Bordeaux + Blanc Crème',
    accents: ['Contour sticker blanc épais autour des artistes', 'Étiquettes nominatives au pied de chaque personne'],
    infoZone: 'Date, heure et lieu sous forme de ligne d’info épurée au bas',
    compatiblePlats: ['evenement', 'soiree_dj', 'concert', 'karaoke', 'girls_night'],
    avoid: ['Détourage baveux', 'Police trop classique', 'Manque de relief'],
  },
  stage_lights_bokeh_singer_portrait: {
    id: 'stage_lights_bokeh_singer_portrait',
    name: 'Scène Lumineuse & Portrait Artiste Bokeh',
    description: 'Portrait géant d’un chanteur/chanteuse au micro avec éclairage de scène rouge chaleureux et flous bokeh lumineux, surmonté d’un titre géant blanc en bas.',
    orderOfLayers: 'Arrière-plan photo d’artiste en scène avec bokeh -> Titre géant blanc masquant le bas du portrait -> Ruban rouge d’hôte -> Barre verticale d’ouverture des portes',
    typoPersonality: 'Headline géante extra-condensée blanche (KARAOKE NIGHT)',
    colorRule: 'Rouge Scène / Ambre + Blanc Éclatant',
    accents: ['Flous bokeh lumineux (lights)', 'Code-barres esthétique en coin', 'Ruban rouge Hosted by'],
    infoZone: 'Adresse, téléphone et réservations RSVP au pied',
    compatiblePlats: ['evenement', 'karaoke', 'concert', 'live_music', 'soiree_bar'],
    avoid: ['Lumière terne sans contraste', 'Texte masquant le visage de l’artiste'],
  },
  vintage_chrome_mic_smoke_neon: {
    id: 'vintage_chrome_mic_smoke_neon',
    name: 'Micro Vintage Chromé 3D & Volutes de Fumée',
    description: 'Pour les événements sans photo d’artiste : un micro rétro vintage chromé ou doré au centre, entouré de volutes de fumée, d’étincelles et d’un titre néon/doré 3D.',
    orderOfLayers: 'Fond sombre charbon -> Volutes de fumée & étincelles -> Micro vintage chromé 3D -> Titre néon/doré 3D -> Ticket Entry is Free -> Barre de contact',
    typoPersonality: 'Typographie métallisée dorée 3D biseautée ou vert rétro grainé',
    colorRule: 'Noir / Sombre + Doré Métallique / Vert Émeraude',
    accents: ['Volutes de fumée de scène', 'Ticket perforé ENTRY IS FREE', 'Étincelles lumineuses'],
    infoZone: 'Adresse complète et numéros de téléphone pour réservation en bas',
    compatiblePlats: ['evenement', 'karaoke', 'jeux_et_musique', 'night_club', 'soiree_bar'],
    avoid: ['Effet 3D bas de gamme', 'Absence de fumée/lueur de scène', 'Surcharge textuelle'],
  },
  horizontal_pill_combo_card: {
    id: 'horizontal_pill_combo_card',
    name: 'Bandeau Pilule Horizontal & Prix Géant Weekday',
    description: 'Un bandeau horizontal rouge aux coins très arrondis au centre d’un fond crème/ivoire épuré, portant le plat principal, son accompagnement et une bouteille de boisson posée, avec un prix géant en bas à droite.',
    orderOfLayers: 'Fond crème épuré -> Bandeau pilule rouge -> Plat principal + bol de sauce + bouteille en verre -> Titre Combo bicolore -> Prix géant',
    typoPersonality: 'Titre Combo bicolore (Orange & Rouge) + Prix géant avec condition (Only on Weekdays)',
    colorRule: 'Rouge Crimson + Orange Solaire sur fond Crème/Ivoire (#FDFBF7)',
    accents: ['Tranches de tomate volantes en flou', 'Sous-verre en liège pour la bouteille'],
    infoZone: 'Capsule dégradée orange/rouge en bas avec compte Instagram et téléphone',
    compatiblePlats: ['combo_plat', 'menu_etudiant', 'formule_midi', 'riz_gras', 'boisson'],
    avoid: ['Fond sombre étouffant', 'Texte entassé', 'Manque d’espace respirant'],
  },
  arch_cutout_framing_dish: {
    id: 'arch_cutout_framing_dish',
    name: 'Découpe d’Arche Blanche & Badges Étincelles',
    description: 'Une arche blanche découpée sur un fond rouge vif, au centre de laquelle repose le bol du plat principal, agrémenté de petits badges promo dentelés et d’étoiles étincelles.',
    orderOfLayers: 'Fond rouge vif -> Découpe d’arche blanche centrale -> Bol du plat au centre -> Étoiles étincelles 3D -> Badge dentelé promo -> Barre d’action noire',
    typoPersonality: 'Typographie festive moderne avec accentuation en jaune (ex: Better Meals)',
    colorRule: 'Rouge Vif (#FF0033) + Blanc Pur + Jaune poussin (#FFCC00)',
    accents: ['Badge dentelé jaune/rouge 10% OFF', 'Petite cloche d’alerte 3D', 'Étoiles étincelles à 4 branches'],
    infoZone: 'Barre d’action noire horizontale avec réseaux sociaux et bouton ORDER TODAY',
    compatiblePlats: ['plat_du_mois', 'riz_jollof', 'nouveaute', 'menu_du_jour', 'plat'],
    avoid: ['Lumière terne', 'Trop de texte masquant l’arche', 'Bordures floues'],
  },
  smoky_grill_board_annotation: {
    id: 'smoky_grill_board_annotation',
    name: 'Ambiance Fumée Barbecue & Cercle d’Annotation',
    description: 'Fond sombre charbon avec fumée de grillade montante et lueur rougeoyante, gros plan au premier plan sur une pièce de viande/poulet bien dorée, surmontée d’un cercle d’annotation feutre jaune.',
    orderOfLayers: 'Fond sombre charbon -> Volutes de fumée -> Gros plan plat grillé -> Titre bicolore Blanc & Jaune -> Cercle d’annotation feutre -> Bouton Order Now',
    typoPersonality: 'Headline moderne blanche & jaune avec symbole & manuscrit',
    colorRule: 'Noir Charbon / Fumé + Jaune Fluo (#FFCC00) + Orange grillade',
    accents: ['Volutes de fumée de bois', 'Cercle d’annotation manuscrit feutre jaune avec texte Fresh off the grill'],
    infoZone: 'Bouton jaune fluo Order Now posé directement sur la composition',
    compatiblePlats: ['poulet_braise', 'grillade', 'chawarma', 'barbecue', 'poisson_braise'],
    avoid: ['Photo froide', 'Absence de fumée/lueur de braise', 'Texte trop petit'],
  },
  giant_masked_title_multi_cards: {
    id: 'giant_masked_title_multi_cards',
    name: 'Titre Géant Masqué & Cartes Miniatures',
    description: 'Titre de plat écrit en lettres géantes blanches masquées par une grande assiette au centre, complété par 4 cartes miniatures blanches en bas avec typographie manuscrite pour les options secondaires.',
    orderOfLayers: 'Aplat/Dégradé chaud -> Titre géant blanc -> Assiette principale au centre -> 4 cartes miniatures avec photos -> Bloc adresses et téléphones',
    typoPersonality: 'Typographie géante extra-condensée + Titres de cartes miniatures manuscrits décontractés',
    colorRule: 'Dégradé Orange/Ambre chaleureux + Cartes Blancs et Texte Noir',
    accents: ['Petits piments rouges posés', 'Badges de cartes rounded', 'Icônes réseaux sociaux'],
    infoZone: 'Multi-adresses et téléphones séparés par des barres verticales au pied',
    compatiblePlats: ['attieke', 'plat_traditionnel', 'garba', 'menu_du_jour', 'grillade', 'plat'],
    avoid: ['Lumière froide', 'Texte illisible', 'Cartes secondaires sans contraste'],
  },
  oblique_stripe_carousel_dishes: {
    id: 'oblique_stripe_carousel_dishes',
    name: 'Bandeau Oblique & Carrousel 3 Plats',
    description: 'Bandeau de couleur oblique en diagonale avec 3 plats ronds disposés en enfilade (1 plat central entier et 2 plats latéraux amorçant le carrousel).',
    orderOfLayers: 'Fond clair -> Bandeau oblique coloré -> 3 plats en enfilade panoramique -> Étiquettes capsules d’identification -> Titre bold et badge promo',
    typoPersonality: 'Sans-serif droite noire + Mot-clé principal extra-bold rouge/orange',
    colorRule: 'Orange vibrant sur Blanc Crème + Badges Rouges',
    accents: ['Étiquettes capsules blanches', 'Badge -Premium Enjoyment-', 'Éléments amorçant le carrousel'],
    infoZone: 'Barre noire arrondie en bas avec Order Now et téléphone',
    compatiblePlats: ['soupe', 'riz_gras', 'nouilles', 'combo_plat', 'carte_du_jour'],
    avoid: ['Plats coupés de façon maladroite', 'Couleurs éteintes', 'Texte surchargé'],
  },
  human_tasting_wavy_ribbon: {
    id: 'human_tasting_wavy_ribbon',
    name: 'Humain Dégustation & Ligne Ondulée Rouge',
    description: 'Photo d’un client souriant en train de mordre dans le produit culinaire au-dessus d’une table bien garnie, traversée par une ligne rouge ondulée fluide.',
    orderOfLayers: 'Fond jaune chaleureux -> Ligne rouge ondulée fluide -> Photo du client dégustant -> Plats et verres dressés sur la table -> Macaron tampon 100% Frais -> Barre de contact',
    typoPersonality: 'Titre moderne avec mot-clé en italique rouge "Flavour"',
    colorRule: 'Jaune Solaire (#FFD700) + Rouge Éclatant + Barre Noire',
    accents: ['Ligne ondulée rouge fluide', 'Macaron circulaire effet tampon 100% FRESH & TASTY', 'Pilon volant'],
    infoZone: 'Barre de contact noire avec boutons WhatsApp et réseaux sociaux',
    compatiblePlats: ['poulet_braise', 'grillade', 'burger', 'plat_traditionnel', 'menu_du_jour'],
    avoid: ['Absence d’émotion humaine', 'Table vide', 'Fond terne'],
  },
  multi_card_menu_du_jour: {
    id: 'multi_card_menu_du_jour',
    name: 'Menu du Jour Cartes Empilées & Plats Débordants',
    description: 'Empilement vertical de 3 cartes de couleur arrondies (Rouge, Jaune, Vert/Blanc), chaque plat principal reposant dans une assiette qui déborde de sa carte avec pastille de prix.',
    orderOfLayers: 'Fond brun/rouge -> Cartes arrondies colorées -> Assiettes de plats débordantes -> Typographie nom de plat -> Pastilles de prix rondes',
    typoPersonality: 'Titre de catégorie extra-bold + Noms de plats en majuscules bien détachées',
    colorRule: 'Trio de cartes vives (Rouge #E50914, Jaune #FFA800, Vert #72B01D) sur fond neutre foncé',
    accents: ['Pastilles circulaires bi-prix (small/large)', 'Assiettes débordantes', 'Bandeau accompagnement'],
    infoZone: 'Bandeau boissons et accompagnements au pied du menu',
    compatiblePlats: ['menu_du_jour', 'carte_du_jour', 'combo_plat', 'multi_burgers', 'plat'],
    avoid: ['Présentation sous forme de simple tableau ennuyeux', 'Texte masquant les assiettes', 'Couleurs ternes'],
  },
  circular_target_dishes_assortment: {
    id: 'circular_target_dishes_assortment',
    name: 'Couronne de Plats & Cible Géométrique',
    description: 'Disposition en cercle ou en satellite de 4 à 5 assiettes rondes disposées autour d’un élément central fort (cible géométrique ou cadran horloge 24h) sur fond lumineux trammé.',
    orderOfLayers: 'Fond trammé/rayons -> Motif central (Cible ou Horloge géante) -> Assiettes rondes disposées en satellite -> Titre géant masqué en fond -> Badges contact et commande',
    typoPersonality: 'Sans-serif épurée et moderne avec titrage géant en arrière-plan',
    colorRule: 'Jaune Solaire / Orange Warm avec accents Blancs et Rouges',
    accents: ['Trame de fond à petits points (dot grid)', 'Aiguilles d’horloge ou arcs de cercle concentriques'],
    infoZone: 'Capsule d’information contact (WhatsApp, téléphone) et réseaux en bas',
    compatiblePlats: ['assortiment_plats', 'menu_du_jour', '24h_service', 'carte_restaurant', 'plat_combine'],
    avoid: ['Chevauchement chaotique des plats', 'Manque de clarté dans le message central', 'Mauvais détourage'],
  },
  promo_table_feast_action_fork: {
    id: 'promo_table_feast_action_fork',
    name: 'Grand Festin Dressé & Fourchette en Action',
    description: 'Table garnie de 4 à 5 plats au premier plan avec un geste d’action (ex: fourchette qui soulève des nouilles/riz), surmonté d’un ruban promo brossé et d’un sticker "Aujourd’hui seulement".',
    orderOfLayers: 'Fond bordeaux à rayons (sunburst) -> Table en marbre -> Assortiment de plats avec action fourchette levée -> Ruban promo brossé -> Sticker offre',
    typoPersonality: 'Typographie promo impactante Buy 1 Get 1 en lettres brossées/stencil',
    colorRule: 'Rouge Bordeaux (#800020) + Jaune d’or + Blanc marbre',
    accents: ['Fourchette levée en action', 'Ruban blanc brossé façon peinture', 'Sticker coin corné TODAY ONLY'],
    infoZone: 'Barre d’action "Commander sur..." au pied de la composition',
    compatiblePlats: ['promotion_1achete_1offert', 'buffet', 'grand_festin', 'menu_famille', 'combo'],
    avoid: ['Photo de table vide', 'Titres plats sans relief', 'Absence d’indication de l’offre'],
  },
  red_flat_human_hand_serif: {
    id: 'red_flat_human_hand_serif',
    name: 'Aplat Crimson & Main Porte-Plat Retro',
    description: 'Un aplat rouge crimson ultra-intense et uniforme, avec une main humaine tenant le plat sur une assiette en métal, surmonté d’un titre accrocheur incurvé en typographie rétro écru/crème.',
    orderOfLayers: 'Aplat rouge pur -> Main humaine + plat servi sur assiette -> Titre incurvé rétro écru juste au-dessus du plat',
    typoPersonality: 'Serif rétro courbé/incurvé crémeux (style vintage italien gourmet)',
    colorRule: 'Rouge Crimson éclatant (#C8102E) + Texte Crème Écru (#FFFDD0)',
    accents: ['Assiette en inox brillante', 'Ongles vernis', 'Titre courbé dynamique'],
    infoZone: 'Texte court d’accroche au centre, prix/logo en coin discret',
    compatiblePlats: ['sandwich', 'burger', 'pizza', 'plat', 'dessert'],
    avoid: ['Fond brun dégradé', 'Lumière jaune artificielle', 'Typographie banale droite'],
  },
  diagonal_split_clinking_hands: {
    id: 'diagonal_split_clinking_hands',
    name: 'Split Diagonale Aperol & Mains qui Trinquant',
    description: 'Composition festive à fort impact avec un split bicolore diagonal (Orange Aperol vibrant sur fond Blanc). Deux mains tenant des verres trinquent à cheval sur la ligne de séparation.',
    orderOfLayers: 'Fond bicolore en split diagonal -> Mains avec verres trinquants franchissant la ligne -> Titre manuscrit en haut -> Typographie condensée empilée en bas',
    typoPersonality: 'Titre manuscrit fluide en haut + Sans-serif ultra-condensée extra-bold empilée en bas',
    colorRule: 'Orange Aperol Punchy (#FF5F00) + Blanc pur (#FFFFFF)',
    accents: ['Stickers motifs géométriques (flocons/étoiles/cercles)', 'Bouteille au premier plan en bas à droite'],
    infoZone: 'Bloc texte empilé centré en bas, mention légale en très petit au pied',
    compatiblePlats: ['cocktail', 'boisson', 'aperitif', 'biere', 'combo'],
    avoid: ['Fond noir étouffant', 'Effet 3D plastique', 'Texte désordonné'],
  },
  rounded_card_overlay_beverage: {
    id: 'rounded_card_overlay_beverage',
    name: 'Carte à Coins Arrondis & Bouteille en Main',
    description: 'Superposition d’une carte jaune à coins très arrondis sur un fond rouge vif. La main tient une bouteille givrée au premier plan qui déborde de la carte pour un effet 3D moderne.',
    orderOfLayers: 'Fond rouge intense -> Carte superposition jaune à coins arrondis -> Main tenant la bouteille au 1er plan -> Typographie bordeaux et badges de paiement',
    typoPersonality: 'Sans-serif moderne arrondie et chaleureuse en majuscules/minuscules',
    colorRule: 'Jaune Bouton d’or (#FFC700) sur Rouge Cardinal (#D31027) + Texte Bordeaux foncé (#660000)',
    accents: ['Badge pilule arrondi avec logos de cartes bancaires (Visa/Mastercard)', 'Barre de contact en bas'],
    infoZone: 'Pilule de paiement flottante à droite, barre d’infos utile en bas',
    compatiblePlats: ['boisson', 'biere', 'cocktail', 'fast_food', 'menu_etudiant'],
    avoid: ['Typographie condensée froide', 'Fond terne', 'Absence d’interaction humaine'],
  },
  floating_hero_doodle_lines: {
    id: 'floating_hero_doodle_lines',
    name: 'Hero Flottant & Traits de Griffonnage Blancs',
    description: 'Le produit culinaire principal est au centre, entouré d’ingrédients volants en apesanteur et de lignes de griffonnage blanches dessinées au trait fin.',
    orderOfLayers: 'Fond sombre dégradé -> Ombre radiale centrale -> Produit culinaire principal -> Ingrédients volants en mouvement -> Lignes de griffonnage blanches vectorielles -> Typographie biseautée',
    typoPersonality: 'Typographie Headline biseautée/ombrée 3D avec sous-titre fin manuscrit',
    colorRule: 'Fond Brun Chocolat Sombre / Charbon + Texte Orange Éclatant & Blanc',
    accents: ['Lignes de griffonnage manuscrites blanches', 'Ingrédients volants en flou de mouvement'],
    infoZone: 'Site web / adresse en bas au centre',
    compatiblePlats: ['burger', 'sandwich', 'tacos', 'grillade', 'pizza'],
    avoid: ['Surcharge visuelle', 'Texte ilisible', 'Couleurs éteintes'],
  },
  split_couleur_plat_qui_deborde: {
    id: 'split_couleur_plat_qui_deborde',
    name: 'Split Couleur & Plat qui Déborde',
    description: 'Composition bicolore diagonale ou moitié-moitié, le plat principal à cheval sur la transition pour créer de la profondeur.',
    orderOfLayers: 'Fond bicolore -> Ombre du plat -> Plat principal débordant -> Typographies et accents',
    typoPersonality: 'Sans-serif moderne percutant en majuscules',
    colorRule: '2 teintes franches contrastées (ex: couleur marque + fond neutre respirant)',
    accents: ['Ligne de coupe diagonale', 'Ombre portée douce'],
    infoZone: 'Prix en bas à gauche, CTA en bas à droite',
    compatiblePlats: ['burger', 'pizza', 'sandwich', 'plat', 'boisson'],
    avoid: ['Fond brun doré générique', 'Texte masquant le cœur du plat', 'Bandeau noir massif en bas'],
  },
  titre_geant_derriere_plat: {
    id: 'titre_geant_derriere_plat',
    name: 'Titre Géant Derrière le Plat',
    description: 'Un aplat de couleur pure avec un titre écrit en caractères géants partiellement masqués par le plat positionné au premier plan.',
    orderOfLayers: 'Aplat couleur -> Titre géant -> Plat principal au premier plan -> Légendes secondaires',
    typoPersonality: 'Typographie Extra-Bold ultra-condensée géante',
    colorRule: 'Aplat unicolore vif ou pastel',
    accents: ['Effet de profondeur par masquage partiel des lettres'],
    infoZone: 'Prix intégré dans la typographie ou en macaron discret',
    compatiblePlats: ['burger', 'cocktail', 'dessert', 'plat', 'boisson'],
    avoid: ['Lumière studio jaune uniforme', 'Effet 3D plastique', 'Bandeau rouge ou noir'],
  },
  studio_sombre_griffonnages: {
    id: 'studio_sombre_griffonnages',
    name: 'Studio Sombre & Griffonnages',
    description: 'Fond sombre élégant avec éclairage latéral sur le produit, enrichi de petits graphismes/griffonnages blancs ou fluo faits main.',
    orderOfLayers: 'Fond sombre texturé -> Lumière rasante plat -> Griffonnages et flèches dessinés -> Typographie manuscrite ou moderne',
    typoPersonality: 'Mélange Sans-serif et accents manuscrits',
    colorRule: 'Fond sombre (ardoise, charbon) + accents blancs/fluo',
    accents: ['Griffonnages', 'Ticket de prix dessiné', 'Flèches manuscrites'],
    infoZone: 'Prix format ticket de caisse ou étiquette dessinée à la main',
    compatiblePlats: ['grillade', 'cocktail', 'fast_food', 'plat_signature'],
    avoid: ['Fond marron huileux', 'Gouttes d water/bokeh IA clichés', 'Texte illisible'],
  },
  pop_retro_collage: {
    id: 'pop_retro_collage',
    name: 'Pop Rétro Collage',
    description: 'Ambiance Pop Art vintage avec motifs géométriques, texture papier grainée et découpe franche du produit.',
    orderOfLayers: 'Motif rétro (halftone/sunburst) -> Texture papier -> Detourage plat -> Typographie rétro dînait',
    typoPersonality: 'Typographie rétro vintage ou bulle pop',
    colorRule: 'Palette rétro vibrante (Jaune moutarde, Rouge brique, Vert sauge)',
    accents: ['Trame halftone', 'Texture papier grainée', 'Star-burst badge'],
    infoZone: 'Pastille rétro ou bandeau oblique dynamique',
    compatiblePlats: ['burger', 'boisson', 'dessert', 'combo'],
    avoid: ['Fond brun orange dégradé', 'Rendu hyper-réaliste 3D', 'Effet plastique'],
  },
  editorial_photo_reelle: {
    id: 'editorial_photo_reelle',
    name: 'Éditorial Photo Réelle',
    description: 'Photographie culinaire naturelle style magazine gastronomique avec lumière du jour traversante et typographie italique raffinée.',
    orderOfLayers: 'Décor naturel/lifestyle -> Ombre douce -> Plat stylisé -> Serif classique et italique discret',
    typoPersonality: 'Serif classique raffiné avec touche d\'italique',
    colorRule: 'Tonalités naturelles (bois, céramique, lumière du jour)',
    accents: ['Espace négatif généreux', 'Lumière traversante naturelle'],
    infoZone: 'Légende discrète et élégante en bas de page',
    compatiblePlats: ['plat_cuisine', 'dessert', 'vin', 'menu_gastronomique'],
    avoid: ['Stickers clignotants', 'Prix géant agressif', 'Effet fast-food'],
  },
  photo_plein_cadre_pile_de_mots: {
    id: 'photo_plein_cadre_pile_de_mots',
    name: 'Photo Plein Cadre & Pile de Mots',
    description: 'Visualisation plein cadre du plat avec des mots-clés empilés graphiquement de manière lisible sur un côté.',
    orderOfLayers: 'Photo plein cadre -> Scrim de lisibilité subtil -> Pile de mots typographiques',
    typoPersonality: 'Heavy Sans-serif empilé avec graisses variables',
    colorRule: 'Palette extraite directement des couleurs naturelles du plat',
    accents: ['Mots empilés', 'Logo encadré'],
    infoZone: 'Dernière ligne de la pile de mots avec contact et prix',
    compatiblePlats: ['pizza', 'burger', 'plat_combine', 'evenement'],
    avoid: ['Bandeau noir bas figé', 'Texte masquant le produit principal'],
  },
};

export interface DADrawResult {
  family: DAFamily;
  referenceIds: string[];
  counterExample: string;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function drawDAFamily(
  accountId: string,
  offerId: string,
  dateStr: string,
  recentFamilies: string[] = []
): DADrawResult {
  const seedStr = `${accountId}_${dateStr}_${offerId}`;
  const seed = simpleHash(seedStr);
  const keys = Object.keys(DA_FAMILIES);

  const availableKeys = keys.filter((k) => !recentFamilies.includes(k));
  const pool = availableKeys.length > 0 ? availableKeys : keys;

  const selectedKey = pool[seed % pool.length];
  const family = DA_FAMILIES[selectedKey];

  const counterExample = 'Éviter impérativement le fond brun/orange doré générique, le bokeh flou répétitif, les bulles rouges de prix et la typographie serif condensée identique sur chaque affiche.';

  return {
    family,
    referenceIds: [`ref_${selectedKey}_01`, `ref_${selectedKey}_02`],
    counterExample,
  };
}
