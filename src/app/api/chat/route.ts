import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireAuth } from '@/server/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { weatherCollector } from '@/server/modules/signal-collector/weather.collector';

export async function POST(req: NextRequest) {
  try {
    const { dbUser } = await requireAuth();
    const body = await req.json();
    const { restaurantId, message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return error('Message requis', 400);
    }

    // 1. Récupération du contexte complet du restaurant depuis la base de données
    let restaurant = null;
    if (restaurantId) {
      restaurant = await prisma.restaurant.findFirst({
        where: { id: restaurantId, userId: dbUser.id },
        include: {
          profile: true,
          offers: { where: { status: 'active' } },
        },
      });
    }

    if (!restaurant) {
      restaurant = await prisma.restaurant.findFirst({
        where: { userId: dbUser.id },
        include: {
          profile: true,
          offers: { where: { status: 'active' } },
        },
      });
    }

    if (!restaurant) {
      return error("Aucun restaurant configuré pour cet utilisateur. Veuillez d'abord compléter l'onboarding.", 400);
    }

    const restName = restaurant.name;
    const restAddress = restaurant.address;
    const restType = restaurant.type;
    const specialties = restaurant.specialties.join(', ') || 'Cuisine traditionnelle';
    const hasTerrace = restaurant.profile?.hasTerrace ?? true;
    const tone = restaurant.profile?.tone || 'chaleureux';
    const offers = restaurant.offers || [];
    const activeOfferTitle = offers[0]?.title || 'Menu du Terroir';
    const activeOfferDesc = offers[0]?.description || 'Plat signature fait maison';
    const activeOfferDiscount = offers[0]?.discountValue || 'Formule du jour';

    // 2. Récupérer un signal météo en direct pour la localisation réelle du restaurant
    let weatherSummary = 'Météo clémente et ciel dégagé';
    let weatherCondition = 'clear';
    let weatherTemp = 22;

    try {
      if (restaurant.latitude && restaurant.longitude) {
        const weatherSignals = await weatherCollector.collect(restaurant.latitude, restaurant.longitude);
        if (weatherSignals.length > 0) {
          weatherSummary = weatherSignals[0].summary;
          weatherCondition = (weatherSignals[0].payload?.condition as string) || 'clear';
          weatherTemp = (weatherSignals[0].payload?.temperature as number) || 22;
        }
      }
    } catch {
      // Ignorer l'erreur météo si temporairement indisponible
    }

    const lower = message.toLowerCase();
    let replyText = '';
    let campaignSuggestion: any = null;

    // 3. Si clé Anthropic disponible, appeler Claude avec le Ground Truth restaurant
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
      try {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const systemPrompt = `Tu es GetSpecial, le conseiller marketing IA dédié pour le restaurant "${restName}".
Données réelles et exclusives de l'établissement (stricte interdiction d'en inventer d'autres) :
- Nom : ${restName}
- Type : ${restType}
- Adresse : ${restAddress}
- Spécialités : ${specialties}
- Terrasse disponible : ${hasTerrace ? 'Oui' : 'Non'}
- Ton souhaité : ${tone}
- Offre active actuelle : "${activeOfferTitle}" (${activeOfferDesc} - ${activeOfferDiscount})
- Météo en direct : ${weatherSummary} (${weatherTemp}°C)

Règles de rédaction :
- Réponds en français de manière concise, chaleureuse et directement exploitable par le restaurateur.
- Concentre-toi sur l'impact commercial (remplissage du service midi/soir, livraison si pluie, terrasse si soleil).
- Propose des accroches concrètes et adaptées à ses offres réelles.`;

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            ...history.slice(-4).map((h: any) => ({
              role: h.sender === 'user' ? 'user' : 'assistant',
              content: h.text,
            })),
            { role: 'user', content: message },
          ],
        });

        replyText = response.content[0]?.type === 'text' ? response.content[0].text : '';
      } catch (llmErr) {
        console.warn('[CHAT_LLM_ERROR] Appel Claude échoué, bascule vers le synthétiseur intelligent :', llmErr);
      }
    }

    // 4. Si pas de clé Anthropic ou échec API, synthétiseur dynamique basé sur les VRAIES données du restaurant
    if (!replyText) {
      if (lower.includes('pause') || lower.includes('stop') || lower.includes('arrête')) {
        replyText = `J'ai bien noté pour ${restName}. Vous pouvez mettre vos publications en pause à tout moment depuis l'onglet "Mon restaurant" sans perdre vos programmations.`;
      } else if (
        lower.includes('propose') ||
        lower.includes('idée') ||
        lower.includes('semaine') ||
        lower.includes('aujourd') ||
        lower.includes('météo')
      ) {
        const weatherAction =
          weatherCondition === 'rain'
            ? 'Avec la pluie annoncée, mettez l’accent sur le réconfort et la livraison.'
            : weatherCondition === 'heat'
            ? 'Avec cette belle journée ensoleillée, profitez-en pour valoriser votre terrasse et vos boissons fraîches.'
            : 'Les conditions météo sont favorables pour attirer vos clients ce midi.';

        replyText =
          `Voici la meilleure opportunité marketing pour **${restName}** aujourd'hui :\n\n` +
          `🌤️ **Contexte local** : ${weatherSummary}\n` +
          `💡 **Recommandation** : ${weatherAction}\n` +
          `🎯 **Offre à valoriser** : "${activeOfferTitle}" (${activeOfferDiscount}).\n\n` +
          `Souhaitez-vous que je prépare le visuel et la légende prêts à publier ?`;

        campaignSuggestion = {
          id: `camp_${Date.now()}`,
          title: activeOfferTitle,
          discount: activeOfferDiscount,
          timeSlot: 'Service du soir',
          platforms: ['Instagram', 'Facebook'],
          status: 'ready',
        };
      } else if (lower.includes('programme') || lower.includes('publie') || lower.includes('valide') || lower.includes('oui')) {
        replyText = `Parfait ! Votre publication pour "${activeOfferTitle}" est prête. Vous pouvez la finaliser et la planifier dans votre studio de création.`;
      } else if (lower.includes('spécialité') || lower.includes('plat') || lower.includes('menu')) {
        replyText = `Pour vos spécialités (${specialties}), je vous suggère de publier une photo des coulisses en cuisine vers 11h30 pour déclencher l'appétit de vos clients avant le service de midi.`;
      } else {
        replyText = `Bien reçu pour ${restName} ! Compte tenu de la météo (${weatherSummary}) et de vos spécialités (${specialties}), je vous conseille de mettre en valeur ${hasTerrace ? 'votre terrasse et ' : ''}votre offre "${activeOfferTitle}". Voulez-vous préparer un post rapide pour ce service ?`;
      }
    }

    return success({
      reply: {
        id: `msg_asst_${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        campaignSuggestion,
      },
      restaurant: {
        id: restaurant.id,
        name: restName,
        address: restAddress,
        type: restType,
      },
    });
  } catch (err: any) {
    if (err.message === 'Non autorisé') return unauthorized();
    return error(err.message, 500);
  }
}
