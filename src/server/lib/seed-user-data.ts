/* =============================================================================
 * Seed User Data Helper
 *
 * Initialise un restaurant complet avec profil, offres, opportunités réelles
 * et publications pour un utilisateur s'il n'en possède pas encore.
 * ============================================================================= */

import { prisma } from '@/server/db/prisma.client';
import { DEFAULT_IMAGES } from '@/server/transformers/formatters';

export async function ensureUserHasRestaurant(userId: string) {
  // Vérifier si l'utilisateur possède déjà au moins un restaurant
  const existing = await prisma.restaurant.findFirst({
    where: { userId },
    include: {
      profile: true,
      offers: true,
      socialAccounts: true,
      opportunities: true,
    },
  });

  if (existing) {
    return existing;
  }

  // Création du restaurant d'exemple complet dans la base locale
  const restaurant = await prisma.restaurant.create({
    data: {
      userId,
      name: 'Le Comptoir',
      type: 'Restaurant • Cuisine française',
      address: '12 Rue des Lilas, Cotonou, Bénin',
      latitude: 6.3654,
      longitude: 2.4183,
      timezone: 'Africa/Porto-Novo',
      specialties: ['Cuisine traditionnelle française', 'Grillades', 'Vins & Cocktails'],
      status: 'active',
      isPaused: false,
      openingHours: {
        description: 'Lun - Dim : 11h - 23h',
      },
      profile: {
        create: {
          tone: 'Convivial',
          hasTerrace: true,
          offPeakDays: ['monday', 'tuesday'],
          constraints: ['menu végétarien'],
        },
      },
      offers: {
        create: [
          {
            title: 'Happy Hour',
            description: 'Cocktails à prix réduit de 18h à 20h',
            discountValue: '-20%',
            recurrence: 'daily',
            status: 'active',
          },
          {
            title: 'Menu du Terroir',
            description: 'Entrée + Plat + Dessert maison',
            discountValue: '18 000 FCFA',
            recurrence: 'weekly',
            status: 'active',
          },
          {
            title: 'Soirée Tapas',
            description: 'Planche découverte offerte pour 4 cocktails',
            discountValue: 'Offert',
            recurrence: 'weekly',
            status: 'active',
          },
        ],
      },
      socialAccounts: {
        create: [
          {
            platform: 'instagram',
            username: '@lecomptoir_restaurant',
            status: 'connected',
            outstandAccountId: 'mock-insta-01',
          },
          {
            platform: 'facebook',
            username: 'Le Comptoir Cotonou',
            status: 'connected',
            outstandAccountId: 'mock-fb-01',
          },
        ],
      },
    },
    include: {
      profile: true,
      offers: true,
      socialAccounts: true,
    },
  });

  // Création des signaux et opportunités contextuelles
  const signalRain = await prisma.signal.create({
    data: {
      restaurantId: restaurant.id,
      type: 'weather',
      intensity: 0.85,
      source: 'openweathermap',
      data: { condition: 'pluie', temperature: 24 },
    },
  });

  const signalMatch = await prisma.signal.create({
    data: {
      restaurantId: restaurant.id,
      type: 'event',
      intensity: 1.0,
      source: 'ticketmaster',
      data: { event: 'Match de foot à 2 km', start: '20:00' },
    },
  });

  const signalHappyHour = await prisma.signal.create({
    data: {
      restaurantId: restaurant.id,
      type: 'trend',
      intensity: 0.75,
      source: 'manual',
      data: { theme: 'Cocktails du jeudi' },
    },
  });

  await prisma.opportunity.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        signalId: signalRain.id,
        title: 'Pluie prévue ce soir',
        description: 'Les gens cherchent des lieux pour se réchauffer. Mettez en avant votre menu spécial et vos plats réconfortants.',
        urgency: 'high',
        relevanceScore: 0.94,
        recommendedTone: 'chaleureux',
        factsCited: ['Pluie continue annoncée dès 18h', 'Baisse de température de 4°C'],
        status: 'pending',
      },
      {
        restaurantId: restaurant.id,
        signalId: signalMatch.id,
        title: 'Match à 2 km à 20h',
        description: 'Attirez les supporters avant le coup d’envoi avec une formule spéciale burger & bière.',
        urgency: 'high',
        relevanceScore: 0.89,
        recommendedTone: 'dynamique',
        factsCited: ['Stade de l’Amitié complet à 20h', 'Affluence prévue aux alentours'],
        status: 'pending',
      },
      {
        restaurantId: restaurant.id,
        signalId: signalHappyHour.id,
        title: 'Relance Happy Hour',
        description: 'Rappelez à votre communauté que le Happy Hour démarre à 18h avec des cocktails création.',
        urgency: 'medium',
        relevanceScore: 0.78,
        recommendedTone: 'festif',
        factsCited: ['Jeudi soir : jour à forte fréquentation apéro'],
        status: 'pending',
      },
    ],
  });

  // Création de posts et publications types
  const post1 = await prisma.post.create({
    data: {
      restaurantId: restaurant.id,
      text: "Ce soir, la météo est maussade mais l'ambiance est au chaud au Comptoir ! 🔥 Découvrez notre risotto crémeux aux champignons sauvages. Réservez votre table en bio !",
      imageUrl: DEFAULT_IMAGES.dish,
      platform: 'instagram',
      status: 'published',
      publishedAt: new Date(Date.now() - 24 * 3600 * 1000),
      publications: {
        create: {
          restaurantId: restaurant.id,
          platform: 'instagram',
          sendIdempotencyKey: `init-${restaurant.id}-01`,
          status: 'published',
          publishedAt: new Date(Date.now() - 24 * 3600 * 1000),
          feedbackEvents: {
            create: [
              {
                restaurantId: restaurant.id,
                type: 'reach',
                value: 14200,
              },
              {
                restaurantId: restaurant.id,
                type: 'engagement',
                value: 520,
              },
            ],
          },
        },
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      restaurantId: restaurant.id,
      text: "Le weekend approche ! 🍸 Nos bartenders vous ont préparé de nouvelles créations pour le Happy Hour de demain. Qui vient trinquer avec nous ?",
      imageUrl: DEFAULT_IMAGES.cocktail,
      platform: 'facebook',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 18 * 3600 * 1000),
      publications: {
        create: {
          restaurantId: restaurant.id,
          platform: 'facebook',
          sendIdempotencyKey: `init-${restaurant.id}-02`,
          status: 'pending',
        },
      },
    },
  });

  const post3 = await prisma.post.create({
    data: {
      restaurantId: restaurant.id,
      text: "Grand match ce soir ! ⚽ Écran géant et formule burger maison + boisson fraîche. Venez vibrer avec nous !",
      imageUrl: DEFAULT_IMAGES.event,
      platform: 'instagram',
      status: 'pending_approval',
    },
  });

  return restaurant;
}
