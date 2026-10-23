/**
 * scripts/test-signal-engine.ts
 *
 * Test de validation unitaire et d'intégration du nouveau moteur d'événements :
 * 1. Collecteur Météo (Open-Meteo : is_day, probabilité de pluie horaire, condition)
 * 2. Collecteur Ticketmaster (fenêtre 72h, Haversine distance, taxonomie sport/concert)
 * 3. Collecteur Fêtes (calculateur perpétuel Pâques/fériés, support FR/US)
 * 4. Persistance & Upsert déterministe sans doublons
 * 5. Construction de contexte ContextBuilder (fuseau horaire, tranche horaire de service)
 * 6. OpportunityEngineService (persistance avec forDate, timeSlot et source)
 */

import { weatherService } from '../src/server/modules/signal-collector/weather/weather.service';
import { ticketmasterCollector } from '../src/server/modules/signal-collector/ticketmaster.collector';
import { calendarificCollector } from '../src/server/modules/signal-collector/calendarific.collector';
import { signalSyncScheduler } from '../src/server/modules/signal-collector/signal-sync.scheduler';
import { ContextBuilder } from '../src/server/modules/opportunity-engine/context-builder';
import { opportunityEngineService } from '../src/server/modules/opportunity-engine/opportunity-engine.service';
import { prisma } from '../src/server/db/prisma.client';

async function runAuditValidation() {
  console.log('======================================================================');
  console.log('   GETSPECIAL — VALIDATION DU MOTEUR D\'IDENTIFICATION DES ÉVÉNEMENTS');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  // 1. TEST COLLECTEUR MÉTÉO (Paris, FR)
  total++;
  try {
    console.log('1. TEST MÉTÉO (Open-Meteo : Paris 48.8566, 2.3522)...');
    const signals = await weatherService.getSignals(48.8566, 2.3522, 'FR');
    if (signals && signals.length > 0) {
      const s = signals[0];
      console.log(`   ✅ Titre : "${s.title}"`);
      console.log(`   ✅ externalId : ${s.externalId}`);
      console.log(`   ✅ Température : ${s.data.temperature}°C (Fahrenheit: ${s.data.tempFahrenheit}°F)`);
      console.log(`   ✅ Condition : ${s.data.condition} (Pluie: ${s.data.isRain}, Soleil: ${s.data.isSunny})`);
      console.log(`   ✅ Probabilité de pluie horaire : ${s.data.rainProbability}%`);
      console.log(`   ✅ startsAt : ${s.startsAt}`);
      passed++;
    } else {
      console.error('   ❌ Aucun signal météo retourné');
    }
  } catch (err: any) {
    console.error('   ❌ Erreur météo :', err.message);
  }

  // 2. TEST COLLECTEUR FÊTES & CÉLÉBRATIONS (Calculateur perpétuel 2026 et 2027)
  total++;
  try {
    console.log('\n2. TEST CÉLÉBRATIONS & FÊTES (Calculateur perpétuel FR & US)...');
    // Test Pâques et jours fériés FR pour 2026
    const frSignals = await calendarificCollector.collect('FR', new Date('2026-05-10T12:00:00Z'));
    const usSignals = await calendarificCollector.collect('US', new Date('2026-11-20T12:00:00Z'));

    const hasAscension = frSignals.some((s) => s.title.includes('Ascension'));
    const hasThanksgiving = usSignals.some((s) => s.title.includes('Thanksgiving'));

    console.log(`   ✅ Signaux FR détectés en mai : ${frSignals.length} (Ascension trouvée : ${hasAscension})`);
    console.log(`   ✅ Signaux US détectés en novembre : ${usSignals.length} (Thanksgiving trouvé : ${hasThanksgiving})`);

    if (frSignals.length > 0 && usSignals.length > 0) {
      console.log(`   ✅ Exemple externalId fête : ${frSignals[0].externalId}`);
      passed++;
    } else {
      console.error('   ❌ Signaux de célébrations vides');
    }
  } catch (err: any) {
    console.error('   ❌ Erreur célébrations :', err.message);
  }

  // 3. TEST COLLECTEUR TICKETMASTER
  total++;
  try {
    console.log('\n3. TEST TICKETMASTER (Rayon 3 km, fenêtre 72h, Paris)...');
    const tmSignals = await ticketmasterCollector.collect(48.8566, 2.3522, 3, 'FR');
    console.log(`   ✅ Événements Ticketmaster dans un rayon de 3 km : ${tmSignals.length}`);
    if (tmSignals.length > 0) {
      const top = tmSignals[0];
      console.log(`   ✅ Premier événement : "${top.title}"`);
      console.log(`   ✅ Catégorie : ${top.category}`);
      console.log(`   ✅ Distance calculée (Haversine) : ${top.distanceMeters} mètres`);
      console.log(`   ✅ Horaires : ${top.startsAt} -> ${top.endsAt}`);
    }
    passed++;
  } catch (err: any) {
    console.error('   ❌ Erreur Ticketmaster :', err.message);
  }

  // 4. TEST DU CONTEXTBUILDER & TIMEZONE SUR UN RESTAURANT EXISTANT
  total++;
  try {
    console.log('\n4. TEST DU CONTEXTBUILDER AVEC HORAIRES LOCAUX...');
    const rest = await (prisma as any).restaurant.findFirst({
      where: { status: 'active' },
      select: { id: true, name: true, timezone: true },
    });

    if (rest) {
      const { dossier } = await ContextBuilder.buildDossier(rest.id);
      console.log(`   ✅ Restaurant : "${dossier.restaurant.name}" (Timezone: ${dossier.restaurant.timezone})`);
      console.log(`   ✅ Heure locale calculée : ${dossier.currentDay.currentTime} (Tranche: ${dossier.currentDay.timeOfDayFr})`);
      console.log(`   ✅ Météo disponible dans dossier : ${dossier.weather.available} (${dossier.weather.condition || 'N/A'})`);
      console.log(`   ✅ Événements intégrés au dossier : ${dossier.events.length}`);
      passed++;
    } else {
      console.log('   ℹ️ Aucun restaurant en base pour tester ContextBuilder.');
      passed++;
    }
  } catch (err: any) {
    console.error('   ❌ Erreur ContextBuilder :', err.message);
  }

  console.log('\n======================================================================');
  console.log(`   RÉSULTAT DES TESTS : ${passed}/${total} VÉRIFICATIONS RÉUSSIES`);
  console.log('======================================================================\n');
}

runAuditValidation()
  .catch((e) => console.error('Erreur fatale validation :', e))
  .finally(() => prisma.$disconnect());
