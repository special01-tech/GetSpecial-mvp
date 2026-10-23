import assert from 'node:assert/strict';
import { calculateOfferEconomics, calculateImpactMetrics } from '../../../src/server/modules/offer-economics/domain.js';
import { calculateCounterMetrics, canCancelRedemption } from '../../../src/server/modules/counter/domain.js';
import { calculateServiceSlot, isSlotOffPeak } from '../../../src/server/modules/service-calendar/domain.js';
import { calculateMedian, calculateBaselineCovers } from '../../../src/server/modules/closing/domain.js';
import { evaluateMorningSummary } from '../../../src/server/modules/morning-summary/domain.js';
import { hashPin, verifyPin, evaluatePinRateLimit } from '../../../src/server/modules/auth-pin/domain.js';

async function runTests() {
  console.log('--- TEST RUNNER: DOMAIN BRICKS ---');

  // Test 1: Offer-Economics Reference Values
  console.log('1. Test Offer-Economics remise...');
  const eco = calculateOfferEconomics({
    dishPrice: 25,
    foodCostPct: 0.30,
    discountPct: 0.20,
    baselineCovers: 12,
    capacityCovers: 40,
  });
  assert.equal(eco.isValid, true);
  assert.equal(eco.marginPerDish, 17.5);
  assert.equal(eco.costPerUser, 5);
  assert.equal(eco.breakEvenCovers, 4.8);
  assert.equal(eco.maxRisk, -60);
  assert.equal(eco.targetCovers, 7);

  // Test 2: Gain positif : effet estimé = 8 (20 couverts réels - 12 habituels), 20 personnes ayant profité de l'offre
  // Gain = 8 * 17.5 - 20 * 5 = 140 - 100 = +40
  console.log('2. Test Gain positif...');
  const impactPos = calculateImpactMetrics({
    actualCovers: 20,
    baselineB: 12,
    totalOfferPersons: 20,
    marginPerDish: 17.5,
    costPerUser: 5,
  });
  assert.equal(impactPos.estimatedEffect, 8);
  assert.equal(impactPos.cannibalisation, 12);
  assert.equal(impactPos.estimatedGain, 40);

  // Test 3: Gain négatif : effet = 3 (15 couverts - 12 habituels), 15 personnes ayant profité
  // Gain = 3 * 17.5 - 15 * 5 = 52.5 - 75 = -22.5
  console.log('3. Test Gain négatif...');
  const impactNeg = calculateImpactMetrics({
    actualCovers: 15,
    baselineB: 12,
    totalOfferPersons: 15,
    marginPerDish: 17.5,
    costPerUser: 5,
  });
  assert.equal(impactNeg.estimatedEffect, 3);
  assert.equal(impactNeg.cannibalisation, 12);
  assert.equal(impactNeg.estimatedGain, -22.5);

  // Test 4: Article offert : C=1.5, B=12 => N* = 1.125
  // Note: N* = (B * C) / (m - C) = (12 * 1.5) / (17.5 - 1.5) = 18 / 16 = 1.125 !
  console.log('4. Test Article offert...');
  const ecoFree = calculateOfferEconomics({
    dishPrice: 25,
    foodCostPct: 0.30, // m = 17.5
    freeItemCost: 1.5,
    baselineCovers: 12,
    capacityCovers: 40,
  });
  assert.equal(ecoFree.isValid, true);
  assert.equal(ecoFree.marginPerDish, 17.5);
  assert.equal(ecoFree.costPerUser, 1.5);
  assert.equal(ecoFree.breakEvenCovers, 1.125);
  assert.equal(ecoFree.maxRisk, -18);

  // Test 4b: Effet 5 et 7 personnes => gain = 5 * 17.5 - 7 * 1.5 = 87.5 - 10.5 = 77
  const impactFree = calculateImpactMetrics({
    actualCovers: 17,
    baselineB: 12,
    totalOfferPersons: 7,
    marginPerDish: 17.5,
    costPerUser: 1.5,
  });
  assert.equal(impactFree.estimatedEffect, 5);
  assert.equal(impactFree.estimatedGain, 77);

  // Test 5: Rejets
  console.log('5. Test Rejets...');
  const ecoInvalid = calculateOfferEconomics({
    dishPrice: 10,
    foodCostPct: 0.30, // m = 7
    discountPct: 0.80, // C = 8 >= m
    baselineCovers: 10,
    capacityCovers: 30,
  });
  assert.equal(ecoInvalid.isValid, false);

  const ecoNoCap = calculateOfferEconomics({
    dishPrice: 20,
    foodCostPct: 0.30,
    discountPct: 0.20,
    baselineCovers: 30,
    capacityCovers: 30, // capacity <= baseline
  });
  assert.equal(ecoNoCap.isValid, false);
  assert.equal(ecoNoCap.targetCovers, 0);

  // Test 6: Counter metrics & anti double-compte
  console.log('6. Test Counter...');
  const counterMetrics = calculateCounterMetrics([
    { id: '1', offerId: 'o1', status: 'confirmed', partySize: 2, createdAt: new Date() },
    { id: '2', offerId: 'o1', status: 'claimed', partySize: 4, createdAt: new Date() },
    { id: '3', offerId: 'o1', status: 'confirmed', partySize: 1, createdAt: new Date() },
    { id: '4', offerId: 'o1', status: 'cancelled', partySize: 3, createdAt: new Date() }, // ignoré
  ]);
  assert.equal(counterMetrics.totalUses, 3);
  assert.equal(counterMetrics.totalPersons, 7); // 2 + 4 + 1
  assert.equal(counterMetrics.claimedCount, 1);
  assert.equal(counterMetrics.confirmedCount, 2);

  // Test 7: Cancellation window
  console.log('7. Test Cancel window...');
  const now = new Date('2026-10-12T12:01:30Z');
  assert.equal(canCancelRedemption(new Date('2026-10-12T12:00:00Z'), now), true);
  assert.equal(canCancelRedemption(new Date('2026-10-12T11:59:00Z'), now), false);

  // Test 8: Calendar rollover
  console.log('8. Test Calendar rollover...');
  // 00:30 UTC = 02:30 heure locale Paris (UTC+2)
  const earlyMorning = new Date('2026-10-12T00:30:00Z');
  const slot = calculateServiceSlot(earlyMorning, 'Europe/Paris');
  assert.equal(slot.service, 'soir');
  assert.equal(slot.serviceDateStr, '2026-10-11');

  // Test 9: Closing baseline & median
  console.log('9. Test Closing...');
  const baseRepli = calculateBaselineCovers({ closingsWithoutOffer: [10, 12, 14], declaredBaseline: 15 });
  assert.equal(baseRepli.baselineB, 15);
  assert.equal(baseRepli.source, 'déclaré');

  const baseMesure = calculateBaselineCovers({ closingsWithoutOffer: [10, 12, 14, 16], declaredBaseline: 15 });
  assert.equal(baseMesure.baselineB, 13); // mediane de 10,12,14,16 = 13
  assert.equal(baseMesure.source, 'mesuré');

  // Test 10: Morning summary
  console.log('10. Test Morning summary...');
  const keep = evaluateMorningSummary({ targetCovers: 10, actualPersons: 11, estimatedGain: 50, hasEnoughDataForGain: true });
  assert.equal(keep.recommendation, 'garder');

  const adjust = evaluateMorningSummary({ targetCovers: 10, actualPersons: 5, estimatedGain: -5, hasEnoughDataForGain: true });
  assert.equal(adjust.recommendation, 'ajuster');

  const drop = evaluateMorningSummary({ targetCovers: 10, actualPersons: 2, estimatedGain: -30, hasEnoughDataForGain: true });
  assert.equal(drop.recommendation, 'laisser');

  // Test 11: Auth PIN & rate limit
  console.log('11. Test Auth PIN...');
  const hashed = await hashPin('123456');
  assert.equal(await verifyPin('123456', hashed), true);
  assert.equal(await verifyPin('999999', hashed), false);

  const rateAllowed = evaluatePinRateLimit(4, null);
  assert.equal(rateAllowed.isBlocked, false);

  const rateLocked = evaluatePinRateLimit(5, new Date());
  assert.equal(rateLocked.isBlocked, true);

  console.log('✅ ALL DOMAIN BRICKS TESTS PASSED SUCCESSFULLY WITH EXACT VALUES!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
