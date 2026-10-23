const HISTORY_DEPTH = 5;

function collectHistory(recentPosts: any[], extractor: (p: any) => string | null): string[] {
  const values: string[] = [];
  for (const post of recentPosts) {
    const value = extractor(post);
    if (value && typeof value === 'string') values.push(value);
    if (values.length >= HISTORY_DEPTH) break;
  }
  return values;
}

export function buildCreativeMemory(recentPosts: any[] = [], profile: any = {}) {
  if (!Array.isArray(recentPosts) || recentPosts.length === 0) {
    return {
      food_scale_history: [],
      style_template_history: [],
      poster_family_history: [],
      angle_history: [],
      position_history: [],
      patterns_to_avoid: [],
      patterns_to_explore: [
        'restaurant interior photography',
        'lifestyle scene with authentic table setting and steaming dish',
        'clean modern architectural backdrop',
        'editorial magazine layout with generous negative space',
        'minimalist studio shot',
      ],
      visual_identity: [
        profile.tone || 'chaleureux et authentique',
        profile.type ? profile.type.toLowerCase() : 'bistrot et gastronomie',
        'affiche publicitaire haute conversion',
      ].filter(Boolean),
      self_awareness_hint: 'Première génération pour ce restaurant — liberté créative totale.',
    };
  }

  const foodScaleHistory = collectHistory(
    recentPosts,
    (p) => p.generationPayload?.creative_dna?.food_scale || null
  );
  const styleTemplateHistory = collectHistory(
    recentPosts,
    (p) => p.generationPayload?.creative_dna?.style_reference || null
  );
  const posterFamilyHistory = collectHistory(
    recentPosts,
    (p) => p.generationPayload?.advertising_concept?.poster_family || null
  );
  const angleHistory = collectHistory(
    recentPosts,
    (p) =>
      p.generationPayload?.advertising_concept?.camera_angle ||
      p.generationPayload?.creative_dna?.camera_strategy ||
      null
  );
  const positionHistory = collectHistory(
    recentPosts,
    (p) => p.generationPayload?.creative_dna?.composition_strategy || null
  );

  const pastHeadlines = recentPosts.map((p) => p.headline || p.text?.slice(0, 30)).filter(Boolean);
  const pastPrompts = recentPosts.map((p) => p.generationPayload?.poster_prompt || '').filter(Boolean);
  const promptsText = pastPrompts.join(' ').toLowerCase();

  const patternsToAvoid: string[] = [];
  if (foodScaleHistory.length > 0) {
    patternsToAvoid.push(
      `répéter la même échelle alimentaire récente (${foodScaleHistory.join(', ')}) — varier consciemment`
    );
  }
  if (styleTemplateHistory.length > 0) {
    patternsToAvoid.push(
      `reproduire la même direction de style (${styleTemplateHistory.join(', ')})`
    );
  }
  if (angleHistory.length > 0) {
    patternsToAvoid.push(
      `répéter le même angle de vue (${angleHistory.join(' | ')}) — si plongée utilisée, privilégier vue de face, 45° ou macro dynamique`
    );
  }
  if (positionHistory.length > 0) {
    patternsToAvoid.push(
      `répéter la même disposition (${positionHistory.slice(0, 2).join(' | ')}) — varier la place du titre et du produit`
    );
  }
  if (promptsText.includes('dark') || promptsText.includes('shadow')) {
    patternsToAvoid.push('ambiance sombre et ombres lourdes artificielles');
  }
  if (patternsToAvoid.length === 0 && pastHeadlines.length > 0) {
    patternsToAvoid.push('répéter la composition exacte du post précédent');
  }

  const allPossibleExplorations = [
    'cadrage d’ambiance à l’intérieur du restaurant',
    'scène de vie naturelle avec table dressée et plat fumant',
    'lumière naturelle douce du jour venant d’une fenêtre',
    'fond épuré moderne et aéré',
    'composition éditoriale type magazine culinaire avec espace négatif généreux',
    'mise en valeur du produit avec textures croustillantes et fraîches',
  ];

  const patternsToExplore = allPossibleExplorations
    .filter((exp) => !promptsText.includes(exp.split(' ')[0]))
    .slice(0, 4);

  return {
    food_scale_history: foodScaleHistory,
    style_template_history: styleTemplateHistory,
    poster_family_history: posterFamilyHistory,
    angle_history: angleHistory,
    position_history: positionHistory,
    patterns_to_avoid: patternsToAvoid,
    patterns_to_explore: patternsToExplore.length > 0 ? patternsToExplore : allPossibleExplorations.slice(0, 4),
    visual_identity: [
      profile.tone || 'chaleureux',
      profile.type ? profile.type.toLowerCase() : 'gastronomie',
      profile.city ? `énergie locale ${profile.city}` : 'moderne',
    ].filter(Boolean),
    self_awareness_hint: angleHistory.length
      ? `Historique récent pour ce restaurant : ${angleHistory.join(' → ')}. Varie consciemment l’angle maintenant (si plongée → face, si centré → décentré, si incliné → frontal).`
      : 'Première génération pour ce restaurant — liberté créative totale.',
  };
}
