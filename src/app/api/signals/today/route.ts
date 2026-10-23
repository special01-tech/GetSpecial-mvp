import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { resolveActiveRestaurant } from '@/server/lib/resolve-restaurant';
import { weatherService } from '@/server/modules/signal-collector/weather/weather.service';
import { ticketmasterCollector } from '@/server/modules/signal-collector/ticketmaster.collector';
import { calendarificCollector } from '@/server/modules/signal-collector/calendarific.collector';
import { OpenRouterClient } from '@/server/modules/opportunity-engine/openrouter-client';
import { ContextDossier } from '@/server/modules/opportunity-engine/types';
import { getCountryConfig } from '@/server/lib/country-config';

export const dynamic = 'force-dynamic';

// Cache quotidien en mémoire par restaurant pour ne pas gaspiller de tokens à chaque refresh accidentel
interface DailyOpportunityCache {
  dateKey: string;
  opportunities: any[];
  report: any;
}
const dailyOpportunityCache = new Map<string, DailyOpportunityCache>();

/**
 * GET /api/signals/today
 *
 * Récupère en temps réel les VRAIS signaux du restaurant connecté :
 * 1. Vraie météo locale (Open-Meteo / OpenWeatherMap) selon ses coordonnées réelles (lat, lon)
 * 2. Vrais événements locaux (Ticketmaster 15km, Calendarific fêtes/fériés, événements du restaurant)
 * 3. Évaluation par l'IA (DeepSeek v4 Pro) basée STRICTEMENT sur la réalité de l'établissement
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true' || searchParams.get('forceRefresh') === 'true';
    const requestedRestId = searchParams.get('restaurantId') || req.headers.get('x-restaurant-id');

    // 1. Résolution stricte du restaurant (session utilisateur authentifiée ou ID explicite)
    const restaurant = await resolveActiveRestaurant(req, requestedRestId, {
      profile: true,
      offers: true,
      signals: true,
    });


    if (!restaurant) {
      return error(
        'Aucun établissement actif trouvé. Veuillez sélectionner un restaurant valide ou créer votre établissement.',
        404
      );
    }

    // Coordonnées réelles de l'établissement
    const country = (restaurant.country || restaurant.profile?.country || 'FR').toUpperCase();
    const config = getCountryConfig(country);

    // 2. SYNCHRONISATION DES SIGNAUX SI NÉCESSAIRE (Moins de 3h ou forceRefresh)
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000);
    const hasRecentSignals = (restaurant.signals || []).some((s: any) => new Date(s.detectedAt) >= threeHoursAgo);

    if (forceRefresh || !hasRecentSignals) {
      try {
        const { signalSyncScheduler } = await import('@/server/modules/signal-collector/signal-sync.scheduler');
        await signalSyncScheduler.syncSignalsForRestaurant(restaurant.id);
      } catch (syncErr: any) {
        console.warn('[TODAY_ROUTE] Synchronisation des signaux échouée, utilisation des signaux existants :', syncErr.message);
      }
    }

    // 3. LECTURE DES SIGNAUX ACTIFS EN BASE
    let activeSignals = await (prisma as any).signal.findMany({
      where: {
        restaurantId: restaurant.id,
        status: 'active',
      },
      orderBy: { detectedAt: 'desc' },
      take: 30,
    });

    // Si aucun signal météo ou événement en base, charger directement depuis les APIs réelles
    const hasWeatherInDb = activeSignals.some((s: any) => s.type === 'weather');
    const hasEventsInDb = activeSignals.some((s: any) => s.type === 'event' || s.type === 'holiday');

    if (!hasWeatherInDb || !hasEventsInDb || activeSignals.length === 0) {
      try {
        const lat = restaurant.latitude ? parseFloat(restaurant.latitude) : 48.8556;
        const lon = restaurant.longitude ? parseFloat(restaurant.longitude) : 2.3522;
        const customRules = (restaurant.profile?.customRules as Record<string, any>) || {};
        const eventPrefs = customRules.eventPreferences || {};
        const prefRadius = typeof eventPrefs.radiusKm === 'number'
          ? eventPrefs.radiusKm
          : typeof customRules.eventRadiusKm === 'number'
          ? customRules.eventRadiusKm
          : 15;
        const catPrefs = {
          sport: eventPrefs.categories?.sport ?? true,
          concert: eventPrefs.categories?.concert ?? true,
          arts: eventPrefs.categories?.arts ?? true,
          holiday: eventPrefs.categories?.holiday ?? true,
          internal: eventPrefs.categories?.internal ?? true,
        };

        const promises: Promise<any>[] = [];
        if (!hasWeatherInDb) {
          promises.push(weatherService.getSignals(lat, lon, country).catch(() => []));
        } else {
          promises.push(Promise.resolve([]));
        }

        if (!hasEventsInDb) {
          const restCity = restaurant.city || (country === 'FR' ? 'Paris' : country === 'US' ? 'New York' : '');
          const canFetchTicketmaster = catPrefs.sport || catPrefs.concert || catPrefs.arts;
          if (canFetchTicketmaster) {
            promises.push(ticketmasterCollector.collect(lat, lon, prefRadius, country, new Date(), restCity).catch(() => []));
          } else {
            promises.push(Promise.resolve([]));
          }

          if (catPrefs.holiday) {
            promises.push(calendarificCollector.collect(country, new Date()).catch(() => []));
          } else {
            promises.push(Promise.resolve([]));
          }
        } else {
          promises.push(Promise.resolve([]));
          promises.push(Promise.resolve([]));
        }

        const [directWeather, directEvents, directHolidays] = await Promise.all(promises);
        activeSignals = [...activeSignals, ...directWeather, ...directEvents, ...directHolidays];

        // Persister les signaux récoltés directement pour les futures requêtes
        const newlyFetched = [...directWeather, ...directEvents, ...directHolidays];
        for (const sig of newlyFetched) {
          try {
            await (prisma as any).signal.create({
              data: {
                restaurantId: restaurant.id,
                externalId: sig.externalId,
                type: sig.type,
                category: sig.category || 'other',
                source: sig.source,
                intensity: sig.intensity,
                startsAt: sig.startsAt ? new Date(sig.startsAt) : new Date(sig.timestamp),
                endsAt: sig.endsAt ? new Date(sig.endsAt) : new Date(Date.now() + 24 * 3600 * 1000),
                distanceMeters: sig.distanceMeters ?? null,
                isFallback: sig.isFallback ?? false,
                detectedAt: new Date(),
                status: 'active',
                data: sig.data,
              },
            });
          } catch {
            // Ignorer si déjà existant
          }
        }
      } catch (directErr) {
        console.warn('[TODAY_ROUTE] Chargement direct de secours échoué :', directErr);
      }
    }

    // A. Météo
    const weatherSignal = activeSignals.find((s: any) => s.type === 'weather');
    let weatherData: any = null;
    let weatherError: string | null = null;

    if (weatherSignal && weatherSignal.data) {
      const data = weatherSignal.data as Record<string, any>;
      const raw = (data.raw as Record<string, any>) || {};
      const isRain = Boolean(data.isRain ?? raw.isRain);
      const isSunny = Boolean(data.isSunny ?? raw.isSunny);
      const condition = data.condition || weatherSignal.title || 'Ciel dégagé';
      const condLower = condition.toLowerCase();
      const isCloudSun = !isRain && (condLower.includes('éclaircie') || condLower.includes('nuag') || condLower.includes('partiellement'));

      weatherData = {
        isReal: true,
        available: true,
        source: weatherSignal.source === 'open-meteo' ? 'Open-Meteo API' : weatherSignal.source || 'Météo en direct',
        condition,
        temperature: data.temperature ?? data.tempCelsius ?? 20,
        tempFahrenheit: data.tempFahrenheit,
        tempCelsius: data.tempCelsius,
        tempUnit: data.tempUnit || config.tempUnit || '°C',
        isRain,
        isSunny,
        iconType: isRain ? 'rain' : isSunny ? 'sun' : isCloudSun ? 'cloud-sun' : 'cloud',
        terraceAdvice: data.terraceAdvice || weatherSignal.summary || 'Conditions météo réelles du jour.',
      };
    } else {
      weatherData = {
        isReal: true,
        available: false,
        condition: 'Météo indisponible',
        temperature: null,
        tempUnit: config.tempUnit || '°C',
        iconType: 'cloud',
        terraceAdvice: 'Données météo temporairement inaccessibles.',
      };
    }

    // B. Événements et Célébrations réels
    const restaurantTimezone = restaurant.timezone || (country === 'US' ? 'America/New_York' : 'Europe/Paris');
    const now = new Date();
    const todayLocalStr = new Intl.DateTimeFormat('en-CA', { timeZone: restaurantTimezone }).format(now); // "YYYY-MM-DD"

    const eventSignals = activeSignals.filter((s: any) => s.type === 'event' || s.type === 'holiday');
    const liveEvents = eventSignals.map((sig: any) => {
      const data = (sig.data as Record<string, any>) || {};
      const raw = (data.raw as Record<string, any>) || {};
      const rawStartsAt = sig.startsAt || data.startsAt || data.timestamp;

      let timeDisplay = 'Aujourd’hui';
      if (sig.type === 'holiday') {
        timeDisplay = config.language === 'fr' ? 'Toute la journée' : 'All day';
      } else if (rawStartsAt) {
        try {
          const eventDate = new Date(rawStartsAt);
          const eventDateLocalStr = new Intl.DateTimeFormat('en-CA', { timeZone: restaurantTimezone }).format(eventDate);
          
          const timeFormatted = new Intl.DateTimeFormat(config.locale, {
            timeZone: restaurantTimezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }).format(eventDate);

          const dayFormatted = new Intl.DateTimeFormat(config.locale, {
            timeZone: restaurantTimezone,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }).format(eventDate);

          if (eventDateLocalStr === todayLocalStr) {
            timeDisplay = config.language === 'fr' ? `Aujourd’hui à ${timeFormatted}` : `Today at ${timeFormatted}`;
          } else {
            // Vérifier si demain
            const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
            const tomorrowLocalStr = new Intl.DateTimeFormat('en-CA', { timeZone: restaurantTimezone }).format(tomorrow);
            if (eventDateLocalStr === tomorrowLocalStr) {
              timeDisplay = config.language === 'fr' ? `Demain à ${timeFormatted}` : `Tomorrow at ${timeFormatted}`;
            } else {
              timeDisplay = `${dayFormatted} à ${timeFormatted}`;
            }
          }
        } catch {
          timeDisplay = data.localTime ? `À ${data.localTime}` : 'Aujourd’hui';
        }
      }

      const dist = sig.distanceMeters || data.distanceMeters;
      const distanceStr = dist ? (dist < 1000 ? `${dist} m` : `${(dist / 1000).toFixed(1)} km`) : (sig.type === 'holiday' ? 'National / Local' : 'À proximité');

      return {
        id: sig.id,
        externalId: sig.externalId,
        isReal: true,
        source: sig.source === 'ticketmaster' ? 'Ticketmaster API' : sig.source === 'calendarific' ? 'Fêtes & Célébrations' : 'Événement Restaurant',
        title: data.title || sig.title || raw.name || 'Événement local',
        category: sig.category || data.category || (sig.type === 'holiday' ? 'holiday' : 'concert'),
        time: timeDisplay,
        startsAt: rawStartsAt,
        distance: distanceStr,
        distanceMeters: dist,
        venue: data.venue || raw.venue || (sig.type === 'holiday' ? config.name : 'À proximité'),
        summary: data.summary || sig.summary || raw.description || '',
        url: data.url || raw.url,
        imageUrl: data.imageUrl || raw.imageUrl || sig.imageUrl || null,
        isFallback: sig.isFallback || false,
      };
    });

    // Dédoublonnage intelligent : regrouper les événements multi-jours ou récurrents sous une seule carte
    const consolidatedEventsMap = new Map<string, typeof liveEvents[0]>();

    for (const ev of liveEvents) {
      const cleanTitle = (ev.title || '')
        .toLowerCase()
        .replace(/^(sport \/ match|concert|spectacle|fête & célébration) : /i, '')
        .replace(/ \(multi-jours\)/i, '')
        .replace(/[^a-z0-9]/g, '');
      const cleanVenue = (ev.venue || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const dedupKey = `${cleanTitle}___${cleanVenue}`;

      const existing = consolidatedEventsMap.get(dedupKey);
      if (!existing) {
        consolidatedEventsMap.set(dedupKey, ev);
      } else {
        if (ev.startsAt && existing.startsAt) {
          const t1 = new Date(existing.startsAt).getTime();
          const t2 = new Date(ev.startsAt).getTime();
          const firstDate = new Date(Math.min(t1, t2));
          const lastDate = new Date(Math.max(t1, t2));

          const firstStr = new Intl.DateTimeFormat(config.locale, { timeZone: restaurantTimezone, day: 'numeric', month: 'short' }).format(firstDate);
          const lastStr = new Intl.DateTimeFormat(config.locale, { timeZone: restaurantTimezone, day: 'numeric', month: 'short' }).format(lastDate);

          if (firstStr !== lastStr) {
            existing.time = config.language === 'fr' ? `Du ${firstStr} au ${lastStr}` : `${firstStr} - ${lastStr}`;
            if (!existing.title.includes('Multi-jours') && !existing.title.includes('Multi-day')) {
              existing.title = `${existing.title} (Multi-jours)`;
            }
          }
        }
      }
    }

    const userEventPrefs = (restaurant.profile?.customRules as Record<string, any>)?.eventPreferences || {};
    const effectiveCatPrefs = {
      sport: userEventPrefs.categories?.sport ?? true,
      concert: userEventPrefs.categories?.concert ?? true,
      arts: userEventPrefs.categories?.arts ?? true,
      holiday: userEventPrefs.categories?.holiday ?? true,
      internal: userEventPrefs.categories?.internal ?? true,
    };
    const maxRadiusKm = typeof userEventPrefs.radiusKm === 'number'
      ? userEventPrefs.radiusKm
      : typeof (restaurant.profile?.customRules as any)?.eventRadiusKm === 'number'
      ? (restaurant.profile?.customRules as any)?.eventRadiusKm
      : 15;
    const maxRadiusMeters = maxRadiusKm * 1000;
    const excludedKeywords: string[] = Array.isArray(userEventPrefs.excludedKeywords)
      ? userEventPrefs.excludedKeywords.map((k: string) => k.toLowerCase().trim()).filter(Boolean)
      : [];

    const uniqueLiveEvents = Array.from(consolidatedEventsMap.values());
    const filteredLiveEvents = uniqueLiveEvents.filter((ev: any) => {
      const cat = (ev.category || '').toLowerCase();

      // 1. Filtrage par catégorie
      if (cat === 'sport' || cat === 'sports') {
        if (!effectiveCatPrefs.sport) return false;
      } else if (cat === 'concert' || cat === 'music') {
        if (!effectiveCatPrefs.concert) return false;
      } else if (cat === 'arts' || cat === 'theatre' || cat === 'theatre & comedy') {
        if (!effectiveCatPrefs.arts) return false;
      } else if (cat === 'holiday') {
        if (!effectiveCatPrefs.holiday) return false;
      } else if (cat === 'internal' || ev.source === 'Événement Restaurant') {
        if (!effectiveCatPrefs.internal) return false;
      }

      // 2. Filtrage par rayon kilométrique (uniquement pour les événements physiques géolocalisés)
      if (typeof ev.distanceMeters === 'number' && ev.distanceMeters > 0 && cat !== 'holiday') {
        if (ev.distanceMeters > maxRadiusMeters) return false;
      }

      // 3. Filtrage par mots-clés exclus
      if (excludedKeywords.length > 0) {
        const textToSearch = `${ev.title} ${ev.summary} ${ev.venue || ''}`.toLowerCase();
        for (const kw of excludedKeywords) {
          if (textToSearch.includes(kw)) {
            return false;
          }
        }
      }

      return true;
    });

    // 4. RÉCUPÉRATION OU GÉNÉRATION DES OPPORTUNITÉS PERSISTÉES
    const todayDateKey = new Date().toISOString().slice(0, 10);
    let dbOpportunities = await (prisma as any).opportunity.findMany({
      where: {
        restaurantId: restaurant.id,
        status: 'pending',
        suggestedAt: { gte: new Date(Date.now() - 12 * 3600 * 1000) }, // Moins de 12h
      },
      orderBy: { relevanceScore: 'desc' },
      take: 5,
    });

    let engineReport: any = null;

    if (forceRefresh || dbOpportunities.length === 0) {
      const { opportunityEngineService } = await import('@/server/modules/opportunity-engine/opportunity-engine.service');
      const genResult = await opportunityEngineService.generateOpportunitiesWithReport(restaurant.id);
      dbOpportunities = genResult.opportunities;
      engineReport = genResult.executionReport;
    }

    // 5. FORMATAGE DES OPPORTUNITÉS POUR L'INTERFACE
    const formattedOpportunities = dbOpportunities.map((opp: any, idx: number) => {
      const factsCited = (opp.factsCited as Record<string, any>) || {};
      const importance = opp.importance || factsCited.importance || (idx === 0 ? 'HIGH' : 'MEDIUM');
      const impactScore = opp.impactScore || factsCited.impactScore || Math.round((opp.relevanceScore || 0.8) * 100);
      const offer = opp.offer || factsCited.offer || { label: opp.title, codeWord: 'SPECIAL' };
      const distribution = opp.distribution || factsCited.distribution || { channels: ['INSTAGRAM', 'FACEBOOK'] };
      const reasons = opp.reasons || factsCited.reasons || [];
      const verifiedFacts = factsCited.facts || [];

      const channelsStr = Array.isArray(distribution.channels)
        ? distribution.channels.map((c: string) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()).join(' & ')
        : 'Instagram & Facebook';

      const oneSentenceSummary = `${opp.title} : promouvez ${offer.label} dès ${distribution.recommendedPublishTime || '11h30'} sur ${channelsStr} (mot-code : ${offer.codeWord || 'SPECIAL'}).`;

      return {
        id: opp.id,
        title: opp.title,
        urgency: opp.urgency ? opp.urgency.charAt(0).toUpperCase() + opp.urgency.slice(1) : 'Medium',
        importance,
        impactScore,
        category: opp.category || factsCited.category || 'LOCAL_EVENT',
        signalOrigin: verifiedFacts[0] || 'Signal contextuel du jour',
        description: opp.description,
        recommendedTime: offer.validityText || (distribution.recommendedPublishTime ? `Publication à ${distribution.recommendedPublishTime}` : 'Ce jour'),
        targetAudience: 'Clientèle locale & habitués',
        status: opp.status || 'pending',
        verifiedFacts,
        reasons: Array.isArray(reasons) ? reasons : [reasons].filter(Boolean),
        offer,
        distribution,
        codeWord: offer.codeWord,
        oneSentenceSummary,
      };
    });

    // Offre active principale
    const activeOffer = restaurant.offers && restaurant.offers.length > 0
      ? {
          id: restaurant.offers[0].id,
          title: restaurant.offers[0].title,
          description: restaurant.offers[0].description,
          discountBadge: restaurant.offers[0].discountValue || 'OFFRE EN COURS',
          timeSlot: 'Actif',
          isActive: restaurant.offers[0].status === 'active',
        }
      : null;

    return success({
      isLive: true,
      isTestMockMode: false,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        type: restaurant.type,
        country,
        address: restaurant.address,
        city: restaurant.city || restaurant.address.split(',')[1]?.trim() || '',
        currencySymbol: config.currencySymbol || '€',
        currencyCode: config.currencyCode || 'EUR',
        isPaused: restaurant.isPaused || false,
      },
      eventPreferences: {
        categories: effectiveCatPrefs,
        radiusKm: maxRadiusKm,
        excludedKeywords,
      },
      weather: weatherData,
      weatherError,
      event: filteredLiveEvents[0] || null,
      events: filteredLiveEvents,
      eventsCount: filteredLiveEvents.length,
      opportunities: formattedOpportunities,
      offer: activeOffer,
      offers: restaurant.offers || [],
      engineReport,
    });
  } catch (err: any) {
    console.error('[API_SIGNALS_TODAY_FATAL_ERROR]', err);
    return error(`Erreur récupération signaux : ${err.message}`, 500);
  }
}
