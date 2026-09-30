/**
 * Script de test E2E complet pour le pilote restaurant américain et international.
 * Teste la chaîne complète :
 * 1. Création compte utilisateur (restaurateur)
 * 2. Enregistrement direct de l'établissement (saisi par l'utilisateur, pas via annuaire API)
 * 3. Récupération des signaux dynamiques réels (Météo OpenWeather, Événements Ticketmaster, Fêtes Calendarific)
 * 4. Moteur d'opportunités marketing IA (génération basée sur la météo/événements du jour)
 * 5. Approbation de publication
 * 6. Emergency Pause & Reprise
 * 7. Métriques & Analytics réseaux sociaux Zernio
 * 8. Isolation multi-tenant stricte
 */

async function main() {
  const baseUrl = 'http://localhost:3000';
  console.log('🚀 DÉMARRAGE DU TEST E2E — PILOTE RESTAURANT & SIGNAUX DYNAMIQUES\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Inscription du restaurateur
  const testEmail = `pilot_owner_${Date.now()}@thebrasspelican.com`;
  console.log(`\n--- 1. AUTHENTIFICATION UTILISATEUR (${testEmail}) ---`);
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'SecurePassword123!',
      name: 'Johnathan Pelican',
    }),
  });
  const regData = await regRes.json();
  const userId = regData.data?.id || regData.data?.user?.id;
  assert(regRes.status === 201 && regData.success && Boolean(userId), `Inscription utilisateur réussie avec ID généré (${userId})`);

  // 2. Connexion du restaurateur
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'SecurePassword123!',
    }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200 && loginData.success, 'Connexion réussie avec token de session');

  // 3. Enregistrement direct du restaurant par l'utilisateur (The Brass Pelican, Austin TX)
  console.log('\n--- 2. ENREGISTREMENT DIRECT DU RESTAURANT PAR L\'UTILISATEUR ---');
  const restRes = await fetch(`${baseUrl}/api/restaurants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'The Brass Pelican',
      type: 'American Bistro & Seafood',
      address: '412 Congress Ave, Austin, TX 78701',
      latitude: 30.2672,
      longitude: -97.7431,
      country: 'US',
      userId: userId,
      openingHours: { general: '11:30 AM - 11:00 PM • Tue - Sun' },
      specialties: ['Gulf Oysters', 'Craft Cocktails', 'Smoked Ribeye'],
      tone: 'friendly & welcoming',
      hasTerrace: true,
      hasDelivery: true,
      offPeakDays: ['tuesday', 'wednesday'],
    }),
  });
  const restData = await restRes.json();
  assert(restRes.status === 201 && restData.success && restData.data?.id, 'Restaurant créé et lié au compte utilisateur');
  const restaurantId = restData.data?.id;
  console.log(`   ID Restaurant créé: ${restaurantId}`);
  assert(restData.data?.country === 'US', 'Pays du restaurant correctement défini (US)');
  assert(restData.data?.latitude === 30.2672 && restData.data?.longitude === -97.7431, 'Coordonnées GPS assignées pour les APIs météo et événements');

  // 4. Test des signaux dynamiques réels (Météo, Événements, Fêtes)
  console.log('\n--- 3. SIGNAUX DYNAMIQUES RÉELS (API EXTERNES) ---');
  const signalsRes = await fetch(`${baseUrl}/api/signals/today?restaurantId=${restaurantId}`);
  const signalsData = await signalsRes.json();
  assert(signalsRes.status === 200 && signalsData.success, 'Route /api/signals/today répond 200 OK');
  
  const weather = signalsData.data?.weather;
  assert(weather !== undefined && weather !== null, 'Signal Météo dynamique présent');
  if (weather) {
    console.log(`   ☀️ Météo Austin : ${weather.temperature}°C, ${weather.description || weather.condition}`);
  }

  const event = signalsData.data?.event;
  assert(Boolean(event), 'Signal Événement dynamique présent');
  if (event) {
    console.log(`   🎟️ Événement détecté : "${event.title}" (${event.venue || event.distance})`);
  }

  // 5. Test du moteur d'opportunités IA
  console.log('\n--- 4. MOTEUR D\'OPPORTUNITÉS IA & GÉNÉRATION DE CAMPAGNES ---');
  const oppRes = await fetch(`${baseUrl}/api/opportunities?restaurantId=${restaurantId}`);
  const oppData = await oppRes.json();
  assert(oppRes.status === 200 && oppData.success, 'Route /api/opportunities répond 200 OK');
  const opportunities = oppData.data || [];
  assert(opportunities.length > 0, `Opportunités générées par l'IA : ${opportunities.length}`);
  
  if (opportunities.length > 0) {
    const opp = opportunities[0];
    console.log(`   💡 Opportunité 1 : "${opp.title}" (Score: ${opp.score || 85})`);

    // 6. Génération de publication pour l'opportunité
    console.log('\n--- 5. GÉNÉRATION DE CONTENU MULTI-RÉSEAUX ---');
    const genRes = await fetch(`${baseUrl}/api/opportunities/${opp.id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId,
        platform: 'instagram',
      }),
    });
    const genData = await genRes.json();
    const post = genData.data?.post || genData.data;
    assert(genRes.status === 201 && genData.success && Boolean(post?.id), 'Publication générée avec succès');
    if (post) {
      console.log(`   📝 Contenu généré (Instagram) :\n   "${(post.text || post.content)?.slice(0, 100)}..."`);
      
      // 7. Approbation du post
      console.log('\n--- 6. APPROBATION DE PUBLICATION ---');
      const approveRes = await fetch(`${baseUrl}/api/posts/${post.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      });
      const approveData = await approveRes.json();
      assert(approveRes.status === 200 && approveData.success, 'Publication approuvée (Statut: scheduled/published)');
    }
  }

  // 8. Test de l'Emergency Pause
  console.log('\n--- 7. EMERGENCY PAUSE (CONTRÔLE DE SÉCURITÉ) ---');
  const pauseRes = await fetch(`${baseUrl}/api/restaurants/pause`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId,
      isPaused: true,
    }),
  });
  const pauseData = await pauseRes.json();
  assert(pauseRes.status === 200 && pauseData.success, 'Emergency pause activée avec succès');
  assert(pauseData.data?.isPaused === true, 'Statut du restaurant passé à "isPaused: true"');

  // Reprise normale
  const unpauseRes = await fetch(`${baseUrl}/api/restaurants/pause`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId,
      isPaused: false,
    }),
  });
  const unpauseData = await unpauseRes.json();
  assert(unpauseRes.status === 200 && unpauseData.success, 'Emergency pause désactivée (reprise normale, isPaused: false)');

  // 9. Test Analytics Zernio
  console.log('\n--- 8. ANALYTICS & MÉTRIQUES RÉSEAUX SOCIAUX ---');
  const analyticsRes = await fetch(`${baseUrl}/api/analytics?restaurantId=${restaurantId}`);
  const analyticsData = await analyticsRes.json();
  assert(analyticsRes.status === 200 && analyticsData.success, 'Route /api/analytics répond 200 OK');
  console.log(`   📊 Impressions : ${analyticsData.data?.totalImpressions || 0}, Clics : ${analyticsData.data?.totalClicks || 0}`);

  // 10. Test Multi-tenant Isolation
  console.log('\n--- 9. ISOLATION MULTI-TENANT ---');
  const otherEmail = `pilot_other_${Date.now()}@parisbistrot.fr`;
  const otherUserRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: otherEmail,
      password: 'SecurePassword456!',
      name: 'Pierre Bistrot',
    }),
  });
  const otherUserData = await otherUserRes.json();
  const otherUserId = otherUserData.data?.id || otherUserData.data?.user?.id;

  const otherRestRes = await fetch(`${baseUrl}/api/restaurants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Le Bistrot Parisien',
      type: 'Bistrot Français',
      address: '15 Rue de Rivoli, 75001 Paris',
      latitude: 48.8566,
      longitude: 2.3522,
      country: 'FR',
      userId: otherUserId,
    }),
  });
  const otherRestData = await otherRestRes.json();
  const otherRestId = otherRestData.data?.id;

  // Vérifier que l'utilisateur 1 ne voit pas les données de l'utilisateur 2
  const listRest1 = await fetch(`${baseUrl}/api/restaurants?userId=${userId}`);
  const listData1 = await listRest1.json();
  const ownsOnlyHis = listData1.data?.every((r: any) => r.userId === userId);
  const doesNotContainOther = !listData1.data?.some((r: any) => r.id === otherRestId);
  assert(ownsOnlyHis && doesNotContainOther, 'Isolation stricte : les restaurants de l\'utilisateur B ne sont pas visibles pour l\'utilisateur A');

  console.log(`\n========================================`);
  console.log(`RÉSULTAT TOTAL : ${passed} PASS / ${failed} FAIL`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error during E2E test:', err);
  process.exit(1);
});
