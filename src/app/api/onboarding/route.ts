import { prisma } from '@/server/db/prisma.client';
import { success, error, unauthorized } from '@/server/lib/api-response';
import { requireAuth } from '@/server/lib/auth';
import { geocodeAddress } from '@/server/lib/geocoding';
import { logAudit } from '@/server/lib/audit';
import { weatherCollector } from '@/server/modules/signal-collector/weather.collector';
import { DEFAULT_IMAGES } from '@/server/transformers/formatters';
import { z } from 'zod';

/* =============================================================================
 * Onboarding API Route
 *
 * POST /api/onboarding
 * Enregistre le restaurant en 90s, configure le profil marketing, génère les
 * premières offres adaptées et déclenche les premiers signaux réels.
 * ============================================================================= */

const OnboardingSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  type: z.string().default('restaurant'),
  address: z.string().min(3, "L'adresse ou la ville est requise"),
  tone: z.string().default('Convivial'),
  goals: z.array(z.string()).default([]),
  offPeakDays: z.array(z.string()).default([]),
  specialties: z.array(z.string()).default([]),
  menuNotes: z.string().optional().nullable(),
  instagramHandle: z.string().optional().nullable(),
  facebookHandle: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const { dbUser } = await requireAuth();
    const body = await req.json();
    const validated = OnboardingSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Données invalides', 400);
    }

    const {
      name,
      type,
      address,
      tone,
      goals,
      offPeakDays,
      specialties,
      menuNotes,
      instagramHandle,
      facebookHandle,
    } = validated.data;

    // Géocodage de l'adresse pour météo et événements locaux
    const geo = await geocodeAddress(address);

    // Vérifier si un restaurant existe déjà pour cet utilisateur
    let restaurant = await prisma.restaurant.findFirst({
      where: { userId: dbUser.id },
      include: { profile: true },
    });

    const parsedSpecialties = specialties.length > 0
      ? specialties
      : type === 'bar'
      ? ['Cocktails signature', 'Bières artisanales', 'Tapas']
      : type === 'foodtruck'
      ? ['Street food', 'Burgers maison', 'Frites fraîches']
      : type === 'cafe'
      ? ['Cafés de spécialité', 'Pâtisseries', 'Brunch']
      : type === 'fastfood'
      ? ['Fast food', 'Menus combos', 'Tacos & Burgers']
      : ['Cuisine de saison', 'Plat du jour', 'Desserts maison'];

    if (restaurant) {
      // Mise à jour du restaurant existant
      restaurant = await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: {
          name,
          type,
          address,
          latitude: geo.latitude,
          longitude: geo.longitude,
          specialties: parsedSpecialties,
          profile: {
            upsert: {
              create: {
                tone,
                offPeakDays,
                hasTerrace: true,
                customRules: { goals, menuNotes },
              },
              update: {
                tone,
                offPeakDays,
                customRules: { goals, menuNotes },
              },
            },
          },
        },
        include: { profile: true },
      });
    } else {
      // Création du premier restaurant
      restaurant = await prisma.restaurant.create({
        data: {
          name,
          type,
          address,
          latitude: geo.latitude,
          longitude: geo.longitude,
          specialties: parsedSpecialties,
          userId: dbUser.id,
          openingHours: { description: 'Lun - Dim : 11h - 23h' },
          profile: {
            create: {
              tone,
              offPeakDays,
              hasTerrace: true,
              customRules: { goals, menuNotes },
            },
          },
        },
        include: { profile: true },
      });
    }

    // Création des offres intelligentes selon le profil et les objectifs
    const existingOffers = await prisma.offer.count({ where: { restaurantId: restaurant.id } });
    if (existingOffers === 0) {
      const initialOffers = [];

      if (type === 'bar' || goals.includes('happy_hour')) {
        initialOffers.push({
          restaurantId: restaurant.id,
          title: 'Happy Hour Signature',
          description: 'Cocktails création et tapas à prix doux de 18h à 20h',
          discountValue: '-20%',
          recurrence: 'daily',
        });
      }

      if (goals.includes('off_peak') || offPeakDays.length > 0) {
        initialOffers.push({
          restaurantId: restaurant.id,
          title: 'Offre Jours Creux',
          description: 'Dessert offert pour toute formule plat commandée',
          discountValue: '1 Dessert offert',
          recurrence: 'weekly',
          recurrenceDays: offPeakDays,
        });
      }

      if (type === 'foodtruck') {
        initialOffers.push({
          restaurantId: restaurant.id,
          title: 'Menu Emplacement du Jour',
          description: 'Plat signature + boisson fraîche à tarif découverte',
          discountValue: 'Formule Express',
          recurrence: 'daily',
        });
      } else {
        initialOffers.push({
          restaurantId: restaurant.id,
          title: 'Menu du Terroir',
          description: 'Formule complète avec ingrédients frais du marché',
          discountValue: 'Formule Midi',
          recurrence: 'weekly',
        });
      }

      for (const off of initialOffers) {
        await prisma.offer.create({ data: off });
      }
    }

    // Enregistrement des comptes réseaux sociaux si renseignés
    if (instagramHandle) {
      await prisma.socialAccount.upsert({
        where: { restaurantId_platform: { restaurantId: restaurant.id, platform: 'instagram' } },
        create: {
          restaurantId: restaurant.id,
          platform: 'instagram',
          username: instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`,
          outstandAccountId: `onb-ig-${restaurant.id}`,
          status: 'connected',
        },
        update: {
          username: instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`,
        },
      });
    }

    if (facebookHandle) {
      await prisma.socialAccount.upsert({
        where: { restaurantId_platform: { restaurantId: restaurant.id, platform: 'facebook' } },
        create: {
          restaurantId: restaurant.id,
          platform: 'facebook',
          username: facebookHandle,
          outstandAccountId: `onb-fb-${restaurant.id}`,
          status: 'connected',
        },
        update: {
          username: facebookHandle,
        },
      });
    }

    // Déclenchement en temps réel de la météo Open-Meteo pour générer les 3 premières opportunités
    try {
      const weatherSignals = await weatherCollector.collect(geo.latitude, geo.longitude);
      for (const sig of weatherSignals) {
        const savedSignal = await prisma.signal.create({
          data: {
            restaurantId: restaurant.id,
            type: sig.type,
            intensity: sig.intensity,
            source: sig.source,
            data: sig.payload as any,
          },
        });

        // Créer l'opportunité associée
        await prisma.opportunity.create({
          data: {
            restaurantId: restaurant.id,
            signalId: savedSignal.id,
            title: sig.payload.condition === 'rain' ? 'Pluie annoncée : Mettez en avant le réconfort' : 'Météo favorable : Boostez la fréquentation',
            description: sig.payload.summary,
            urgency: 'high',
            relevanceScore: 0.92,
            recommendedTone: tone,
            factsCited: [sig.payload.description, `${sig.payload.temperature}°C constatés`],
            status: 'pending',
          },
        });
      }

      // Opportunité spéciale selon le type
      if (type === 'foodtruck') {
        await prisma.opportunity.create({
          data: {
            restaurantId: restaurant.id,
            title: "Annoncez votre emplacement du jour",
            description: "Informez vos habitués de votre position exacte pour le déjeuner et donnez envie avec le plat du jour.",
            urgency: 'high',
            relevanceScore: 0.95,
            recommendedTone: 'direct',
            factsCited: [address, "Service du midi"],
            status: 'pending',
          },
        });
      } else {
        await prisma.opportunity.create({
          data: {
            restaurantId: restaurant.id,
            title: `Mettez en avant votre spécialité : ${parsedSpecialties[0]}`,
            description: `Votre communauté adore les visuels gourmands. Partagez les coulisses de la préparation de vos ${parsedSpecialties[0]}.`,
            urgency: 'medium',
            relevanceScore: 0.88,
            recommendedTone: tone,
            factsCited: [parsedSpecialties[0]],
            status: 'pending',
          },
        });
      }
    } catch (weatherErr) {
      console.warn('[ONBOARDING] Détection météo automatique ignorée :', weatherErr);
    }

    await logAudit({
      restaurantId: restaurant.id,
      userId: dbUser.id,
      action: 'restaurant.onboarding_completed',
      entityType: 'restaurant',
      entityId: restaurant.id,
      details: { name, type, address, tone, goals },
    });

    return success({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      type: restaurant.type,
    });
  } catch (err: any) {
    if (err.message === 'Non autorisé') return unauthorized();
    return error(err.message, 500);
  }
}
