import { NormalizedSignal } from './signal.types';
import { getCountryConfig } from '@/server/lib/country-config';

/**
 * Calcul déterministe de la distance à vol d'oiseau (Formule Haversine) en mètres
 */
function calculateHaversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Rayon de la Terre en mètres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Mappe la taxonomie officielle Ticketmaster vers nos catégories canoniques
 */
function mapTicketmasterCategory(ev: any): 'sport' | 'concert' | 'arts' | 'family' | 'other' {
  const segment = (ev.classifications?.[0]?.segment?.name || '').toLowerCase();
  const genre = (ev.classifications?.[0]?.genre?.name || '').toLowerCase();
  const subGenre = (ev.classifications?.[0]?.subGenre?.name || '').toLowerCase();
  const name = (ev.name || '').toLowerCase();

  if (
    segment.includes('sport') ||
    genre.includes('sport') ||
    genre.includes('football') ||
    genre.includes('soccer') ||
    genre.includes('basketball') ||
    genre.includes('baseball') ||
    genre.includes('hockey') ||
    genre.includes('rugby') ||
    name.includes(' vs ') ||
    name.includes(' match ')
  ) {
    return 'sport';
  }

  if (
    segment.includes('music') ||
    genre.includes('rock') ||
    genre.includes('pop') ||
    genre.includes('jazz') ||
    genre.includes('hip-hop') ||
    genre.includes('rap') ||
    genre.includes('concert')
  ) {
    return 'concert';
  }

  if (
    segment.includes('arts') ||
    segment.includes('theatre') ||
    genre.includes('comedy') ||
    genre.includes('humour') ||
    genre.includes('spectacle') ||
    genre.includes('dance')
  ) {
    return 'arts';
  }

  if (segment.includes('family') || genre.includes('children') || genre.includes('animation')) {
    return 'family';
  }

  return 'other';
}

/**
 * Sélectionne rigoureusement une SEULE image nette au format paysage optimal (16:9, ~600-1100px).
 * Évite de télécharger les images gigantesques de 2500px ou les miniatures inexploitables.
 */
function selectOptimalEventImage(images: any[]): string | undefined {
  if (!Array.isArray(images) || images.length === 0) return undefined;

  // 1. Format idéal 16:9 haute résolution web (entre 500 et 1200 px)
  const ideal169 = images.find(
    (img) => img.ratio === '16_9' && img.width >= 500 && img.width <= 1200 && !img.fallback
  );
  if (ideal169?.url) return ideal169.url;

  // 2. N'importe quel 16:9 utilisable
  const any169 = images.find((img) => img.ratio === '16_9' && img.width >= 350);
  if (any169?.url) return any169.url;

  // 3. Format photo 3:2 de qualité
  const ideal32 = images.find((img) => img.ratio === '3_2' && img.width >= 450 && img.width <= 1200);
  if (ideal32?.url) return ideal32.url;

  // 4. Repli sur première image exploitable (> 250px)
  const usable = images.find((img) => img.width >= 250);
  return usable?.url || images[0]?.url;
}

interface TicketmasterCacheEntry {
  timestamp: number;
  signals: NormalizedSignal[];
}

export class TicketmasterCollector {
  private cache = new Map<string, TicketmasterCacheEntry>();
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes de cache

  private get apiKey(): string | undefined {
    return (process.env.TICKETMASTER_API_KEY || '').replace(/^["']|["']$/g, '').trim();
  }

  /**
   * Collecte les événements réels dans une fenêtre temporelle immédiate (maintenant -> J+3)
   * avec filtres stricts de classification et sélection d'image unique optimisée.
   */
  async collect(
    lat: number,
    lon: number,
    radiusKm = 15, // Rayon pertinent pour l'agglomération (15 km)
    country = 'US',
    targetDate: Date = new Date(),
    cityName?: string
  ): Promise<NormalizedSignal[]> {
    if (!this.apiKey || this.apiKey.includes('...') || this.apiKey.trim() === '') {
      console.warn('[TICKETMASTER_COLLECTOR] TICKETMASTER_API_KEY non configurée. Aucun événement externe.');
      return [];
    }

    const cleanCountry = typeof country === 'string' ? country.toUpperCase().trim() : 'US';
    const cleanCity = (cityName || '').trim();
    const dateKey = targetDate.toISOString().slice(0, 10);
    const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}_${cleanCountry}_${radiusKm}_${cleanCity}_${dateKey}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.signals;
    }

    const config = getCountryConfig(cleanCountry);
    const geoPoint = `${lat.toFixed(4)},${lon.toFixed(4)}`;

    try {

    // Fenêtre temporelle : aujourd'hui -> +30 jours (matchs, concerts et spectacles du mois)
    const startIso = targetDate.toISOString().replace(/\.\d{3}Z$/, 'Z');
    const endDate = new Date(targetDate.getTime() + 30 * 24 * 3600 * 1000);
    const endIso = endDate.toISOString().replace(/\.\d{3}Z$/, 'Z');

    // Ville réelle de l'établissement (jamais écrasée artificiellement sur Paris)
    const targetCity = cleanCity ? cleanCity.trim() : '';

    const radius = config.distanceUnit === 'miles' ? Math.max(5, Math.round(radiusKm * 0.621371)) : Math.max(10, radiusKm);
    const unit = config.distanceUnit; // 'miles' for US/UK, 'km' for others

    // URLs de requêtes :
    // 1. Priorité 1 : Par coordonnées GPS réelles du restaurant (rayon local précis)
    const primaryUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${this.apiKey}&latlong=${geoPoint}&radius=${radius}&unit=${unit}&countryCode=${cleanCountry}&startDateTime=${startIso}&endDateTime=${endIso}&size=10&sort=date,asc`;
    // 2. Repli : Par nom de ville réel du restaurant (prochains événements confirmés de la ville)
    const fallbackUrl = targetCity
      ? `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${this.apiKey}&city=${encodeURIComponent(targetCity)}&countryCode=${cleanCountry}&size=12&sort=date,asc`
      : null;

    let rawEvents: any[] = [];

    // Tentative 1 : Recherche géographique centrée sur le restaurant (priorité universelle)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(primaryUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        rawEvents = data?._embedded?.events || [];
      } else {
        const txt = await res.text();
        console.warn('[TICKETMASTER_COLLECTOR] Latlong returned HTTP', res.status, txt.slice(0, 150));
      }
    } catch (err: any) {
      console.warn('[TICKETMASTER_COLLECTOR] Erreur requête latlong :', err?.message);
    }

    // Tentative 2 : Repli par ville réelle du restaurant si la recherche GPS n'a rien trouvé
    if (rawEvents.length === 0 && fallbackUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(fallbackUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          rawEvents = data?._embedded?.events || [];
        } else {
          const txt = await res.text();
          console.warn('[TICKETMASTER_COLLECTOR] City returned HTTP', res.status, txt.slice(0, 150));
        }
      } catch (err: any) {
        console.warn('[TICKETMASTER_COLLECTOR] Erreur requête par ville :', err?.message);
      }
    }

    // Filtrage strict : éliminer les événements annulés ou sans date claire
    const validEvents = rawEvents.filter((ev: any) => {
      const statusCode = ev.dates?.status?.code?.toLowerCase();
      if (statusCode === 'cancelled') {
        return false;
      }
      const hasStart = Boolean(ev.dates?.start?.dateTime || ev.dates?.start?.localDate);
      if (!hasStart) {
        return false;
      }
      return true;
    });

    interface EventOccurrence {
      ev: any;
      venue: string;
      distanceMeters: number;
      startIso: string;
      localDate: string;
      localTime: string;
      eventTimezone: string;
    }

    const groups = new Map<string, EventOccurrence[]>();

    for (const ev of validEvents) {
      const venue = ev._embedded?.venues?.[0]?.name || (config.language === 'fr' ? 'À proximité' : 'Nearby');
      const venueLat = parseFloat(ev._embedded?.venues?.[0]?.location?.latitude);
      const venueLon = parseFloat(ev._embedded?.venues?.[0]?.location?.longitude);

      let distanceMeters: number;
      const hasValidCoords = !isNaN(venueLat) && !isNaN(venueLon) && (Math.abs(venueLat) > 0.1 || Math.abs(venueLon) > 0.1);

      if (hasValidCoords) {
        distanceMeters = calculateHaversineDistanceMeters(lat, lon, venueLat, venueLon);
        if (distanceMeters > Math.max(radiusKm * 1000 * 2, 30000)) {
          continue;
        }
      } else {
        distanceMeters = Math.round(Math.min(radiusKm, 5) * 1000);
      }

      const eventTimezone = ev.dates?.timezone || config.timezone || 'UTC';
      const localDate = ev.dates?.start?.localDate;
      const localTime = ev.dates?.start?.localTime || '19:00:00';
      const dateTime = ev.dates?.start?.dateTime;

      let startIso: string;
      if (dateTime) {
        startIso = new Date(dateTime).toISOString();
      } else if (localDate) {
        startIso = new Date(`${localDate}T${localTime}Z`).toISOString();
      } else {
        continue;
      }

      // Clé canonique pour regrouper les répétitions (attraction principale ou nom d'événement + lieu)
      const canonicalName = (ev._embedded?.attractions?.[0]?.name || ev.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const canonicalVenue = venue.toLowerCase().replace(/[^a-z0-9]/g, '');
      const groupKey = `${canonicalName}___${canonicalVenue}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push({
        ev,
        venue,
        distanceMeters,
        startIso,
        localDate: localDate || startIso.slice(0, 10),
        localTime,
        eventTimezone,
      });
    }

    const signals: NormalizedSignal[] = [];

    for (const [groupKey, items] of groups.entries()) {
      // Trier les occurrences chronologiquement
      items.sort((a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime());

      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const ev = firstItem.ev;
      const venue = firstItem.venue;
      const distanceMeters = firstItem.distanceMeters;
      const eventTimezone = firstItem.eventTimezone;
      const category = mapTicketmasterCategory(ev);

      const isMultiDay = items.length > 1 && firstItem.localDate !== lastItem.localDate;
      const isMultiSessionSameDay = items.length > 1 && !isMultiDay;

      let dateStr: string;
      let timeStr: string;

      try {
        const firstDateObj = new Date(firstItem.startIso);
        const lastDateObj = new Date(lastItem.startIso);

        const firstDayFormatted = new Intl.DateTimeFormat(config.locale, {
          timeZone: eventTimezone,
          day: 'numeric',
          month: 'short',
        }).format(firstDateObj);

        const lastDayFormatted = new Intl.DateTimeFormat(config.locale, {
          timeZone: eventTimezone,
          day: 'numeric',
          month: 'short',
        }).format(lastDateObj);

        const firstTimeFormatted = new Intl.DateTimeFormat(config.locale, {
          timeZone: eventTimezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(firstDateObj);

        if (isMultiDay) {
          dateStr = config.language === 'fr' 
            ? `Du ${firstDayFormatted} au ${lastDayFormatted}` 
            : `${firstDayFormatted} - ${lastDayFormatted}`;
          timeStr = config.language === 'fr'
            ? `Du ${firstDayFormatted} au ${lastDayFormatted}`
            : `${firstDayFormatted} - ${lastDayFormatted}`;
        } else if (isMultiSessionSameDay) {
          dateStr = new Intl.DateTimeFormat(config.locale, {
            timeZone: eventTimezone,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }).format(firstDateObj);
          timeStr = config.language === 'fr'
            ? `${items.length} séances (dès ${firstTimeFormatted})`
            : `${items.length} sessions (from ${firstTimeFormatted})`;
        } else {
          dateStr = new Intl.DateTimeFormat(config.locale, {
            timeZone: eventTimezone,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }).format(firstDateObj);
          timeStr = firstTimeFormatted;
        }
      } catch {
        dateStr = firstItem.localDate;
        timeStr = firstItem.localTime.slice(0, 5);
      }

      let endsIsoString: string;
      if (lastItem.ev.dates?.end?.dateTime) {
        endsIsoString = new Date(lastItem.ev.dates.end.dateTime).toISOString();
      } else {
        const durationHours = category === 'sport' ? 3 : category === 'concert' ? 3.5 : 3;
        endsIsoString = new Date(new Date(lastItem.startIso).getTime() + durationHours * 3600 * 1000).toISOString();
      }

      const categoryFr = category === 'sport' ? 'Sport / Match' : category === 'concert' ? 'Concert' : category === 'arts' ? 'Spectacle' : 'Événement local';
      const multiDayBadge = isMultiDay ? (config.language === 'fr' ? ' (Multi-jours)' : ' (Multi-day)') : '';
      const title = config.language === 'fr' ? `${categoryFr} : ${ev.name}${multiDayBadge}` : `${category.toUpperCase()}: ${ev.name}${multiDayBadge}`;
      const distanceStr = distanceMeters < 1000 ? `${distanceMeters} m` : `${(distanceMeters / 1000).toFixed(1)} km`;

      const summary = isMultiDay
        ? (config.language === 'fr'
            ? `${ev.name} se déroule sur plusieurs dates (${dateStr}) au ${venue} (à ${distanceStr}). Forte affluence continue attendue.`
            : `${ev.name} runs across multiple dates (${dateStr}) at ${venue} (${distanceStr} away). High continuous dining demand opportunity.`)
        : (config.language === 'fr'
            ? `${ev.name} prévu le ${dateStr} à ${timeStr} (${venue}, à ${distanceStr}). Forte opportunité d'affluence avant/après événement.`
            : `${ev.name} scheduled for ${dateStr} at ${timeStr} (${venue}, ${distanceStr} away). High dining potential before/after event.`);

      const imageUrl = selectOptimalEventImage(ev.images);

      signals.push({
        externalId: `tm_${ev.id}`,
        type: 'event',
        category,
        source: 'ticketmaster',
        intensity: category === 'sport' ? 0.9 : 0.75,
        timestamp: firstItem.startIso,
        startsAt: firstItem.startIso,
        endsAt: endsIsoString,
        distanceMeters,
        isFallback: false,
        title,
        summary,
        data: {
          title,
          summary,
          category,
          venue,
          url: ev.url,
          imageUrl,
          distanceMeters,
          startsAt: firstItem.startIso,
          endsAt: endsIsoString,
          localDate: firstItem.localDate,
          localTime: timeStr,
          isMultiDay,
          totalSessions: items.length,
          timezone: eventTimezone,
          raw: {
            id: ev.id,
            name: ev.name,
            url: ev.url,
            imageUrl,
            venue,
            category,
            distanceMeters,
            country: cleanCountry,
            localDate: firstItem.localDate,
            localTime: timeStr,
            isMultiDay,
            totalSessions: items.length,
            timezone: eventTimezone,
          },
        },
        rawPayload: { id: ev.id, name: ev.name, url: ev.url, imageUrl, venue, distanceMeters, country: cleanCountry, isMultiDay, totalSessions: items.length },
      });
    }

      // Sauvegarde dans le cache mémoire si des signaux réels ont été trouvés
      if (signals.length > 0) {
        this.cache.set(cacheKey, { timestamp: now, signals });
      }
      return signals;
    } catch (err: any) {
      console.error('[TICKETMASTER_COLLECTOR] Erreur lors de la collecte Ticketmaster :', err?.message || err);
      return [];
    }
  }
}

export const ticketmasterCollector = new TicketmasterCollector();

