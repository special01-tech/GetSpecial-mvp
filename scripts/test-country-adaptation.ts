import { weatherCollector } from '../src/server/modules/signal-collector/weather.collector';
import { ticketmasterCollector } from '../src/server/modules/signal-collector/ticketmaster.collector';
import { calendarificCollector } from '../src/server/modules/signal-collector/calendarific.collector';

async function testCountryAdaptation() {
  console.log('========================================================================');
  console.log('🌍 GETSPECIAL — COUNTRY ADAPTATION AUDIT (US vs FRANCE)');
  console.log('========================================================================\n');

  // 1. UNITED STATES (Austin, TX)
  console.log('--- 1. ÉTABLISSEMENT AMÉRICAIN (Austin, TX, US) ---');
  const usWeather = await weatherCollector.collect(30.2672, -97.7431, 'US');
  console.log('Météo US (Unité & Langue):', usWeather[0]?.title);
  console.log('Résumé Météo US:', usWeather[0]?.summary);

  const usEvents = await ticketmasterCollector.collect(30.2672, -97.7431, 15, 'US');
  console.log(`Ticketmaster US (Nb événements: ${usEvents.length}):`);
  usEvents.slice(0, 2).forEach((e) => console.log('  -', e.title, '|', e.summary));

  const usHolidays = await calendarificCollector.collect('US');
  console.log(`Calendarific US (Nb célébrations: ${usHolidays.length}):`);
  usHolidays.slice(0, 3).forEach((h) => console.log('  -', h.title, '|', h.summary));

  // 2. FRANCE (Paris, FR)
  console.log('\n--- 2. ÉTABLISSEMENT FRANÇAIS (Paris, FR) ---');
  const frWeather = await weatherCollector.collect(48.8566, 2.3522, 'FR');
  console.log('Météo FR (Unité & Langue):', frWeather[0]?.title);
  console.log('Résumé Météo FR:', frWeather[0]?.summary);

  const frEvents = await ticketmasterCollector.collect(48.8566, 2.3522, 15, 'FR');
  console.log(`Ticketmaster FR (Nb événements: ${frEvents.length})`);

  const frHolidays = await calendarificCollector.collect('FR');
  console.log(`Calendarific FR (Nb célébrations: ${frHolidays.length})`);

  console.log('\n========================================================================');
  console.log('✅ AUDIT PAYS TERMINÉ SANS ERREUR');
  console.log('========================================================================');
}

testCountryAdaptation().catch(console.error);
