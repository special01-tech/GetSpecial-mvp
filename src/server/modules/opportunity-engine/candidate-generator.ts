import { OpportunityCandidate } from './types';
import { UrgencyCalculator } from './urgency-calculator';
import { getCompatibilityScore } from './compatibility.matrix';

export class CandidateGenerator {
  /**
   * Génère les candidats d'opportunités à partir des signaux récents et des offres du restaurant
   */
  static generateCandidates(
    restaurant: any,
    signals: any[],
    offers: any[]
  ): OpportunityCandidate[] {
    const candidates: OpportunityCandidate[] = [];
    const profile = restaurant.profile;
    const restType = restaurant.type || 'restaurant';

    // 1. Candidats MÉTÉO
    const weatherSignal = signals.find((s) => s.type === 'weather');
    if (weatherSignal) {
      const data = weatherSignal.data || {};
      const isRain = data.isRain || data.condition?.toLowerCase().includes('pluie') || data.condition?.toLowerCase().includes('rain');
      const isSunny = data.isSunny || data.condition?.toLowerCase().includes('soleil') || data.condition?.toLowerCase().includes('dégagé');

      if (isRain) {
        const compat = getCompatibilityScore('weather', 'rain', restType, profile);
        candidates.push({
          id: `cand_weather_rain_${Date.now()}`,
          type: 'weather',
          signalId: weatherSignal.id,
          suggestedTitle: 'Temps pluvieux : Mettre en avant la livraison et le réconfort',
          suggestedAngle: 'delivery_comfort',
          urgency: 'high',
          rawScore: 0.85 * compat,
          facts: [
            `Pluie détectée ou prévue : ${data.condition || 'Averses'}`,
            `Température extérieure : ${data.temperature ?? 18}${data.tempUnit || '°C'}`,
            profile?.customRules?.hasDelivery ? 'Option de livraison active' : 'Ambiance chaleureuse à l’abri',
          ],
        });
      } else if (isSunny) {
        const compat = getCompatibilityScore('weather', 'sun', restType, profile);
        candidates.push({
          id: `cand_weather_sun_${Date.now()}`,
          type: 'weather',
          signalId: weatherSignal.id,
          suggestedTitle: 'Grand soleil : Remplir la terrasse ce midi',
          suggestedAngle: 'terrace_outdoor',
          urgency: 'medium',
          rawScore: 0.88 * compat,
          facts: [
            `Ensoleillement : ${data.condition || 'Ciel bleu'}`,
            `Température agréable : ${data.temperature ?? 24}${data.tempUnit || '°C'}`,
            profile?.hasTerrace ? 'Terrasse extérieure ouverte' : 'Ambiance lumineuse',
          ],
        });
      }
    }

    // 2. Candidats ÉVÉNEMENTS (Sport / Concerts / Matchs)
    const eventSignals = signals.filter((s) => s.type === 'event');
    for (const es of eventSignals.slice(0, 3)) {
      const data = es.data || {};
      const title = data.title || 'Événement local';
      const category = (data.category || '').toLowerCase();
      const isSport = category.includes('sport') || title.toLowerCase().includes('vs') || title.toLowerCase().includes('match');
      const subType = isSport ? 'sports' : 'concert';
      const compat = getCompatibilityScore('event', subType, restType, profile);

      const targetTime = data.timestamp ? new Date(data.timestamp) : null;
      const urgency = UrgencyCalculator.calculate(targetTime);

      candidates.push({
        id: `cand_event_${es.id}`,
        type: 'event',
        signalId: es.id,
        sourceEvent: title,
        suggestedTitle: `${isSport ? 'Soirée Match' : 'Sortie Concert'} : ${title}`,
        suggestedAngle: isSport ? 'game_night' : 'pre_event_gathering',
        urgency,
        rawScore: 0.82 * compat,
        facts: [
          `Événement à proximité : ${title}`,
          data.venue ? `Lieu : ${data.venue}` : 'À quelques minutes du restaurant',
          data.time ? `Horaire : ${data.time}` : 'Prévu ce jour',
        ],
      });
    }

    // 3. Candidats OFFRES NON COMMUNIQUÉES (Section 26 Fallback Engine)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000);
    const unpromotedOffers = offers.filter((o) => !o.lastPromotedAt || new Date(o.lastPromotedAt) < threeDaysAgo);

    for (const offer of unpromotedOffers.slice(0, 2)) {
      const compat = getCompatibilityScore('offer', undefined, restType, profile);
      candidates.push({
        id: `cand_offer_${offer.id}`,
        type: 'offer',
        offerId: offer.id,
        suggestedTitle: `Offre de la semaine : ${offer.title}`,
        suggestedAngle: 'special_promotion',
        urgency: 'medium',
        rawScore: 0.78 * compat,
        facts: [
          `Offre active du restaurant : ${offer.title}`,
          `Détails : ${offer.description}`,
          offer.discountValue ? `Avantage : ${offer.discountValue}` : 'Offre exclusive',
          'Non communiquée sur vos réseaux depuis plusieurs jours',
        ],
      });
    }

    return candidates;
  }
}
