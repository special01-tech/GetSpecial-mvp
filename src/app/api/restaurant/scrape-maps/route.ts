import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/server/lib/rate-limit';
import { validateSafeExternalUrl } from '@/server/lib/ssrf-guard';

export const dynamic = 'force-dynamic';

/**
 * Fonction de normalisation textuelle pour comparer les noms de restaurants sans casse ni accents.
 */
function normalizeString(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

interface PrepareContext {
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  country?: string;
  address?: string;
}

/**
 * Pré-résout l'URL Google Maps et extrait toutes les composantes de ciblage :
 * - Le nom propre du restaurant (ex: "Makoomba")
 * - Les coordonnées GPS précises de l'établissement (!3d / !4d / @ / center=)
 * - Le CID décimal extrait de l'identifiant hexadécimal (1s0x...:0x...)
 * - L'URL directe canonique par CID ou par place
 */
async function resolveAndPrepareMapsTarget(
  inputUrl: string,
  overrideName?: string,
  context?: PrepareContext
) {
  let resolvedUrl = (inputUrl || '').trim();
  let detectedName = overrideName?.trim() || '';
  let lat: number | null = context?.latitude != null ? Number(context.latitude) : null;
  let lng: number | null = context?.longitude != null ? Number(context.longitude) : null;
  let cid: string | null = null;
  let placeId: string | null = null;
  let pageTitle = '';
  const city = context?.city?.trim() || '';
  const country = (context?.country || 'FR').toUpperCase();
  const address = context?.address?.trim() || '';

  // 0. Si l'URL contient un paramètre de redirection Google "continue="
  const continueMatch = resolvedUrl.match(/continue=([^&]+)/);
  if (continueMatch && continueMatch[1]) {
    try {
      resolvedUrl = decodeURIComponent(continueMatch[1]);
    } catch {
      // ignore
    }
  }

  // 1. Résolution HTTP sécurisée (Anti-SSRF) uniquement sur domaines Google officiels
  const safeMapsCheck = validateSafeExternalUrl(resolvedUrl, ['goo.gl', 'maps.app.goo.gl', 'google.com', 'google.fr']);
  if (safeMapsCheck.safe && (resolvedUrl.includes('goo.gl') || resolvedUrl.includes('maps.app.goo.gl'))) {
    try {
      const res = await fetch(resolvedUrl, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
          'Cookie': 'SOCS=CAESEwgDEgk2MTc4ODU2ODIaAmZyIAEaBgiA_LyaBg; CONSENT=PENDING+999;',
          'Referer': 'https://www.google.com/',
        },
        redirect: 'follow',
      });

      if (res.url && !res.url.includes('consent.google.com')) {
        resolvedUrl = res.url;
      } else if (res.url && res.url.includes('consent.google.com')) {
        const cMatch = res.url.match(/continue=([^&]+)/);
        if (cMatch && cMatch[1]) {
          try {
            resolvedUrl = decodeURIComponent(cMatch[1]);
          } catch {}
        }
      }

      const html = await res.text();

      // Extraction du titre depuis le HTML
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      if (titleMatch) {
        pageTitle = titleMatch[1]
          .replace(/\s*-\s*Google Maps/i, '')
          .replace(/\s*·\s*Avis\s*·\s*Photos/i, '')
          .trim();
      }

      // Extraction d'une balise canonical ou og:url
      const ogUrlMatch = html.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i);
      if (ogUrlMatch && ogUrlMatch[1] && !ogUrlMatch[1].includes('consent.google')) {
        resolvedUrl = ogUrlMatch[1];
      }
    } catch (err: any) {
      console.warn('[RESOLVE_MAPS_TARGET_WARN]', err.message);
    }
  }

  // 2. Extraction du nom depuis /place/Nom+Du+Lieu/ ou query param
  if (!detectedName) {
    const placeMatch = resolvedUrl.match(/\/place\/([^/@?]+)/);
    if (placeMatch && placeMatch[1]) {
      detectedName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
    } else if (pageTitle && !pageTitle.toLowerCase().includes('google maps') && !pageTitle.toLowerCase().includes('avant d\'accéder')) {
      detectedName = pageTitle.split(/[-·–|]/)[0].trim();
    } else {
      const queryMatch = resolvedUrl.match(/[?&](?:q|query)=([^&]+)/);
      if (queryMatch && queryMatch[1]) {
        detectedName = decodeURIComponent(queryMatch[1].replace(/\+/g, ' ')).trim();
      }
    }
  }

  // 3. Extraction des coordonnées GPS
  if (lat == null || lng == null) {
    // Priorité absolue : !3d<lat>!4d<lng> (coordonnées directes du marqueur du lieu)
    const pinMatch = resolvedUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (pinMatch) {
      lat = parseFloat(pinMatch[1]);
      lng = parseFloat(pinMatch[2]);
    } else {
      // Centre caméra @lat,lng
      const camMatch = resolvedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (camMatch) {
        lat = parseFloat(camMatch[1]);
        lng = parseFloat(camMatch[2]);
      } else {
        // Paramètre center=lat,lng ou ll=lat,lng
        const centerMatch = resolvedUrl.match(/[?&](?:center|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (centerMatch) {
          lat = parseFloat(centerMatch[1]);
          lng = parseFloat(centerMatch[2]);
        }
      }
    }
  }

  // 4. Extraction du CID depuis le motif hexadécimal Google Maps (1s0x...:0x...)
  const hexMatch = resolvedUrl.match(/1s0x[0-9a-fA-F]+:(0x[0-9a-fA-F]+)/);
  if (hexMatch && hexMatch[1]) {
    try {
      cid = BigInt(hexMatch[1]).toString();
    } catch {
      // ignore
    }
  }

  // 5. Extraction du Feature ID Google
  const fidMatch = resolvedUrl.match(/16s(?:%2F|\/)(g(?:%2F|\/)[0-9a-zA-Z_]+)/);
  if (fidMatch && fidMatch[1]) {
    placeId = decodeURIComponent(fidMatch[1]);
  }

  // 6. Construction des URLs préparées
  const cidUrl = cid ? `https://maps.google.com/?cid=${cid}` : null;
  const canonicalPlaceUrl = detectedName && lat != null && lng != null
    ? `https://www.google.com/maps/search/${encodeURIComponent([detectedName, city].filter(Boolean).join(' '))}/@${lat},${lng},17z`
    : resolvedUrl;

  return {
    originalUrl: inputUrl,
    resolvedUrl,
    detectedName,
    pageTitle,
    coordinates: (lat != null && lng != null) ? { lat, lng } : null,
    cid,
    cidUrl,
    placeId,
    canonicalPlaceUrl,
    address,
    city,
    country,
  };
}

/**
 * Normalise et structure un lieu extrait par Apify selon les besoins stricts de GetSpecial
 */
function formatSingleRestaurant(item: any, fallbackTarget?: any) {
  const finalName = item.title || item.name || fallbackTarget?.detectedName || 'Restaurant';

  // 🔍 Extraction exhaustive des attributs de l'onglet "À propos" (additionalInfo)
  // Google Maps structure les services sous des catégories comme "Services disponibles"
  // sous forme de tableaux d'objets : [{ "Terrasse": true }, { "Livraison": true }]
  const detectedFeatures: string[] = [];
  const additional = item.additionalInfo;

  if (additional && typeof additional === 'object') {
    for (const [categoryName, catItems] of Object.entries(additional)) {
      if (Array.isArray(catItems)) {
        for (const f of catItems) {
          if (typeof f === 'string') {
            detectedFeatures.push(f);
          } else if (f && typeof f === 'object') {
            for (const [key, val] of Object.entries(f)) {
              if (val === true || val === 'true' || val === 1) {
                detectedFeatures.push(key);
              } else if (typeof val === 'string' && val.trim()) {
                detectedFeatures.push(`${key}: ${val}`);
              }
            }
          }
        }
      } else if (typeof catItems === 'string') {
        detectedFeatures.push(catItems);
      }
    }
  }

  // Tags ou attributs directs
  if (Array.isArray(item.attributes)) {
    for (const attr of item.attributes) {
      if (typeof attr === 'string') detectedFeatures.push(attr);
      else if (attr?.title) detectedFeatures.push(attr.title);
    }
  }

  const allFeaturesText = detectedFeatures.join(' ').toLowerCase();

  // Déduction précise de la terrasse
  const hasTerrace =
    Boolean(item.outdoorSeating) ||
    allFeaturesText.includes('terrasse') ||
    allFeaturesText.includes('extérieur') ||
    allFeaturesText.includes('places assises en extérieur') ||
    allFeaturesText.includes('outdoor seating') ||
    allFeaturesText.includes('patio');

  // Déduction précise de la livraison
  const hasDelivery =
    Boolean(item.delivery) ||
    allFeaturesText.includes('livraison') ||
    allFeaturesText.includes('delivery');

  // Détection de la ville et du pays
  const rawCity = item.city || (item.address ? item.address.split(',').slice(-2, -1)[0]?.trim() : null) || '';
  const rawCountry = item.countryCode || 'FR';

  // Normalisation des horaires d'ouverture
  let formattedHours: any = null;
  if (Array.isArray(item.openingHours)) {
    formattedHours = item.openingHours.map((h: any) => ({
      day: h.day || '',
      hours: h.hours || (h.isOpen ? 'Ouvert' : 'Fermé'),
    }));
  } else if (item.openingHours && typeof item.openingHours === 'object') {
    formattedHours = Object.entries(item.openingHours).map(([day, hours]) => ({
      day,
      hours: String(hours),
    }));
  }

  return {
    // 1. Identité & Type
    name: finalName,
    type: item.categoryName || (item.categories && item.categories[0]) || 'Restaurant',
    categories: item.categories || (item.categoryName ? [item.categoryName] : []),

    // 2. Géolocalisation & Contact
    address: item.address || item.street || fallbackTarget?.address || fallbackTarget?.resolvedUrl || '',
    city: rawCity || fallbackTarget?.city || '',
    postalCode: item.postalCode || null,
    country: (rawCountry || fallbackTarget?.country || 'FR').toUpperCase(),
    latitude: item.location?.lat != null ? Number(item.location.lat) : (fallbackTarget?.coordinates?.lat ?? null),
    longitude: item.location?.lng != null ? Number(item.location.lng) : (fallbackTarget?.coordinates?.lng ?? null),
    phone: item.phone || item.phoneUnformatted || null,
    website: item.website || null,
    googlePlaceId: item.placeId || item.cid || fallbackTarget?.cid || null,
    googleMapsUrl: item.url || fallbackTarget?.canonicalPlaceUrl || fallbackTarget?.resolvedUrl || null,

    // 3. Exploitation & Services réels
    openingHours: formattedHours,
    hasTerrace,
    hasDelivery,
    features: detectedFeatures,

    // 4. Média & Évaluation
    photoUrl: item.imageUrl || (item.images && item.images[0]) || null,
    rating: item.totalScore || item.rating || null,
    reviewsCount: item.reviewsCount || null,
    priceRange: item.price || null,
  };
}

/**
 * Recherche réelle sur Google Maps via Apify (Actor: compass/crawler-google-places).
 * Si aucun établissement n'est trouvé, renvoie un tableau vide [] (aucun faux fallback).
 */
async function searchPlacesViaApify(name: string, city: string, country = 'FR', customToken?: string): Promise<any[]> {
  const queryText = [name, city, country].filter(Boolean).join(' ').trim();
  if (!queryText) return [];

  const apifyToken = customToken || process.env.APIFY_API_TOKEN || process.env.APIFY_DEFAULT_TOKEN;
  if (!apifyToken) {
    console.warn('[MAPS_SEARCH_APIFY_WARN] Aucun jeton APIFY configuré dans .env.local.');
    return [];
  }

  const actor = 'compass~crawler-google-places';
  const apifyEndpoint = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${apifyToken}&timeout=60`;

  try {
    const apifyPayload = {
      searchStringsArray: [queryText],
      maxCrawledPlacesPerSearch: 3,
      language: 'fr',
      maxReviews: 0,
      maxImages: 1,
      skipClosedPlaces: false,
    };

    console.log(`[MAPS_SEARCH_APIFY] Recherche Google Maps lancée pour : "${queryText}"`);
    const res = await fetch(apifyEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apifyPayload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[MAPS_SEARCH_APIFY_HTTP_ERR] Code ${res.status}: ${errText.slice(0, 200)}`);
      return [];
    }

    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) {
      console.log(`[MAPS_SEARCH_APIFY] Aucun lieu Google Maps trouvé pour "${queryText}".`);
      return [];
    }

    return items.map((item: any, idx: number) => {
      const formatted = formatSingleRestaurant(item);
      return {
        id: item.placeId || item.cid || `apify_${idx}`,
        name: formatted.name,
        address: formatted.address || (formatted.city ? `${formatted.name}, ${formatted.city}` : formatted.name),
        city: formatted.city || city,
        country: formatted.country || country,
        postalCode: formatted.postalCode,
        latitude: formatted.latitude,
        longitude: formatted.longitude,
        rating: formatted.rating,
        reviewsCount: formatted.reviewsCount,
        photoUrl: formatted.photoUrl,
        cuisineType: formatted.type || 'Restaurant',
        googlePlaceId: formatted.googlePlaceId,
        mapsUrl: formatted.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatted.name)}`,
        phone: formatted.phone,
        openingHours: formatted.openingHours,
        hasTerrace: formatted.hasTerrace,
        hasDelivery: formatted.hasDelivery,
        features: formatted.features,
        rawScraped: formatted,
      };
    });
  } catch (err: any) {
    console.error('[MAPS_SEARCH_APIFY_EXCEPTION]', err?.message || err);
    return [];
  }
}

/**
 * Construit un objet restaurant GetSpecial standardisé depuis une occurrence candidate
 */
function buildDefaultRestaurantFromCandidate(c: any, fallbackCity = '', fallbackCountry = 'FR') {
  if (!c) return null;
  const name = c.name || 'Établissement';
  const city = c.city || fallbackCity;
  const country = (c.country || fallbackCountry).toUpperCase();
  const address = c.address || (city ? `${name}, ${city}` : name);
  return {
    name,
    type: 'Restaurant',
    categories: ['Restaurant'],
    address,
    city,
    postalCode: c.postalCode || null,
    country,
    latitude: c.latitude != null ? Number(c.latitude) : null,
    longitude: c.longitude != null ? Number(c.longitude) : null,
    phone: c.phone || null,
    website: c.website || null,
    googlePlaceId: c.googlePlaceId || c.id || null,
    googleMapsUrl: c.mapsUrl || null,
    openingHours: null,
    hasTerrace: false,
    hasDelivery: false,
    features: [],
    photoUrl: c.photoUrl || null,
    rating: c.rating ?? null,
    reviewsCount: c.reviewsCount ?? null,
    priceRange: null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, 'maps:scrape', 15, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ success: false, error: `Trop de requêtes. Réessayez dans ${rate.retryAfterSec}s.` }, { status: 429 });
    }
    const body = await req.json();
    const {
      action, // 'search' | 'scrape'
      url,
      restaurantName,
      city,
      country = 'FR',
      address,
      latitude,
      longitude,
      placeId,
      candidate,
      query,
      apifyToken: tokenFromRequest,
      actorId: customActorId,
    } = body;

    const resolvedCandidate = candidate && typeof candidate === 'object' ? candidate : null;
    const computedName = (resolvedCandidate?.name || restaurantName || query || '').trim();
    const computedCity = (resolvedCandidate?.city || city || '').trim();
    const computedCountry = (resolvedCandidate?.country || country || 'FR').toUpperCase();
    const resolvedAddress = (resolvedCandidate?.address || address || '').trim();
    const resolvedLat = resolvedCandidate?.latitude ?? latitude ?? null;
    const resolvedLng = resolvedCandidate?.longitude ?? longitude ?? null;
    const resolvedPlaceId = resolvedCandidate?.googlePlaceId || resolvedCandidate?.id || placeId || null;
    const targetUrl = (resolvedCandidate?.mapsUrl || url || '').trim();
    const hasUrl = typeof targetUrl === 'string' && targetUrl.length > 0;

    // =========================================================================
    // ÉTAPE 1 : RECHERCHE LÉGÈRE (DISCOVERY) — RAPIDE & SANS COÛT DE SCRAPING
    // =========================================================================
    if (action === 'search' || (!hasUrl && (computedName || computedCity))) {
      console.log(`[MAPS_SEARCH_LIGHT] Recherche rapide des occurrences pour : "${computedName}" (${computedCity})`);
      const placesFound = await searchPlacesViaApify(computedName, computedCity, computedCountry, tokenFromRequest);

      const topCandidate = placesFound[0] || null;
      const defaultRestaurant = topCandidate
        ? buildDefaultRestaurantFromCandidate(topCandidate, computedCity, computedCountry)
        : null;

      const searchPayload = {
        action: 'search',
        query: `${computedName} ${computedCity}`.trim(),
        totalFound: placesFound.length,
        candidates: placesFound,
        candidate: topCandidate,
        restaurant: defaultRestaurant,
        payload: defaultRestaurant, // alias standard pour éviter que le payload soit vide {}
        targetPrepared: topCandidate ? {
          detectedName: topCandidate.name,
          coordinates: topCandidate.latitude && topCandidate.longitude ? { lat: topCandidate.latitude, lng: topCandidate.longitude } : null,
          resolvedUrl: topCandidate.mapsUrl,
          cid: topCandidate.googlePlaceId || null,
          address: topCandidate.address,
          city: topCandidate.city,
          country: topCandidate.country,
        } : null,
        apifyPayloadSent: {
          searchQuery: `${computedName} ${computedCity}`.trim(),
          maxCrawledPlacesPerSearch: 1,
          placesFoundCount: placesFound.length,
        },
      };

      return NextResponse.json({
        success: true,
        ...searchPayload,
        data: searchPayload,
      });
    }

    // =========================================================================
    // ÉTAPE 2 : SCRAPING CIBLÉ APIFY SUR 1 SEULE FICHE VALIDÉE PAR LE USER
    // =========================================================================
    if (resolvedCandidate?.rawScraped || (resolvedCandidate?.openingHours && resolvedCandidate?.phone)) {
      const data = resolvedCandidate.rawScraped || resolvedCandidate;
      return NextResponse.json({
        success: true,
        data,
        restaurant: data,
        payload: data,
        message: 'Données Google Maps récupérées instantanément depuis la sélection.',
      });
    }

    if (!hasUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Veuillez fournir une URL Google Maps valide à scraper ("url") ou un candidat sélectionné.',
        },
        { status: 400 }
      );
    }

    const apifyToken = tokenFromRequest || process.env.APIFY_API_TOKEN || process.env.APIFY_DEFAULT_TOKEN;

    console.log(`[MAPS_SCRAPE_SINGLE] 1. Préparation de la fiche unique : "${targetUrl}" (Nom : "${computedName || 'aucun'}")`);
    const target = await resolveAndPrepareMapsTarget(targetUrl, computedName, {
      latitude: resolvedLat != null ? Number(resolvedLat) : null,
      longitude: resolvedLng != null ? Number(resolvedLng) : null,
      city: computedCity,
      country: computedCountry,
      address: resolvedAddress,
    });

    let apifyData: any = null;
    let extractionSource = 'local-pipeline';
    let matchWarning: string | null = null;
    let apifyPayloadSent: any = null;

    if (apifyToken) {
      try {
        const actor = process.env.NODE_ENV === 'production' ? 'compass~crawler-google-places' : (customActorId ? customActorId.replace('/', '~') : 'compass~crawler-google-places');
        const apifyEndpoint = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${apifyToken}&timeout=120`;

        const directUrl = target.canonicalPlaceUrl || target.resolvedUrl || targetUrl;

        // ⚡ SCRAPING D'UNE SEULE FICHE : maxCrawledPlacesPerSearch = 1 (COÛT & TEMPS MINIMAUX)
        const apifyPayload: any = {
          startUrls: [{ url: directUrl }],
          maxCrawledPlacesPerSearch: 1,
          language: 'fr',
          maxReviews: 0,
          maxImages: 1,
          skipClosedPlaces: false,
        };

        const searchTerms = [target.detectedName, computedCity].filter(Boolean).join(' ');
        if (searchTerms) {
          apifyPayload.searchStringsArray = [searchTerms];
        }

        if (target.coordinates?.lat && target.coordinates?.lng) {
          apifyPayload.customGeolocation = {
            latitude: target.coordinates.lat,
            longitude: target.coordinates.lng,
            radiusKm: 2,
          };
        }

        apifyPayloadSent = apifyPayload;

        console.log(`[MAPS_SCRAPE_OPTIMIZED] Scraping unique envoyé à Apify :`, JSON.stringify({
          actor,
          targetUrl: directUrl,
          searchTerms,
          maxPlaces: 1,
          maxReviews: 0,
          maxImages: 1,
        }));

        const apifyResponse = await fetch(apifyEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apifyPayload),
        });

        if (apifyResponse.ok) {
          const items = await apifyResponse.json();
          if (Array.isArray(items) && items.length > 0) {
            extractionSource = 'apify';
            apifyData = items[0];
            console.log(`[MAPS_SCRAPE] ✅ Fiche unique extraite : "${apifyData.title || apifyData.name}"`);
          } else {
            console.warn('[MAPS_SCRAPE_APIFY] Dataset vide retourné par Apify :', JSON.stringify(items));
            matchWarning = 'Apify n’a retourné aucun détail supplémentaire pour cette URL. Données initiales conservées.';
          }
        } else {
          const errText = await apifyResponse.text();
          console.warn(`[MAPS_SCRAPE_APIFY_ERR] Statut ${apifyResponse.status}: ${errText.slice(0, 250)}`);
          matchWarning = `Note Apify (${apifyResponse.status}) : fiche basée sur les coordonnées exactes.`;
        }
      } catch (err: any) {
        console.warn('[MAPS_SCRAPE_APIFY_EXCEPTION]', err.message);
        matchWarning = `Connexion Apify : fiche basée sur les coordonnées exactes (${err.message}).`;
      }
    }

    // Fiche finale GetSpecial — Aucune valeur factice, conservation des vraies données candidates
    let essentialRestaurant: any = null;
    if (apifyData) {
      essentialRestaurant = formatSingleRestaurant(apifyData, target);
      if (!essentialRestaurant.address && (target.address || resolvedAddress)) {
        essentialRestaurant.address = target.address || resolvedAddress;
      }
      if (!essentialRestaurant.city && (target.city || computedCity)) {
        essentialRestaurant.city = target.city || computedCity;
      }
      if (!essentialRestaurant.country && (target.country || computedCountry)) {
        essentialRestaurant.country = target.country || computedCountry;
      }
      if (essentialRestaurant.latitude == null && (target.coordinates?.lat ?? resolvedLat) != null) {
        essentialRestaurant.latitude = target.coordinates?.lat ?? resolvedLat;
      }
      if (essentialRestaurant.longitude == null && (target.coordinates?.lng ?? resolvedLng) != null) {
        essentialRestaurant.longitude = target.coordinates?.lng ?? resolvedLng;
      }
    } else {
      const fallbackName = target?.detectedName || computedName || 'Établissement';
      essentialRestaurant = {
        name: fallbackName,
        type: 'Restaurant',
        categories: ['Restaurant'],
        address: target.address || resolvedAddress || (computedCity ? `${fallbackName}, ${computedCity}` : fallbackName),
        city: target.city || computedCity,
        postalCode: resolvedCandidate?.postalCode || null,
        country: target.country || computedCountry,
        latitude: target?.coordinates?.lat || resolvedLat,
        longitude: target?.coordinates?.lng || resolvedLng,
        phone: resolvedCandidate?.phone || null,
        website: resolvedCandidate?.website || null,
        googlePlaceId: resolvedPlaceId || target?.cid || target?.placeId || null,
        googleMapsUrl: target?.canonicalPlaceUrl || target?.resolvedUrl || targetUrl,
        openingHours: null,
        hasTerrace: false,
        hasDelivery: false,
        features: [],
        photoUrl: resolvedCandidate?.photoUrl || null,
        rating: resolvedCandidate?.rating ?? null,
        reviewsCount: resolvedCandidate?.reviewsCount ?? null,
        priceRange: null,
      };
    }

    const scrapePayload = {
      action: 'scrape',
      extractionSource,
      targetPrepared: target,
      restaurant: essentialRestaurant,
      payload: essentialRestaurant, // alias standard pour éviter que le payload soit vide {}
      apifyPayloadSent: apifyPayloadSent || {
        startUrls: [{ url: target.canonicalPlaceUrl || target.resolvedUrl || targetUrl }],
        maxCrawledPlacesPerSearch: 1,
        searchQuery: [target.detectedName, computedCity].filter(Boolean).join(' '),
      },
      apifyRaw: apifyData,
      warning: matchWarning,
    };

    return NextResponse.json({
      success: true,
      ...scrapePayload,
      data: scrapePayload,
    });
  } catch (error: any) {
    console.error('[MAPS_SCRAPE_API_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
