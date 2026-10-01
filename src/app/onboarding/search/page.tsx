'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, MapPin, ArrowRight, Utensils, Phone, Globe, Info, Sparkles, Navigation, Loader2 } from 'lucide-react';
import Logo from '@/components/ui/Logo/Logo';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import RestaurantVisual from '@/components/ui/RestaurantVisual/RestaurantVisual';
import { RestaurantSearchResult } from '@/services/restaurant-search/restaurant-search.types';
import styles from './onboarding-search.module.css';

const CITY_COORDINATES: Record<string, { lat: number; lon: number; country: string }> = {
  austin: { lat: 30.2672, lon: -97.7431, country: 'US' },
  'new york': { lat: 40.7128, lon: -74.006, country: 'US' },
  nyc: { lat: 40.7128, lon: -74.006, country: 'US' },
  'los angeles': { lat: 34.0522, lon: -118.2437, country: 'US' },
  chicago: { lat: 41.8781, lon: -87.6298, country: 'US' },
  miami: { lat: 25.7617, lon: -80.1918, country: 'US' },
  houston: { lat: 29.7604, lon: -95.3698, country: 'US' },
  dallas: { lat: 32.7767, lon: -96.797, country: 'US' },
  paris: { lat: 48.8566, lon: 2.3522, country: 'FR' },
  lyon: { lat: 45.764, lon: 4.8357, country: 'FR' },
  marseille: { lat: 43.2965, lon: 5.3698, country: 'FR' },
  bordeaux: { lat: 44.8378, lon: -0.5792, country: 'FR' },
  london: { lat: 51.5074, lon: -0.1278, country: 'GB' },
  manchester: { lat: 53.4808, lon: -2.2426, country: 'GB' },
  montreal: { lat: 45.5017, lon: -73.5673, country: 'CA' },
  toronto: { lat: 43.6532, lon: -79.3832, country: 'CA' },
  berlin: { lat: 52.52, lon: 13.405, country: 'DE' },
  madrid: { lat: 40.4168, lon: -3.7038, country: 'ES' },
  barcelona: { lat: 41.3879, lon: 2.1699, country: 'ES' },
  rome: { lat: 41.9028, lon: 12.4964, country: 'IT' },
  brussels: { lat: 50.8503, lon: 4.3517, country: 'BE' },
  geneva: { lat: 46.2044, lon: 6.1432, country: 'CH' },
};

function getCategoryPhoto(cuisine: string): string {
  const lower = cuisine.toLowerCase();
  if (lower.includes('pizza') || lower.includes('ital')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80';
  }
  if (lower.includes('burger') || lower.includes('grill') || lower.includes('bbq')) {
    return 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80';
  }
  if (lower.includes('seafood') || lower.includes('poisson') || lower.includes('mer')) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
  }
  if (lower.includes('bistro') || lower.includes('café') || lower.includes('french')) {
    return 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
}

export default function OnboardingRestaurantProfilePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [detectedGpsInfo, setDetectedGpsInfo] = useState<string | null>(null);
  const [customCoords, setCustomCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Restaurer les informations déjà enregistrées si l'utilisateur revient en arrière
  useEffect(() => {
    try {
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/search');
      const stored = localStorage.getItem('getspecial_selected_restaurant');
      if (stored) {
        const parsed: RestaurantSearchResult = JSON.parse(stored);
        if (parsed.name) setName(parsed.name);
        if (parsed.cuisineType) setCuisineType(parsed.cuisineType);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.city) setCity(parsed.city);
        if (parsed.postalCode) setPostalCode(parsed.postalCode);
        if (parsed.country) setCountry(parsed.country);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.latitude && parsed.longitude) {
          setCustomCoords({ lat: parsed.latitude, lon: parsed.longitude });
          setDetectedGpsInfo(`Coordonnées : ${parsed.latitude.toFixed(4)}, ${parsed.longitude.toFixed(4)}`);
        }
      } else {
        // Préremplir par défaut avec une structure de départ américaine élégante
        setName('The Brass Pelican');
        setCuisineType('American Bistro & Seafood');
        setAddress('412 Congress Ave');
        setCity('Austin');
        setPostalCode('78701');
        setCountry('US');
        setPhone('+1 (512) 472-8800');
      }
    } catch {
      // Ignorer
    }
  }, []);

  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrorMsg("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCustomCoords({ lat, lon });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
            { headers: { 'User-Agent': 'GetSpecial-App/1.0 (contact@getspecial.dev)' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const street = [addr.house_number, addr.road].filter(Boolean).join(' ') || data.name || address;
            const detCity = addr.city || addr.town || addr.village || addr.municipality || city;
            const detPost = addr.postcode || postalCode;
            const detCountry = (addr.country_code || country).toUpperCase();

            if (street) setAddress(street);
            if (detCity) setCity(detCity);
            if (detPost) setPostalCode(detPost);
            if (detCountry) setCountry(detCountry);

            setDetectedGpsInfo(`GPS détecté : ${lat.toFixed(4)}, ${lon.toFixed(4)} (${detCity})`);
          } else {
            setDetectedGpsInfo(`GPS détecté : ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          }
        } catch {
          setDetectedGpsInfo(`GPS détecté : ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setErrorMsg("Accès GPS non disponible ou refusé. Vous pouvez saisir votre adresse manuellement ci-dessous.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('Veuillez renseigner le nom de votre restaurant.');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('Veuillez renseigner la ville de votre établissement.');
      return;
    }
    if (!address.trim()) {
      setErrorMsg("Veuillez renseigner l'adresse de votre établissement.");
      return;
    }

    setErrorMsg(null);

    // Détermination des coordonnées pour la météo et les événements dynamiques
    const cityKey = city.trim().toLowerCase();
    const cityCoord = CITY_COORDINATES[cityKey] || {
      lat: country === 'FR' ? 48.8566 : country === 'GB' ? 51.5074 : 30.2672,
      lon: country === 'FR' ? 2.3522 : country === 'GB' ? -0.1278 : -97.7431,
      country: country || 'US',
    };

    let finalLat = customCoords ? customCoords.lat : cityCoord.lat;
    let finalLon = customCoords ? customCoords.lon : cityCoord.lon;
    let finalCountry = country || 'US';

    if (!customCoords) {
      try {
        const searchQuery = `${address.trim()} ${city.trim()}`;
        const searchRes = await fetch(
          `/api/restaurants/search?name=${encodeURIComponent(name.trim())}&city=${encodeURIComponent(searchQuery)}`
        );
        if (searchRes.ok) {
          const json = await searchRes.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const topMatch = json.data[0];
            if (topMatch.latitude && topMatch.longitude) {
              finalLat = topMatch.latitude;
              finalLon = topMatch.longitude;
              if (topMatch.country) finalCountry = topMatch.country;
            }
          }
        }
      } catch (geoErr) {
        console.warn('[GEOCODING_CLIENT_FALLBACK]', geoErr);
      }
    }

    const restaurantData: RestaurantSearchResult = {
      id: `rest_user_${Date.now()}`,
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      postalCode: postalCode.trim() || (country === 'US' ? '78701' : '75001'),
      country: finalCountry.toUpperCase(),
      latitude: finalLat,
      longitude: finalLon,
      rating: 4.8,
      reviewsCount: 120,
      cuisineType: cuisineType.trim() || 'Restaurant & Bar',
      phone: phone.trim() || undefined,
      openingHours: '11:30 - 23:00 • Lun - Dim',
      isOpenNow: true,
      photoUrl: getCategoryPhoto(cuisineType),
      photoGallery: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
      ],
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_selected_restaurant', JSON.stringify(restaurantData));
      localStorage.setItem('getspecial_restaurant_id', restaurantData.id);
      localStorage.setItem('getspecial_onboarding_step', '/onboarding/confirm');
    }

    router.push('/onboarding/confirm');
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Logo size="md" showTagline={false} />
          <div className={styles.stepIndicator}>
            <span className={styles.stepDotActive} />
            <span className={styles.stepDot} />
            <span className={styles.stepDot} />
          </div>
        </header>

        <main className={styles.mainContent}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Enregistrez votre établissement</h1>
            <p className={styles.subtitle}>
              Configurez votre profil de restaurant. GetSpecial connectera automatiquement en direct la météo locale, les événements et le calendrier.
            </p>
          </div>

          <div className={styles.infoBanner}>
            <Info size={16} className={styles.infoBannerIcon} />
            <span>
              <strong>Profil propriétaire :</strong> Vos informations sont créées et gérées par vous. Les seules données provenant d&apos;API externes sont les signaux contextuels en direct (météo, événements, jours fériés, analytics).
            </span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Nom du restaurant */}
            <div className={styles.fieldGroup}>
              <label htmlFor="restaurantName" className={styles.label}>
                Nom du restaurant *
              </label>
              <div className={styles.inputWrapper}>
                <Store size={18} className={styles.inputIcon} />
                <input
                  id="restaurantName"
                  type="text"
                  placeholder="Ex. The Brass Pelican, Le Bistro Parisien..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            {/* Type de cuisine / Spécialité */}
            <div className={styles.fieldGroup}>
              <label htmlFor="cuisineType" className={styles.label}>
                Type de cuisine & spécialités
              </label>
              <div className={styles.inputWrapper}>
                <Utensils size={18} className={styles.inputIcon} />
                <input
                  id="cuisineType"
                  type="text"
                  placeholder="Ex. American Bistro & Seafood, Pizzeria & Grill..."
                  value={cuisineType}
                  onChange={(e) => setCuisineType(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            {/* Adresse */}
            <div className={styles.fieldGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="address" className={styles.label}>
                  Adresse de l&apos;établissement *
                </label>
                {detectedGpsInfo && (
                  <span className={styles.gpsSuccessBadge}>
                    ✓ {detectedGpsInfo}
                  </span>
                )}
              </div>
              <div className={styles.inputWrapper}>
                <MapPin size={18} className={styles.inputIcon} />
                <input
                  id="address"
                  type="text"
                  placeholder="Ex. 412 Congress Ave, 15 Rue de Rivoli..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className={styles.gpsDetectBtn}
                title="Utiliser ma position GPS"
              >
                {isLocating ? (
                  <>
                    <Loader2 size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Détection GPS en cours...</span>
                  </>
                ) : (
                  <>
                    <Navigation size={13} />
                    <span>📍 Détecter ma position GPS actuelle</span>
                  </>
                )}
              </button>
            </div>

            {/* Ville & Code Postal */}
            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="city" className={styles.label}>
                  Ville *
                </label>
                <div className={styles.inputWrapper}>
                  <MapPin size={18} className={styles.inputIcon} />
                  <input
                    id="city"
                    type="text"
                    placeholder="Ex. Austin, Paris..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="postalCode" className={styles.label}>
                  Code Postal
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="postalCode"
                    type="text"
                    placeholder="Ex. 78701, 75001..."
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className={styles.input}
                    style={{ paddingLeft: '16px' }}
                  />
                </div>
              </div>
            </div>

            {/* Pays & Téléphone */}
            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="country" className={styles.label}>
                  Pays
                </label>
                <div className={styles.inputWrapper}>
                  <Globe size={18} className={styles.inputIcon} />
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={styles.select}
                  >
                    <option value="US">🇺🇸 United States</option>
                    <option value="FR">🇫🇷 France</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="CA">🇨🇦 Canada</option>
                    <option value="DE">🇩🇪 Germany</option>
                    <option value="ES">🇪🇸 Spain</option>
                    <option value="IT">🇮🇹 Italy</option>
                    <option value="BE">🇧🇪 Belgium</option>
                    <option value="CH">🇨🇭 Switzerland</option>
                  </select>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Téléphone (optionnel)
                </label>
                <div className={styles.inputWrapper}>
                  <Phone size={18} className={styles.inputIcon} />
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+1 (512) 472-8800"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className={styles.errorBox}>
                <span>{errorMsg}</span>
              </div>
            )}

            <PrimaryButton
              type="submit"
              icon={<ArrowRight size={18} />}
            >
              Valider et continuer
            </PrimaryButton>
          </form>

          <div className={styles.visualWrapper}>
            <RestaurantVisual
              imageUrl="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80"
              badgeText="Données contextuelles dynamiques (Météo, Événements, Réseaux)"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
