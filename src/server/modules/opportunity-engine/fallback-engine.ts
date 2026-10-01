import { OpportunityCandidate } from './types';

export class FallbackEngine {
  /**
   * Chaîne de secours déterministe ordonnée sans invention
   */
  static getFallbackCandidate(restaurant: any, activeOffers: any[]): OpportunityCandidate | null {
    // 1. Offre existante non promue
    if (activeOffers.length > 0) {
      const targetOffer = activeOffers[0];
      return {
        id: `fallback_offer_${targetOffer.id}`,
        type: 'offer',
        offerId: targetOffer.id,
        suggestedTitle: `Mettre en avant : ${targetOffer.title}`,
        suggestedAngle: 'special_promotion',
        urgency: 'low',
        rawScore: 0.7,
        facts: [
          `Offre en cours : ${targetOffer.title}`,
          `Description : ${targetOffer.description}`,
          targetOffer.discountValue ? `Avantage : ${targetOffer.discountValue}` : 'Offre maison',
        ],
      };
    }

    // 2. Offre récurrente ou spécialité du restaurant
    const specialties = restaurant.specialties || [];
    if (specialties.length > 0) {
      const spec = specialties[0];
      return {
        id: `fallback_specialty_${Date.now()}`,
        type: 'quiet_period',
        suggestedTitle: `Inspiration du chef : Nos ${spec}`,
        suggestedAngle: 'culinary_craft',
        urgency: 'low',
        rawScore: 0.65,
        facts: [
          `Spécialité réputée de l'établissement : ${spec}`,
          `Adresse : ${restaurant.address}`,
          'Moment opportun pour valoriser votre savoir-faire',
        ],
      };
    }

    // 3. Rien à inventer
    return null;
  }
}
