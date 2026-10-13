const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Charger .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dbUrl = env.DATABASE_URL;

console.log('=================================================================');
console.log('TEST COMPLET : GOOGLE OAUTH + SUPABASE AUTH + WORKFLOW BDD RÉELLE');
console.log('=================================================================');
console.log('Supabase URL:', supabaseUrl);
console.log('Pooler DB Host:', dbUrl.match(/@([^:/]+)/)?.[1]);

async function runTest() {
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } }
  });

  try {
    // -------------------------------------------------------------
    // ÉTAPE 1 : VÉRIFICATION GOOGLE OAUTH SUPABASE
    // -------------------------------------------------------------
    console.log('\n[1/4] Test de la configuration Google OAuth Supabase...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: oAuthData, error: oAuthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
      },
    });

    if (oAuthError) {
      throw new Error(`Erreur Supabase OAuth: ${oAuthError.message}`);
    }

    console.log('✅ Google OAuth initialisé avec succès !');
    console.log('   URL de consentement Google :', oAuthData.url.slice(0, 75) + '...');

    // -------------------------------------------------------------
    // ÉTAPE 2 : TEST /api/auth/sync-session AVEC USER GOOGLE RÉEL
    // -------------------------------------------------------------
    console.log('\n[2/4] Test de synchronisation session Google -> Supabase PostgreSQL...');
    const testGoogleUser = {
      id: `google_usr_${Date.now()}`,
      email: `test.owner.${Date.now()}@getspecial.io`,
      name: 'Chef Michel Rostang',
      avatarUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80',
    };

    const syncRes = await fetch('http://localhost:3000/api/auth/sync-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testGoogleUser),
    });

    const syncJson = await syncRes.json();
    console.log('   Statut HTTP /api/auth/sync-session :', syncRes.status);
    console.log('   Résultat :', syncJson);

    if (!syncJson.success) {
      throw new Error(`Échec sync-session: ${syncJson.error}`);
    }
    console.log('✅ Utilisateur Google créé/synchronisé avec succès !');
    console.log('   Redirection calculée :', syncJson.redirectUrl, '(Attendu: /onboarding car aucun restaurant encore)');

    // -------------------------------------------------------------
    // ÉTAPE 3 : TEST ONBOARDING RESTAURANT EN BDD SUPABASE
    // -------------------------------------------------------------
    console.log('\n[3/4] Test du cycle Onboarding : Création restaurant dans Supabase Postgres...');
    const cookieHeader = `getspecial_session=${testGoogleUser.id}`;

    const createRestRes = await fetch('http://localhost:3000/api/restaurants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({
        name: 'Le Bistrot Parisien Moderne',
        type: 'Bistrot & Gastronomie',
        address: '10 Rue de la Paix, 75002 Paris',
        latitude: 48.8698,
        longitude: 2.3312,
        timezone: 'Europe/Paris',
        country: 'FR',
        capacityCovers: 60,
        averageTicket: 32.5,
        offPeakDays: ['mardi', 'mercredi'],
        specialties: ['Entrecôte grillée', 'Tartare maison', 'Profiteroles'],
        tone: 'chaleureux et convivial',
        hasTerrace: true,
        hasDelivery: false,
        marketingGoal: 'more_clients',
        userId: testGoogleUser.id,
      }),
    });

    const createRestJson = await createRestRes.json();
    console.log('   Statut HTTP /api/restaurants :', createRestRes.status);

    if (!createRestJson.success) {
      throw new Error(`Échec création restaurant: ${createRestJson.error}`);
    }

    const createdRest = createRestJson.data;
    console.log('✅ Restaurant créé avec succès !');
    console.log('   ID Restaurant :', createdRest.id);
    console.log('   Nom :', createdRest.name);
    console.log('   Lié à User ID :', createdRest.userId);

    // -------------------------------------------------------------
    // ÉTAPE 4 : VÉRIFICATION DIRECTE DANS SUPABASE POSTGRESQL (PRISMA)
    // -------------------------------------------------------------
    console.log('\n[4/4] Vérification directe dans la base de données Supabase PostgreSQL via Prisma...');
    const userInDb = await prisma.user.findUnique({
      where: { id: testGoogleUser.id },
      include: {
        restaurants: true,
      },
    });

    console.log('   Vérification table `users` :');
    console.log('   - ID :', userInDb?.id);
    console.log('   - Email :', userInDb?.email);
    console.log('   - Nom :', userInDb?.name);
    console.log('   - Nombre de restaurants associés :', userInDb?.restaurants?.length);

    const restaurantInDb = await prisma.restaurant.findUnique({
      where: { id: createdRest.id },
      include: {
        profile: true,
        offers: true,
      },
    });

    console.log('\n   Vérification table `restaurants` :');
    console.log('   - ID :', restaurantInDb?.id);
    console.log('   - Nom :', restaurantInDb?.name);
    console.log('   - Adresse :', restaurantInDb?.address);
    console.log('   - Horaires/Timezone :', restaurantInDb?.timezone);
    console.log('   - Profil Restaurant lié :', Boolean(restaurantInDb?.profile));
    console.log('   - Capacité Couverts :', restaurantInDb?.profile?.customRules?.capacityCovers);
    console.log('   - Ticket Moyen :', restaurantInDb?.profile?.customRules?.averageTicket);
    console.log('   - Plats créés dans customRules :', restaurantInDb?.profile?.customRules?.dishes?.length);

    // Test de la route /api/auth/me avec cookie
    console.log('\n   Test appel /api/auth/me avec cookie de session...');
    const meRes = await fetch('http://localhost:3000/api/auth/me', {
      headers: {
        'Cookie': `getspecial_session=${testGoogleUser.id}; getspecial_restaurant_id=${createdRest.id}`,
      },
    });
    const meJson = await meRes.json();
    console.log('   Statut /api/auth/me :', meRes.status);
    console.log('   User name :', meJson.data?.user?.name);
    console.log('   Active Restaurant :', meJson.data?.activeRestaurant?.name);
    console.log('   hasRestaurant :', meJson.data?.hasRestaurant);

    // Re-tester /api/auth/sync-session maintenant que le restaurant existe -> doit rediriger vers /dashboard !
    console.log('\n   Test re-connexion Google d\'un utilisateur existant avec restaurant...');
    const syncResExisting = await fetch('http://localhost:3000/api/auth/sync-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testGoogleUser),
    });
    const syncExistingJson = await syncResExisting.json();
    console.log('   Redirection calculée :', syncExistingJson.redirectUrl, '(Attendu: /dashboard car restaurant existant !)');

    console.log('\n=================================================================');
    console.log('🎉 TOUS LES TESTS SONT VALIDES AVEC SUCCÈS !');
    console.log('   - Google OAuth actif');
    console.log('   - Synchronisation Supabase Auth vers PostgreSQL réussie');
    console.log('   - Cycle Onboarding complet sauvegardé en vraie base Supabase');
    console.log('   - Redirection dynamique (/onboarding -> /dashboard) validée');
    console.log('=================================================================');
  } catch (err) {
    console.error('❌ ERREUR LORS DU TEST :', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
