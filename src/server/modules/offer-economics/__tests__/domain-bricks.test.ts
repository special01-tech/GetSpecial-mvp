import { describe, it, expect } from 'vitest';
import { calculateOfferEconomics, calculateImpactMetrics } from '@/server/modules/offer-economics/domain';
import { calculateCounterMetrics, canCancelRedemption } from '@/server/modules/counter/domain';
import { calculateServiceSlot, isSlotOffPeak } from '@/server/modules/service-calendar/domain';
import { calculateMedian, calculateBaselineCovers } from '@/server/modules/closing/domain';
import { evaluateMorningSummary } from '@/server/modules/morning-summary/domain';
import { hashPin, verifyPin, evaluatePinRateLimit } from '@/server/modules/auth-pin/domain';

describe('Brique Offer-Economics — Valeurs de référence imposées', () => {
  it('Remise : P=25, foodCost=0.30 (m=17.5), d=20% (C=5), B=12 => N*=4.8', () => {
    const eco = calculateOfferEconomics({
      dishPrice: 25,
      foodCostPct: 0.30,
      discountPct: 0.20,
      baselineCovers: 12,
      capacityCovers: 40,
    });

    expect(eco.isValid).toBe(true);
    expect(eco.marginPerDish).toBe(17.5);
    expect(eco.costPerUser).toBe(5);
    expect(eco.breakEvenCovers).toBe(4.8);
    expect(eco.maxRisk).toBe(-60);
    expect(eco.targetCovers).toBe(7); // 25% de (40 - 12) = 7
  });

  it('Remise : Gain avec 8 nouveaux et 20 personnes => +40', () => {
    const impact = calculateImpactMetrics({
      actualCovers: 20, // 12 habituels + 8 nouveaux
      baselineB: 12,
      totalOfferPersons: 20,
      marginPerDish: 17.5,
      costPerUser: 5,
    });

    expect(impact.estimatedEffect).toBe(8);
    expect(impact.cannibalisation).toBe(12);
    expect(impact.estimatedGain).toBe(40); // 8 * 17.5 - 20 * 5 = 140 - 100 = 40
  });

  it('Remise : Gain avec 3 nouveaux et 15 personnes => -22.5', () => {
    const impact = calculateImpactMetrics({
      actualCovers: 15,
      baselineB: 12,
      totalOfferPersons: 15,
      marginPerDish: 17.5,
      costPerUser: 5,
    });

    expect(impact.estimatedEffect).toBe(3);
    expect(impact.cannibalisation).toBe(12);
    expect(impact.estimatedGain).toBe(-22.5); // 3 * 17.5 - 15 * 5 = 52.5 - 75 = -22.5
  });

  it('Article offert : C=1.5, B=12 => N*=1.125 ; effet 5 et 7 personnes => gain=+77', () => {
    const eco = calculateOfferEconomics({
      dishPrice: 25,
      foodCostPct: 0.30,
      freeItemCost: 1.5,
      baselineCovers: 12,
      capacityCovers: 40,
    });

    expect(eco.isValid).toBe(true);
    // m = 17.5, C = 1.5 => N* = 12 * 1.5 / (17.5 - 1.5) = 18 / 16 = 1.125
    expect(eco.breakEvenCovers).toBe(1.125);

    // Effet 5 (couverts réels = 17) et 7 personnes
    const impact = calculateImpactMetrics({
      actualCovers: 17,
      baselineB: 12,
      totalOfferPersons: 7,
      marginPerDish: 17.5,
      costPerUser: 1.5,
    });

    expect(impact.estimatedEffect).toBe(5);
    // 5 * 17.5 - 7 * 1.5 = 87.5 - 10.5 = 77
    expect(impact.estimatedGain).toBe(77);
  });

  it('Capacité <= Baseline => aucune proposition (salle déjà pleine)', () => {
    const eco = calculateOfferEconomics({
      dishPrice: 25,
      foodCostPct: 0.30,
      discountPct: 0.10,
      baselineCovers: 40,
      capacityCovers: 40,
    });

    expect(eco.isValid).toBe(false);
    expect(eco.targetCovers).toBe(0);
  });

  it('Interdiction C >= m (coût supérieur à la marge)', () => {
    const eco = calculateOfferEconomics({
      dishPrice: 20,
      foodCostPct: 0.60, // m = 8
      freeItemCost: 8,   // C = 8 >= m
      baselineCovers: 10,
      capacityCovers: 30,
    });

    expect(eco.isValid).toBe(false);
  });
});

describe('Brique Counter — Comptage, dédoublonnage et annulation', () => {
  it('Somme des personnes (groupes 2 + 4 + 1 = 7) et pas de double compte claimed/confirmed', () => {
    const metrics = calculateCounterMetrics([
      { id: '1', offerId: 'o1', status: 'confirmed', partySize: 2, createdAt: new Date() },
      { id: '2', offerId: 'o1', status: 'claimed', partySize: 4, createdAt: new Date() },
      { id: '3', offerId: 'o1', status: 'confirmed', partySize: 1, createdAt: new Date() },
      { id: '4', offerId: 'o1', status: 'cancelled', partySize: 3, createdAt: new Date() }, // Doit être exclu
    ]);

    expect(metrics.totalUses).toBe(3);
    expect(metrics.totalPersons).toBe(7);
    expect(metrics.confirmedCount).toBe(2);
    expect(metrics.claimedCount).toBe(1);
  });

  it('Annulation possible sous 2 minutes uniquement', () => {
    const now = new Date();
    const created1MinAgo = new Date(now.getTime() - 60 * 1000);
    const created3MinAgo = new Date(now.getTime() - 180 * 1000);

    expect(canCancelRedemption(created1MinAgo, now)).toBe(true);
    expect(canCancelRedemption(created3MinAgo, now)).toBe(false);
  });
});

describe('Brique Service-Calendar — Fuseau et bascule 4h / 16h', () => {
  it('Avant 4h du matin, reste sur la date de la veille et service du soir', () => {
    // 2026-10-13 02:30:00 UTC
    const dateAt2am = new Date('2026-10-13T02:30:00Z');
    const slot = calculateServiceSlot(dateAt2am, 'UTC');

    expect(slot.serviceDateStr).toBe('2026-10-12');
    expect(slot.service).toBe('soir');
  });

  it('À 12h, service du midi', () => {
    const dateAtNoon = new Date('2026-10-12T12:00:00Z');
    const slot = calculateServiceSlot(dateAtNoon, 'UTC');

    expect(slot.serviceDateStr).toBe('2026-10-12');
    expect(slot.service).toBe('midi');
  });

  it('À 18h, service du soir', () => {
    const dateAt6pm = new Date('2026-10-12T18:00:00Z');
    const slot = calculateServiceSlot(dateAt6pm, 'UTC');

    expect(slot.serviceDateStr).toBe('2026-10-12');
    expect(slot.service).toBe('soir');
  });
});

describe('Brique Closing — Médiane et repli sur le déclaré', () => {
  it('Moins de 4 clôtures => repli sur la baseline déclarée', () => {
    const res = calculateBaselineCovers({
      closingsWithoutOffer: [14, 18],
      declaredBaseline: 12,
    });

    expect(res.source).toBe('déclaré');
    expect(res.baselineB).toBe(12);
  });

  it('Au moins 4 clôtures => calcul de la médiane des 8 dernières', () => {
    const res = calculateBaselineCovers({
      closingsWithoutOffer: [10, 12, 14, 16, 18, 20],
      declaredBaseline: 25,
    });

    expect(res.source).toBe('mesuré');
    expect(res.baselineB).toBe(15); // Médiane de [10, 12, 14, 16, 18, 20] = (14 + 16)/2 = 15
  });
});

describe('Brique Morning-Summary — Règle de décision', () => {
  it('Atteinte >= 100% et gain positif => Garder', () => {
    const res = evaluateMorningSummary({
      targetCovers: 10,
      actualPersons: 12,
      estimatedGain: 50,
      hasEnoughDataForGain: true,
    });

    expect(res.recommendation).toBe('garder');
  });

  it('Atteinte 30% à 99% => Ajuster', () => {
    const res = evaluateMorningSummary({
      targetCovers: 10,
      actualPersons: 5,
      hasEnoughDataForGain: false,
    });

    expect(res.recommendation).toBe('ajuster');
  });

  it('Atteinte < 30% => Laisser', () => {
    const res = evaluateMorningSummary({
      targetCovers: 10,
      actualPersons: 2,
      hasEnoughDataForGain: false,
    });

    expect(res.recommendation).toBe('laisser');
  });
});

describe('Brique Auth-PIN — Scrypt et limitation rate-limit', () => {
  it('Hachage scrypt et vérification sécurisée', () => {
    const hash = hashPin('1234');
    expect(verifyPin('1234', hash)).toBe(true);
    expect(verifyPin('0000', hash)).toBe(false);
  });

  it('5 erreurs consécutives bloquent pendant 5 minutes', () => {
    const now = new Date();
    const blocked = evaluatePinRateLimit(5, now, now);
    expect(blocked.isBlocked).toBe(true);
    expect(blocked.minutesRemaining).toBe(5);

    const sixMinutesLater = new Date(now.getTime() + 6 * 60 * 1000);
    const unblocked = evaluatePinRateLimit(5, now, sixMinutesLater);
    expect(unblocked.isBlocked).toBe(false);
  });
});
