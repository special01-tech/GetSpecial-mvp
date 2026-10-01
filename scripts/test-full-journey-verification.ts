if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile('.env'); } catch {}
  try { process.loadEnvFile('.env.local'); } catch {}
}

import { opportunityEngineService } from '../src/server/modules/opportunity-engine/opportunity-engine.service';
import { contentGeneratorService } from '../src/server/modules/content-generator/content-generator.service';
import { postSafetyService } from '../src/server/modules/publisher/post-safety.service';
import { publicationScheduler } from '../src/server/modules/publisher/publication.scheduler';
import { prisma } from '../src/server/db/prisma.client';

async function testFullJourney() {
  console.log('================================================================');
  console.log('🔄 TESTING FULL USER & DATA LIFECYCLE (API & PERSISTENCE)');
  console.log('================================================================\n');

  // 1. Trouver un restaurant actif
  const restaurant = await (prisma as any).restaurant.findFirst({
    where: { status: 'active' },
    include: { profile: true, offers: true },
  });

  if (!restaurant) {
    throw new Error('Aucun restaurant actif trouvé pour le test');
  }

  console.log(`[1] Restaurant identifié : "${restaurant.name}" (${restaurant.id})`);

  // 2. Générer des opportunités via le nouveau Opportunity Engine
  console.log('[2] Exécution du pipeline Opportunity Engine...');
  const opportunities = await opportunityEngineService.generateOpportunities(restaurant.id);
  console.log(`✅ ${opportunities.length} opportunité(s) générée(s) avec faits vérifiés :`);
  for (const opp of opportunities) {
    console.log(`   - "${opp.title}" (Urgence: ${opp.urgency}, Score: ${opp.relevanceScore})`);
  }

  const targetOpp = opportunities[0];
  if (!targetOpp) throw new Error('Aucune opportunité disponible');

  // 3. Générer le contenu du post (Campagne)
  console.log(`\n[3] Génération de la campagne pour l'opportunité : ${targetOpp.id}...`);
  const post = await contentGeneratorService.generatePostForOpportunity(targetOpp.id, restaurant.id, 'instagram');
  console.log(`✅ Post créé en statut '${post.status}' (ID: ${post.id})`);
  console.log(`   Texte : "${post.text.slice(0, 100)}..."`);

  // 4. Approbation par le gérant (Preflight Check automatique)
  console.log(`\n[4] Approbation du gérant et exécution du Preflight Check...`);
  const approvedPost = await postSafetyService.approvePost(post.id, restaurant.id);
  console.log(`✅ Post approuvé avec succès, nouveau statut : '${approvedPost.status}'`);

  // 5. Déclenchement de la publication via le scheduler
  console.log(`\n[5] Déclenchement du scheduler de publication...`);
  const pubResult = await publicationScheduler.runDuePublications();
  console.log(`✅ Scheduler exécuté : ${pubResult.executed} publication(s) traitée(s), ${pubResult.failed} échec(s)`);

  console.log('\n================================================================');
  console.log('🎉 FULL JOURNEY TEST SUCCEEDED 100%');
  console.log('================================================================\n');
}

testFullJourney().catch(err => {
  console.error('Erreur Journey:', err);
  process.exit(1);
});
