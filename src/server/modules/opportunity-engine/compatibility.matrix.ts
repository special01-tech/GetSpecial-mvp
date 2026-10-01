export interface CompatibilityRule {
  signalType: string;
  subType?: string;
  restaurantType: string;
  baseCompatibility: number; // 0.0 to 1.0
  bonusCondition?: (profile: any) => number;
}

export const COMPATIBILITY_RULES: CompatibilityRule[] = [
  // 1. Sport
  {
    signalType: 'event',
    subType: 'sports',
    restaurantType: 'bar',
    baseCompatibility: 0.95,
  },
  {
    signalType: 'event',
    subType: 'sports',
    restaurantType: 'restaurant',
    baseCompatibility: 0.7,
    bonusCondition: (p) => (p?.customRules?.hasScreens ? 0.25 : 0),
  },
  {
    signalType: 'event',
    subType: 'sports',
    restaurantType: 'fine_dining',
    baseCompatibility: 0.15,
  },
  {
    signalType: 'event',
    subType: 'sports',
    restaurantType: 'café',
    baseCompatibility: 0.4,
  },

  // 2. Météo Pluie
  {
    signalType: 'weather',
    subType: 'rain',
    restaurantType: 'fast-food',
    baseCompatibility: 0.9,
    bonusCondition: (p) => (p?.customRules?.hasDelivery ? 0.1 : 0),
  },
  {
    signalType: 'weather',
    subType: 'rain',
    restaurantType: 'restaurant',
    baseCompatibility: 0.8,
    bonusCondition: (p) => (p?.customRules?.hasDelivery ? 0.15 : -0.1),
  },
  {
    signalType: 'weather',
    subType: 'rain',
    restaurantType: 'bar',
    baseCompatibility: 0.75, // Soirée réconfortante à l'abri
  },

  // 3. Météo Soleil / Terrasse
  {
    signalType: 'weather',
    subType: 'sun',
    restaurantType: 'bar',
    baseCompatibility: 0.9,
    bonusCondition: (p) => (p?.hasTerrace ? 0.1 : -0.3),
  },
  {
    signalType: 'weather',
    subType: 'sun',
    restaurantType: 'restaurant',
    baseCompatibility: 0.85,
    bonusCondition: (p) => (p?.hasTerrace ? 0.15 : -0.2),
  },
  {
    signalType: 'weather',
    subType: 'sun',
    restaurantType: 'café',
    baseCompatibility: 0.9,
    bonusCondition: (p) => (p?.hasTerrace ? 0.1 : -0.2),
  },

  // 4. Concerts & Festivals
  {
    signalType: 'event',
    subType: 'concert',
    restaurantType: 'bar',
    baseCompatibility: 0.9,
  },
  {
    signalType: 'event',
    subType: 'concert',
    restaurantType: 'restaurant',
    baseCompatibility: 0.85,
  },
  {
    signalType: 'event',
    subType: 'concert',
    restaurantType: 'fast-food',
    baseCompatibility: 0.8,
  },

  // 5. Jours fériés
  {
    signalType: 'holiday',
    restaurantType: 'all',
    baseCompatibility: 0.85,
  },

  // 6. Offres promotionnelles
  {
    signalType: 'offer',
    restaurantType: 'all',
    baseCompatibility: 0.9,
  },
];

export function getCompatibilityScore(
  signalType: string,
  subType: string | undefined,
  restaurantType: string,
  restaurantProfile: any
): number {
  const normRestType = (restaurantType || 'restaurant').toLowerCase();
  const normSigType = (signalType || '').toLowerCase();
  const normSub = (subType || '').toLowerCase();

  const rule = COMPATIBILITY_RULES.find((r) => {
    const matchSig = r.signalType === normSigType;
    const matchSub = !r.subType || r.subType === normSub;
    const matchRest = r.restaurantType === 'all' || normRestType.includes(r.restaurantType);
    return matchSig && matchSub && matchRest;
  });

  if (!rule) {
    return 0.6; // Compatibilité par défaut raisonnable
  }

  let score = rule.baseCompatibility;
  if (rule.bonusCondition) {
    score += rule.bonusCondition(restaurantProfile);
  }

  return Math.min(1.0, Math.max(0.0, score));
}
