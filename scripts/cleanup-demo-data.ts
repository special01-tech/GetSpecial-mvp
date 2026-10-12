import { prisma } from '../src/server/db/prisma.client.js';

/**
 * Script de nettoyage des données de démo éventuelles.
 * PAR DÉFAUT : LISTE uniquement (mode sécurisé).
 * Pour supprimer réellement : passer le drapeau --confirm.
 */
async function main() {
  const isConfirm = process.argv.includes('--confirm');

  console.log('=== SCRIPTS / CLEANUP-DEMO-DATA ===');
  console.log(`Mode : ${isConfirm ? 'SUPPRESSION EFFECTIVE (--confirm)' : 'LECTURE SEULE (Listing)'}\n`);

  // 1. Détection des restaurants de démo
  const demoRestaurants = await (prisma.restaurant as any).findMany({
    where: {
      OR: [
        { id: { in: ['demo', 'rest_demo'] } },
        { slug: 'demo' },
        { name: { contains: 'demo', mode: 'insensitive' } },
      ],
    },
  });

  console.log(`[Restaurants] Détectés : ${demoRestaurants.length}`);
  demoRestaurants.forEach((r: any) => {
    console.log(` - ID: ${r.id} | Nom: ${r.name} | Slug: ${r.slug}`);
  });

  // 2. Détection des offres de démo
  const demoOffers = await (prisma.offer as any).findMany({
    where: {
      OR: [
        { restaurantId: { in: ['demo', 'rest_demo'] } },
        { title: { contains: 'demo', mode: 'insensitive' } },
      ],
    },
  });

  console.log(`\n[Offres] Détectées : ${demoOffers.length}`);
  demoOffers.forEach((o: any) => {
    console.log(` - ID: ${o.id} | Titre: ${o.title} | Restaurant: ${o.restaurantId}`);
  });

  if (!isConfirm) {
    console.log('\n🔒 AUCUNE DONNÉE N\'A ÉTÉ SUPPRIMÉE.');
    console.log('Pour exécuter la suppression effective, lancez :');
    console.log('  node --import tsx scripts/cleanup-demo-data.ts --confirm\n');
    return;
  }

  // Si --confirm est explicitement passé
  console.log('\n⚠️ Exécution de la suppression...');
  if (demoOffers.length > 0) {
    const deletedOffers = await (prisma.offer as any).deleteMany({
      where: { id: { in: demoOffers.map((o: any) => o.id) } },
    });
    console.log(`✓ ${deletedOffers.count} offre(s) supprimée(s).`);
  }

  if (demoRestaurants.length > 0) {
    const deletedRests = await (prisma.restaurant as any).deleteMany({
      where: { id: { in: demoRestaurants.map((r: any) => r.id) } },
    });
    console.log(`✓ ${deletedRests.count} restaurant(s) supprimé(s).`);
  }

  console.log('Nettoyage terminé avec succès.');
}

main().catch((err) => {
  console.error('Erreur lors du nettoyage :', err);
  process.exit(1);
});
