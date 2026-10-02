'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Utensils,
  Phone,
  Globe,
  Navigation,
  Loader2,
  Sparkles,
  Target,
  Users,
  MessageSquare,
  Palette,
  Image as ImageIcon,
  CheckCircle2,
  Share2,
  Sun,
  Bike,
  Plus,
  X,
  FileText,
  Link as LinkIcon,
  Check,
  Wine,
  Pizza,
  Flame,
  Martini,
  Coffee,
  Zap,
  Croissant,
  Truck,
  Clock,
  CookingPot,
  Briefcase,
  GraduationCap,
  HeartHandshake,
  Plane,
  Heart,
  UtensilsCrossed,
  PartyPopper,
  Smile,
  Camera,
  Search,
  Star,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import Logo from '@/components/ui/Logo/Logo';
import CountrySelect from '@/components/ui/CountrySelect/CountrySelect';
import { getCountryDisplayName } from '@/services/country/countries.data';
import { restaurantSearchService } from '@/services/restaurant-search/restaurant-search.service';
import type { RestaurantSearchResult } from '@/services/restaurant-search/restaurant-search.types';
import styles from './onboarding.module.css';

// Types d'établissement généralistes & catégorisables avec icônes Lucide épurées
const ESTABLISHMENT_TYPES = [
  { id: 'restaurant', label: 'Restaurant traditionnel', icon: Utensils },
  { id: 'bistro', label: 'Bistrot & Brasserie', icon: Wine },
  { id: 'fast_casual', label: 'Restauration rapide & Street food', icon: Zap },
  { id: 'cafe_brunch', label: 'Café, Salon de thé & Brunch', icon: Coffee },
  { id: 'bar_lounge', label: 'Bar, Pub & Lounge', icon: Martini },
  { id: 'bakery', label: 'Boulangerie, Pâtisserie & Traiteur', icon: Croissant },
  { id: 'food_truck', label: 'Food Truck & Kiosque', icon: Truck },
  { id: 'fine_dining', label: 'Gastronomique & Bistronomique', icon: Sparkles },
  { id: 'autre', label: 'Autre concept culinaire', icon: Store },
];

// Objectifs sur les réseaux sociaux avec icônes Lucide (badges)
const MARKETING_GOALS = [
  { id: 'more_clients', label: 'Attirer plus de clients', icon: Target },
  { id: 'off_peak', label: 'Remplir les heures creuses', icon: Clock },
  { id: 'delivery', label: 'Développer la livraison & vente à emporter', icon: Bike },
  { id: 'happy_hour', label: 'Booster les soirées & afterworks', icon: Martini },
  { id: 'promote_dishes', label: 'Faire découvrir la carte & nouveaux plats', icon: CookingPot },
];

// Cibles prioritaires avec icônes Lucide (badges)
const TARGET_AUDIENCES = [
  { id: 'young_pros', label: 'Jeunes actifs / Afterwork', icon: Briefcase },
  { id: 'families', label: 'Familles & Enfants', icon: Users },
  { id: 'students', label: 'Étudiants', icon: GraduationCap },
  { id: 'business', label: 'Déjeuners d’affaires express', icon: HeartHandshake },
  { id: 'tourists', label: 'Touristes & Visiteurs', icon: Plane },
  { id: 'couples', label: 'Couples & Dîners romantiques', icon: Heart },
];

// Tons de communication avec icônes Lucide (badges clairs)
const TONE_OPTIONS = [
  { id: 'chaleureux', label: 'Chaleureux & Accueillant', icon: Sun },
  { id: 'gourmand', label: 'Gourmand & Passionné', icon: UtensilsCrossed },
  { id: 'festif', label: 'Festif & Dynamique', icon: PartyPopper },
  { id: 'chic', label: 'Chic & Raffiné', icon: Sparkles },
  { id: 'decontracte', label: 'Décontracté & Direct', icon: Smile },
  { id: 'convivial', label: 'Convivial & Proche', icon: HeartHandshake },
];

// Étapes de l'onboarding pour la barre de progression
const ONBOARDING_STEPS = [
  { step: 1, label: 'Établissement', shortLabel: 'Resto' },
  { step: 2, label: 'Concept & Carte', shortLabel: 'Concept' },
  { step: 3, label: 'Communication', shortLabel: 'Com' },
  { step: 4, label: 'Marque & Couleurs', shortLabel: 'Marque' },
  { step: 5, label: 'Réseaux sociaux', shortLabel: 'Réseaux' },
];

// Couleurs suggérées pour faciliter le choix
const COLOR_SUGGESTIONS = [
  '#1B4332', '#2B2D42', '#C2593F', '#264653', '#7209B7',
  '#D97706', '#0F766E', '#BE123C', '#1D4ED8', '#374151',
];

interface AddressSuggestion {
  title: string;
  subtitle: string;
  street: string;
  city: string;
  postalCode: string;
  countryCode: string;
  countryName: string;
  lat: number;
  lon: number;
}

export default function UnifiedOnboardingPage() {
  const router = useRouter();

  // Étape courante (1: Établissement, 2: Concept & Carte, 3: Communication, 4: Marque & Réseaux)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- SECTION 1 : INFOS RESTAURANT ---
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('FR');
  const [customCoords, setCustomCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [detectedGpsInfo, setDetectedGpsInfo] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Type d'établissement
  const [restaurantType, setRestaurantType] = useState('restaurant');
  const [customRestaurantTypeInput, setCustomRestaurantTypeInput] = useState('');

  // Menu (Lien / Upload)
  const [menuType, setMenuType] = useState<'none' | 'link' | 'file'>('none');
  const [menuUrl, setMenuUrl] = useState('');
  const [menuFileName, setMenuFileName] = useState('');

  // Équipements
  const [hasTerrace, setHasTerrace] = useState(true);
  const [hasDelivery, setHasDelivery] = useState(false);

  // Recherche Google Places & Établissement lié
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [googleResults, setGoogleResults] = useState<RestaurantSearchResult[]>([]);
  const [hasSearchedGoogle, setHasSearchedGoogle] = useState(false);
  const [selectedGooglePlace, setSelectedGooglePlace] = useState<RestaurantSearchResult | null>(null);
  const [showManualAddress, setShowManualAddress] = useState(false);

  // Suggestions d'adresses en direct (si saisie manuelle)
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // --- SECTION 2 : COMMUNICATION & OBJECTIFS ---
  const [marketingGoal, setMarketingGoal] = useState('more_clients');
  const [targetAudiences, setTargetAudiences] = useState<string[]>(['young_pros', 'families']);
  const [tone, setTone] = useState('chaleureux');

  // --- SECTION 4 : MARQUE & BRANDING ---
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [customColors, setCustomColors] = useState<string[]>(['#1B4332', '#FAEDCD']);

  // --- SECTION 5 : RÉSEAUX SOCIAUX ---
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({
    instagram: false,
    facebook: false,
    google_business: false,
    tiktok: false,
  });

  // Restaurer les infos locales ou initialiser
  useEffect(() => {
    try {
      const authUserStr = localStorage.getItem('getspecial_auth_user');
      const savedRestName = localStorage.getItem('getspecial_new_restaurant_name');
      if (savedRestName) {
        setName(savedRestName);
      } else if (authUserStr) {
        const parsedAuth = JSON.parse(authUserStr);
        if (parsedAuth.name && parsedAuth.name !== 'Gérant GetSpecial') {
          setName(parsedAuth.name);
        }
      }
    } catch {
      // Ignorer
    }
  }, []);

  // Détection GPS : extrait simultanément rue, ville, code postal et pays
  const handleDetectGps = () => {
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
            const detCountryCode = (addr.country_code || country).toUpperCase();
            const detCountryName = addr.country || getCountryDisplayName(detCountryCode);

            if (street) setAddress(street);
            if (detCity) setCity(detCity);
            if (detPost) setPostalCode(detPost);
            if (detCountryCode) setCountry(detCountryCode);

            setDetectedGpsInfo(`${detCity}, ${detCountryName}`);
          }
        } catch {
          setDetectedGpsInfo(`Coordonnées : ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setErrorMsg('Accès GPS refusé ou indisponible. Vous pouvez saisir votre ville manuellement.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Autocomplétion d'adresse
  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddress(val);

    if (val.trim().length >= 4) {
      setIsSearchingAddress(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val.trim())}&format=json&limit=4&addressdetails=1`,
          { headers: { 'User-Agent': 'GetSpecial-App/1.0 (contact@getspecial.dev)' } }
        );
        if (res.ok) {
          const places = await res.json();
          if (Array.isArray(places)) {
            const mapped: AddressSuggestion[] = places.map((p: any) => {
              const a = p.address || {};
              const street = [a.house_number, a.road].filter(Boolean).join(' ') || p.name || val;
              const detectedCity = a.city || a.town || a.village || a.municipality || '';
              const cCode = (a.country_code || 'FR').toUpperCase();
              const cName = a.country || cCode;
              return {
                title: street || detectedCity || p.display_name.split(',')[0],
                subtitle: p.display_name,
                street,
                city: detectedCity,
                postalCode: a.postcode || '',
                countryCode: cCode,
                countryName: cName,
                lat: parseFloat(p.lat),
                lon: parseFloat(p.lon),
              };
            });
            setAddressSuggestions(mapped);
          }
        }
      } catch {
        // Ignorer
      } finally {
        setIsSearchingAddress(false);
      }
    } else {
      setAddressSuggestions([]);
    }
  };

  const handleSelectSuggestion = (s: AddressSuggestion) => {
    if (s.street) setAddress(s.street);
    if (s.city) setCity(s.city);
    if (s.postalCode) setPostalCode(s.postalCode);
    if (s.countryCode) setCountry(s.countryCode);
    setCustomCoords({ lat: s.lat, lon: s.lon });
    setDetectedGpsInfo(`${s.city || s.title}, ${s.countryName}`);
    setAddressSuggestions([]);
  };

  // Détection du pays si saisie manuelle de la ville
  const handleCityBlur = async () => {
    if (!city.trim() || city.trim().length < 3) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city.trim())}&format=json&limit=1&addressdetails=1`,
        { headers: { 'User-Agent': 'GetSpecial-App/1.0 (contact@getspecial.dev)' } }
      );
      if (res.ok) {
        const places = await res.json();
        if (Array.isArray(places) && places.length > 0) {
          const first = places[0];
          const a = first.address || {};
          const cCode = (a.country_code || '').toUpperCase();
          const cName = a.country || cCode;
          if (cCode) {
            setCountry(cCode);
            if (!customCoords) {
              setCustomCoords({ lat: parseFloat(first.lat), lon: parseFloat(first.lon) });
            }
            setDetectedGpsInfo(`${city.trim()}, ${cName}`);
          }
        }
      }
    } catch {
      // Ignorer
    }
  };

  // Détection automatique du badge de type d'établissement depuis Google Places
  const inferRestaurantTypeFromCategory = (categoryOrName: string): string => {
    const text = (categoryOrName || '').toLowerCase();
    if (text.includes('bistrot') || text.includes('bistro') || text.includes('brasserie')) return 'bistro';
    if (
      text.includes('fast') ||
      text.includes('burger') ||
      text.includes('pizza') ||
      text.includes('pizzeria') ||
      text.includes('street') ||
      text.includes('tacos') ||
      text.includes('snack') ||
      text.includes('kebab')
    )
      return 'fast_casual';
    if (
      text.includes('café') ||
      text.includes('cafe') ||
      text.includes('coffee') ||
      text.includes('brunch') ||
      text.includes('thé') ||
      text.includes('tea') ||
      text.includes('salon')
    )
      return 'cafe_brunch';
    if (
      text.includes('bar') ||
      text.includes('pub') ||
      text.includes('lounge') ||
      text.includes('cocktail') ||
      text.includes('vin') ||
      text.includes('wine') ||
      text.includes('tapas')
    )
      return 'bar_lounge';
    if (
      text.includes('boulangerie') ||
      text.includes('patisserie') ||
      text.includes('pâtisserie') ||
      text.includes('bakery') ||
      text.includes('traiteur')
    )
      return 'bakery';
    if (text.includes('truck') || text.includes('kiosque') || text.includes('camion')) return 'food_truck';
    if (text.includes('gastro') || text.includes('étoilé') || text.includes('michelin') || text.includes('fine dining'))
      return 'fine_dining';
    return 'restaurant';
  };

  // Recherche sur Google Places
  const handleSearchGoogle = async () => {
    if (!name.trim()) {
      setErrorMsg('Veuillez renseigner le nom de votre établissement avant de chercher sur Google.');
      return;
    }
    setErrorMsg(null);
    setIsSearchingGoogle(true);
    setHasSearchedGoogle(true);
    try {
      const res = await restaurantSearchService.search({
        name: name.trim(),
        city: city.trim(),
        country: country.trim(),
      });
      if (res.success && Array.isArray(res.results) && res.results.length > 0) {
        setGoogleResults(res.results);
      } else {
        setGoogleResults([]);
      }
    } catch (err) {
      console.warn('[SEARCH_GOOGLE_ERROR]', err);
      setGoogleResults([]);
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  // Sélection d'un établissement Google Places (Magic Fill)
  const handleSelectGooglePlace = (place: RestaurantSearchResult) => {
    setSelectedGooglePlace(place);
    setName(place.name);
    if (place.city) setCity(place.city);
    if (place.country) setCountry(place.country);
    setAddress(place.address);
    if (place.postalCode) setPostalCode(place.postalCode);
    if (place.latitude && place.longitude) {
      setCustomCoords({ lat: place.latitude, lon: place.longitude });
      setDetectedGpsInfo(`${place.city || city}, ${place.country || country}`);
    }

    // Détection automatique du badge de type d'établissement
    const inferred = inferRestaurantTypeFromCategory(`${place.cuisineType || ''} ${place.name}`);
    setRestaurantType(inferred);


    // Fermer la liste de résultats
    setGoogleResults([]);
  };

  // Réinitialiser la sélection pour chercher un autre établissement
  const handleClearSelectedPlace = () => {
    setSelectedGooglePlace(null);
    setGoogleResults([]);
    setHasSearchedGoogle(false);
  };

  // Toggle des cibles
  const toggleTarget = (id: string) => {
    setTargetAudiences((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  // Simulation upload logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };


  // Toggle connexion réseau social
  const handleTogglePlatform = (platform: string) => {
    setConnectedPlatforms((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  // Passage à l'étape suivante avec validation minimale
  const handleNextStep = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!name.trim()) {
        setErrorMsg('Veuillez renseigner le nom de votre restaurant.');
        return;
      }
      if (!city.trim()) {
        setErrorMsg('Veuillez renseigner la ville de votre établissement.');
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 3) {
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 4) {
      setCurrentStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Soumission finale et création en base
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const storedUser = localStorage.getItem('getspecial_auth_user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      // Résolution finale des coordonnées GPS & adresse
      let lat = customCoords?.lat || selectedGooglePlace?.latitude || 48.8566;
      let lon = customCoords?.lon || selectedGooglePlace?.longitude || 2.3522;

      const formattedAddress =
        address.trim() ||
        selectedGooglePlace?.address ||
        [name.trim(), city.trim(), postalCode.trim()].filter(Boolean).join(', ');

      const finalType =
        restaurantType === 'autre' && customRestaurantTypeInput.trim()
          ? customRestaurantTypeInput.trim()
          : restaurantType;

      const finalPhotos = selectedGooglePlace?.photoUrl ? [selectedGooglePlace.photoUrl] : [];

      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type: finalType,
          address: formattedAddress || `${name.trim()}, ${city.trim()}`,
          latitude: lat,
          longitude: lon,
          country: country.trim().toUpperCase() || 'FR',
          userId: parsedUser?.id || undefined,
          specialties: ['Cuisine & Spécialités maison'],
          tone,
          hasTerrace,
          hasDelivery,
          targetAudience: targetAudiences,
          marketingGoal,
          logoUrl: logoPreview || undefined,
          brandColors: customColors.filter(Boolean),
          menuUrl: menuType === 'link' ? menuUrl : menuFileName ? `file://${menuFileName}` : undefined,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.data?.id) {
          localStorage.setItem('getspecial_restaurant_id', json.data.id);
          localStorage.setItem('getspecial_selected_restaurant', JSON.stringify(json.data));
        }
      }

      // Marquer l'onboarding comme définitivement terminé
      localStorage.setItem('getspecial_onboarding_completed', 'true');
      localStorage.setItem('getspecial_restaurant_status', 'active');
      localStorage.removeItem('getspecial_onboarding_step');

      await new Promise((resolve) => setTimeout(resolve, 500));
      router.replace('/dashboard');
    } catch (err: any) {
      console.warn('[ONBOARDING_ERROR]', err);
      // Même en cas d'incident réseau temporaire, bascule vers le dashboard
      localStorage.setItem('getspecial_onboarding_completed', 'true');
      router.replace('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header avec Logo & Compteur de progression */}
        <header className={styles.header}>
          <Logo size="md" showTagline={false} />
          <div className={styles.headerStepMeta}>
            <span className={styles.headerStepText}>
              Étape <strong className={styles.headerStepBold}>{currentStep}</strong> / 5
            </span>
            <span className={styles.headerStepBadge}>
              {Math.round((currentStep / 5) * 100)}%
            </span>
          </div>
        </header>

        {/* Barre de progression continue & Labels des 5 sections */}
        <div className={styles.progressSection}>
          <div className={styles.progressBarWrapper}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${(currentStep / 5) * 100}%` }}
              role="progressbar"
              aria-valuenow={currentStep}
              aria-valuemin={1}
              aria-valuemax={5}
            />
          </div>

          <div className={styles.stepsRow}>
            {ONBOARDING_STEPS.map((s) => {
              const isCompleted = currentStep > s.step;
              const isActive = currentStep === s.step;
              return (
                <div
                  key={s.step}
                  className={`${styles.stepCol} ${
                    isActive
                      ? styles.stepColActive
                      : isCompleted
                      ? styles.stepColCompleted
                      : styles.stepColUpcoming
                  }`}
                >
                  <div className={styles.stepIndicator}>
                    {isCompleted ? (
                      <Check size={11} strokeWidth={2.5} />
                    ) : (
                      <span>{s.step}</span>
                    )}
                  </div>
                  <span className={styles.stepTitle}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 1 : INFOS & LOCALISATION RESTAURANT */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <section className={styles.formSection}>
            <div className={styles.titleArea}>
              <span className={styles.sectionBadge}>
                <Store size={15} /> Étape 1 sur 4
              </span>
              <h1 className={styles.title}>Trouvez votre établissement</h1>
              <p className={styles.subtitle}>
                Recherchez votre restaurant sur Google Maps ou indiquez ses coordonnées.
              </p>
            </div>

            {/* Nom du restaurant */}
            <div className={styles.fieldGroup}>
              <label htmlFor="name" className={styles.label}>
                <span>Nom de l&apos;établissement *</span>
              </label>
              <div className={styles.inputWrapper}>
                <Store size={16} strokeWidth={1.75} className={styles.inputIcon} />
                <input
                  id="name"
                  type="text"
                  placeholder="Ex. Le Bistrot Parisien, Chez Marco..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            {/* Ville & Pays synchronisés */}
            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="city" className={styles.label}>
                  <span>Ville *</span>
                </label>
                <div className={styles.inputWrapper}>
                  <MapPin size={16} strokeWidth={1.75} className={styles.inputIcon} />
                  <input
                    id="city"
                    type="text"
                    placeholder="Ex. Paris, Abidjan, Dakar..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onBlur={handleCityBlur}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="country" className={styles.label}>
                  <span>Pays *</span>
                </label>
                <CountrySelect
                  id="country"
                  value={country}
                  onChange={(cCode) => setCountry(cCode)}
                  placeholder="Rechercher pays..."
                />
              </div>
            </div>

            {/* Auto-découverte Google Places ou Établissement lié */}
            <div className={styles.fieldGroup}>
              {!selectedGooglePlace ? (
                <>
                  <button
                    type="button"
                    onClick={handleSearchGoogle}
                    disabled={!name.trim() || isSearchingGoogle}
                    className={styles.googleSearchBtn}
                  >
                    {isSearchingGoogle ? (
                      <>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Recherche sur Google Maps...</span>
                      </>
                    ) : (
                      <>
                        <Search size={14} strokeWidth={2} />
                        <span>Trouver mon restaurant sur Google</span>
                      </>
                    )}
                  </button>

                  {/* Indicateur de chargement */}
                  {isSearchingGoogle && (
                    <div className={styles.googleSearchLoading}>
                      <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Recherche de votre établissement en direct...</span>
                    </div>
                  )}

                  {/* Liste des résultats type Google Maps */}
                  {googleResults.length > 0 && (
                    <div className={styles.googleResultsList}>
                      {googleResults.map((place) => (
                        <div
                          key={place.id}
                          className={styles.googleResultCard}
                          onClick={() => handleSelectGooglePlace(place)}
                        >
                          {place.photoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={place.photoUrl} alt={place.name} className={styles.googleResultThumb} />
                          ) : (
                            <div className={styles.googleResultThumbPlaceholder}>
                              <Store size={18} strokeWidth={1.75} />
                            </div>
                          )}
                          <div className={styles.googleResultContent}>
                            <div className={styles.googleResultHeader}>
                              <span className={styles.googleResultName}>{place.name}</span>
                              <span className={styles.googleResultRating}>
                                <Star size={11} fill="#D97706" stroke="#D97706" />
                                <span>{place.rating || '4.8'}</span>
                                <span style={{ color: '#94A3B8', fontWeight: 400 }}>({place.reviewsCount || 120})</span>
                                {place.isOpenNow !== undefined && (
                                  <span className={place.isOpenNow ? styles.openBadge : styles.closedBadge}>
                                    {place.isOpenNow ? 'Ouvert' : 'Fermé'}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className={styles.googleResultMeta}>
                              <span className={styles.googleResultCategory}>{place.cuisineType || 'Restaurant'}</span>
                            </div>
                            <div className={styles.googleResultAddress}>
                              <MapPin size={11} strokeWidth={1.75} />
                              <span>{place.address}{place.city && place.city !== place.address ? `, ${place.city}` : ''}{place.postalCode ? ` ${place.postalCode}` : ''}</span>
                            </div>
                            {place.phone && (
                              <div className={styles.googleResultPhone}>
                                <Phone size={11} strokeWidth={1.75} />
                                <span>{place.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Aucun résultat trouvé */}
                  {hasSearchedGoogle && !isSearchingGoogle && googleResults.length === 0 && (
                    <div className={styles.googleNoResultBox}>
                      <div className={styles.googleNoResultContent}>
                        <AlertCircle size={20} strokeWidth={2} className={styles.googleNoResultIcon} />
                        <div>
                          <div className={styles.googleNoResultTitle}>
                            Aucun établissement trouvé sur Google Maps
                          </div>
                          <div className={styles.googleNoResultSubtitle}>
                            Aucun résultat pour &ldquo;{name}&rdquo;{city ? ` à ${city}` : ''}. Vous pouvez corriger la saisie ou renseigner l&apos;adresse manuellement.
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.manualAddressBtn}
                        onClick={() => setShowManualAddress(true)}
                      >
                        Saisir l&apos;adresse
                      </button>
                    </div>
                  )}

                  {/* Option dépliage adresse manuelle */}
                  {!showManualAddress ? (
                    <button
                      type="button"
                      className={styles.manualAddressToggle}
                      onClick={() => setShowManualAddress(true)}
                    >
                      Mon établissement n&apos;est pas sur Google / Saisir l&apos;adresse manuelle
                    </button>
                  ) : (
                    <div style={{ marginTop: '4px', animation: 'fadeIn 0.2s ease' }}>
                      <div className={styles.label} style={{ marginBottom: '4px' }}>
                        <span>Adresse manuelle</span>
                        <button
                          type="button"
                          className={styles.manualAddressToggle}
                          onClick={() => setShowManualAddress(false)}
                        >
                          Masquer
                        </button>
                      </div>
                      <div className={styles.inputWrapper}>
                        <MapPin size={16} strokeWidth={1.75} className={styles.inputIcon} />
                        <input
                          type="text"
                          placeholder="Ex. 15 Rue de Rivoli..."
                          value={address}
                          onChange={handleAddressChange}
                          className={styles.inputWithGps}
                        />
                        <button
                          type="button"
                          className={styles.inlineGpsBtn}
                          onClick={handleDetectGps}
                          disabled={isLocating}
                          title="Détecter ma position automatiquement"
                        >
                          {isLocating ? (
                            <Loader2 size={11} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Navigation size={11} strokeWidth={2} />
                          )}
                          {isLocating ? 'Localisation…' : 'Localiser'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Carte d'établissement lié à Google Places */
                <div className={styles.selectedPlaceCard}>
                  <div className={styles.selectedPlaceLeft}>
                    {selectedGooglePlace.photoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={selectedGooglePlace.photoUrl}
                        alt={selectedGooglePlace.name}
                        className={styles.selectedPlaceThumb}
                      />
                    ) : (
                      <div className={styles.googleResultThumbPlaceholder} style={{ width: '40px', height: '40px' }}>
                        <Store size={18} strokeWidth={1.75} />
                      </div>
                    )}
                    <div className={styles.selectedPlaceInfo}>
                      <div className={styles.selectedPlaceTitleRow}>
                        <span className={styles.selectedPlaceName}>{selectedGooglePlace.name}</span>
                        <span className={styles.selectedPlaceBadge}>
                          <Check size={11} strokeWidth={2.5} /> Lié à Google
                        </span>
                      </div>
                      <div className={styles.selectedPlaceSub}>
                        <Star size={11} fill="#D97706" stroke="#D97706" />
                        <span style={{ fontWeight: 600, color: '#B45309' }}>{selectedGooglePlace.rating || '4.8'}</span>
                        <span>• {selectedGooglePlace.cuisineType || 'Restaurant'} •</span>
                        <MapPin size={11} strokeWidth={1.75} />
                        <span>{selectedGooglePlace.address}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelectedPlace}
                    className={styles.changePlaceBtn}
                    title="Changer d'établissement ou chercher à nouveau"
                  >
                    <Edit2 size={12} strokeWidth={2} />
                    <span>Changer</span>
                  </button>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className={styles.errorBox}>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Navigation Section 1 */}
            <div className={styles.footerActions}>
              <div />
              <div className={styles.nextBtnGroup}>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={styles.primaryBtn}
                >
                  <span>Continuer</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* SECTION 2 : CONCEPT CULINAIRE & SERVICES (NOUVELLE SECTION) */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <section className={styles.formSection}>
            <div className={styles.titleArea}>
              <span className={styles.sectionBadge}>
                <Utensils size={15} /> Étape 2 sur 4
              </span>
              <h1 className={styles.title}>Concept culinaire & Services</h1>
              <p className={styles.subtitle}>
                Précisez votre type d&apos;établissement, votre carte et vos services pour alimenter l&apos;IA.
              </p>
            </div>

            {/* Type d'établissement (Badges interactifs catégorisables) */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Type d&apos;établissement</span>
                <span className={styles.optionalTag}>1 clic</span>
              </label>
              <div className={styles.typeBadgesRow}>
                {ESTABLISHMENT_TYPES.map((t) => {
                  const IconComp = t.icon;
                  const isSelected = restaurantType === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      className={`${styles.typeBadge} ${isSelected ? styles.typeBadgeSelected : ''}`}
                      onClick={() => setRestaurantType(t.id)}
                    >
                      <span className={styles.typeBadgeIcon}>
                        <IconComp size={18} strokeWidth={1.75} />
                      </span>
                      <span>{t.label}</span>
                      {isSelected && (
                        <span className={styles.typeBadgeCheck}>
                          <Check size={14} strokeWidth={2.5} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {restaurantType === 'autre' && (
                <div className={styles.customTypeWrapper}>
                  <div className={styles.inputWrapper}>
                    <Store size={18} className={styles.inputIcon} />
                    <input
                      type="text"
                      placeholder="Précisez votre concept (ex. Bar à ramen, Glacerie artisanale, Cantine bio...)"
                      value={customRestaurantTypeInput}
                      onChange={(e) => setCustomRestaurantTypeInput(e.target.value)}
                      className={styles.input}
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Menu / Carte (Optionnel : Lien ou Fichier) */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Menu ou Carte des plats</span>
                <span className={styles.optionalTag}>Optionnel</span>
              </label>
              <div className={styles.menuButtonsRow}>
                <button
                  type="button"
                  className={`${styles.menuCompactBtn} ${menuType === 'link' ? styles.menuCompactBtnActive : ''}`}
                  onClick={() => setMenuType(menuType === 'link' ? 'none' : 'link')}
                >
                  <LinkIcon size={13} strokeWidth={1.75} /> Coller un lien
                </button>
                <button
                  type="button"
                  className={`${styles.menuCompactBtn} ${menuType === 'file' ? styles.menuCompactBtnActive : ''}`}
                  onClick={() => setMenuType(menuType === 'file' ? 'none' : 'file')}
                >
                  <FileText size={13} strokeWidth={1.75} /> Importer photo / PDF
                </button>
              </div>

              {menuType === 'link' && (
                <div className={styles.inputWrapper} style={{ marginTop: '4px' }}>
                  <LinkIcon size={14} strokeWidth={1.75} className={styles.inputIcon} />
                  <input
                    type="url"
                    placeholder="https://mon-restaurant.com/menu ou lien Instagram..."
                    value={menuUrl}
                    onChange={(e) => setMenuUrl(e.target.value)}
                    className={styles.input}
                  />
                </div>
              )}

              {menuType === 'file' && (
                <label className={styles.dropzone} style={{ marginTop: '4px', padding: '8px 12px' }}>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setMenuFileName(f.name);
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} strokeWidth={1.75} style={{ color: '#1B4332' }} />
                    <span className={styles.dropzoneTitle}>
                      {menuFileName ? `Fichier : ${menuFileName}` : 'Sélectionner la carte (photo ou PDF)'}
                    </span>
                  </div>
                </label>
              )}
            </div>

            {/* Aménagements : Terrasse & Livraison en format chips compact */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Services & Équipements</span>
                <span className={styles.optionalTag}>Météo & suggestions</span>
              </label>
              <div className={styles.amenitiesRow}>
                <button
                  type="button"
                  className={`${styles.amenityChip} ${hasTerrace ? styles.amenityChipActive : ''}`}
                  onClick={() => setHasTerrace(!hasTerrace)}
                >
                  <span className={styles.amenityChipLeft}>
                    <Sun size={15} strokeWidth={1.75} />
                    <span>Terrasse</span>
                  </span>
                  <span className={styles.amenityChipBadge}>{hasTerrace ? 'Activé' : 'Désactivé'}</span>
                </button>

                <button
                  type="button"
                  className={`${styles.amenityChip} ${hasDelivery ? styles.amenityChipActive : ''}`}
                  onClick={() => setHasDelivery(!hasDelivery)}
                >
                  <span className={styles.amenityChipLeft}>
                    <Bike size={15} strokeWidth={1.75} />
                    <span>Livraison</span>
                  </span>
                  <span className={styles.amenityChipBadge}>{hasDelivery ? 'Activé' : 'Désactivé'}</span>
                </button>
              </div>
            </div>

            {/* Navigation Section 2 */}
            <div className={styles.footerActions}>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={styles.backBtn}
              >
                <ArrowLeft size={16} /> Retour
              </button>

              <div className={styles.nextBtnGroup}>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={styles.primaryBtn}
                >
                  <span>Continuer</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* SECTION 3 : COMMUNICATION & OBJECTIFS RÉSEAUX */}
        {/* ============================================================== */}
        {currentStep === 3 && (
          <section className={styles.formSection}>
            <div className={styles.titleArea}>
              <span className={styles.sectionBadge}>
                <Target size={15} /> Étape 3 sur 4
              </span>
              <h1 className={styles.title}>Votre stratégie de communication</h1>
              <p className={styles.subtitle}>
                Ces réglages permettent à l&apos;IA de cibler le bon public et de trouver les mots justes pour vos posts.
              </p>
            </div>

            {/* Objectif principal sur les réseaux */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Votre objectif principal sur les réseaux sociaux</span>
                <span className={styles.optionalTag}>1 clic</span>
              </label>
              <div className={styles.tagsRow}>
                {MARKETING_GOALS.map((goal) => {
                  const GoalIcon = goal.icon;
                  const isSelected = marketingGoal === goal.id;
                  return (
                    <button
                      type="button"
                      key={goal.id}
                      className={`${styles.quickTag} ${
                        isSelected ? styles.quickTagSelected : ''
                      }`}
                      onClick={() => setMarketingGoal(goal.id)}
                    >
                      <GoalIcon size={14} strokeWidth={1.75} />
                      <span>{goal.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cible prioritaire */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Qui sont vos clients cibles ?</span>
                <span className={styles.optionalTag}>Sélection multiple</span>
              </label>
              <div className={styles.tagsRow}>
                {TARGET_AUDIENCES.map((target) => {
                  const TargetIcon = target.icon;
                  const isSelected = targetAudiences.includes(target.id);
                  return (
                    <button
                      type="button"
                      key={target.id}
                      className={`${styles.quickTag} ${
                        isSelected ? styles.quickTagSelected : ''
                      }`}
                      onClick={() => toggleTarget(target.id)}
                    >
                      <TargetIcon size={14} strokeWidth={1.75} />
                      <span>{target.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ton de communication */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Ton de communication</span>
                <span className={styles.optionalTag}>1 clic</span>
              </label>
              <div className={styles.tagsRow}>
                {TONE_OPTIONS.map((t) => {
                  const ToneIcon = t.icon;
                  const isSelected = tone === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      className={`${styles.quickTag} ${
                        isSelected ? styles.quickTagSelected : ''
                      }`}
                      onClick={() => setTone(t.id)}
                    >
                      <ToneIcon size={14} strokeWidth={1.75} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Section 3 */}
            <div className={styles.footerActions}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={styles.backBtn}
              >
                <ArrowLeft size={16} /> Retour
              </button>

              <div className={styles.nextBtnGroup}>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={styles.primaryBtn}
                >
                  <span>Continuer</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* SECTION 4 : MARQUE & COULEURS */}
        {/* ============================================================== */}
        {currentStep === 4 && (
          <section className={styles.formSection}>
            <div className={styles.titleArea}>
              <span className={styles.sectionBadge}>
                <Palette size={15} /> Étape 4 sur 5
              </span>
              <h1 className={styles.title}>Votre image de marque</h1>
              <p className={styles.subtitle}>
                Ajoutez votre logo et choisissez vos couleurs. Tout est optionnel.
              </p>
            </div>

            {/* Logo unique */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Logo de l&apos;établissement</span>
                <span className={styles.optionalTag}>Optionnel</span>
              </label>
              {logoPreview ? (
                <div className={styles.logoPreviewRow}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPreview} alt="Logo" className={styles.logoPreviewImg} />
                  <div className={styles.logoPreviewMeta}>
                    <span className={styles.logoPreviewName}>Logo chargé</span>
                    <button
                      type="button"
                      className={styles.logoRemoveBtn}
                      onClick={() => setLogoPreview(null)}
                    >
                      <X size={13} strokeWidth={2} /> Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <label className={styles.dropzoneLarge}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleLogoUpload}
                  />
                  <ImageIcon size={22} strokeWidth={1.75} style={{ color: '#94A3B8' }} />
                  <span className={styles.dropzoneTitle}>Cliquez pour ajouter votre logo</span>
                  <span className={styles.dropzoneHint}>PNG, JPG, SVG — max 5 Mo</span>
                </label>
              )}
            </div>

            {/* Couleurs personnalisées */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Couleurs de votre marque</span>
                <span className={styles.optionalTag}>3 max</span>
              </label>

              {/* Aperçu des couleurs choisies */}
              <div className={styles.colorPickerSection}>
                <div className={styles.colorPickersRow}>
                  {[0, 1, 2].map((idx) => {
                    const col = customColors[idx] || '';
                    return (
                      <div key={idx} className={styles.colorPickerSlot}>
                        {col ? (
                          <div className={styles.colorPickerFilled}>
                            <input
                              type="color"
                              value={col}
                              className={styles.colorInput}
                              onChange={(e) => {
                                const next = [...customColors];
                                next[idx] = e.target.value;
                                setCustomColors(next);
                              }}
                              title={`Couleur ${idx + 1}`}
                            />
                            <span
                              className={styles.colorSwatch}
                              style={{ background: col }}
                            />
                            <span className={styles.colorHex}>{col.toUpperCase()}</span>
                            <button
                              type="button"
                              className={styles.colorRemoveBtn}
                              onClick={() => {
                                const next = customColors.filter((_, i) => i !== idx);
                                setCustomColors(next);
                              }}
                              title="Supprimer cette couleur"
                            >
                              <X size={10} strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          customColors.length === idx && (
                            <label className={styles.colorPickerEmpty} title="Ajouter une couleur">
                              <input
                                type="color"
                                defaultValue="#1B4332"
                                className={styles.colorInput}
                                onChange={(e) => {
                                  setCustomColors([...customColors, e.target.value]);
                                }}
                              />
                              <Plus size={16} strokeWidth={2} style={{ color: '#94A3B8' }} />
                              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Ajouter</span>
                            </label>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Suggestions rapides */}
                <div className={styles.colorSuggestionsRow}>
                  <span className={styles.colorSuggestLabel}>Suggestions :</span>
                  {COLOR_SUGGESTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.colorSuggestBtn} ${customColors.includes(c) ? styles.colorSuggestBtnActive : ''}`}
                      style={{ background: c }}
                      title={c}
                      disabled={customColors.length >= 3 && !customColors.includes(c)}
                      onClick={() => {
                        if (customColors.includes(c)) {
                          setCustomColors(customColors.filter((x) => x !== c));
                        } else if (customColors.length < 3) {
                          setCustomColors([...customColors, c]);
                        }
                      }}
                    >
                      {customColors.includes(c) && <Check size={10} strokeWidth={3} style={{ color: '#fff' }} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className={styles.errorBox}>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Navigation Section 4 */}
            <div className={styles.footerActions}>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={styles.backBtn}
              >
                <ArrowLeft size={16} /> Retour
              </button>

              <div className={styles.nextBtnGroup}>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={styles.primaryBtn}
                >
                  <span>Continuer</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* SECTION 5 : RÉSEAUX SOCIAUX */}
        {/* ============================================================== */}
        {currentStep === 5 && (
          <section className={styles.formSection}>
            <div className={styles.titleArea}>
              <span className={styles.sectionBadge}>
                <Share2 size={15} /> Étape 5 sur 5
              </span>
              <h1 className={styles.title}>Connectez vos réseaux</h1>
              <p className={styles.subtitle}>
                Liez vos comptes pour que votre copilote publie directement. Vous pouvez le faire plus tard.
              </p>
            </div>

            {/* Cartes réseaux sociaux */}
            <div className={styles.socialCardsGrid}>
              {/* Instagram */}
              <div className={styles.socialCardLarge}>
                <div className={styles.socialCardHeader}>
                  <span className={styles.socialIconBoxLarge} style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                    <Camera size={18} strokeWidth={1.75} style={{ color: '#fff' }} />
                  </span>
                  <div>
                    <div className={styles.socialCardName}>Instagram</div>
                    <div className={styles.socialCardDesc}>Photos, Reels & Stories</div>
                  </div>
                </div>
                {connectedPlatforms.instagram ? (
                  <div className={styles.socialConnectedRow}>
                    <CheckCircle2 size={14} strokeWidth={2} style={{ color: '#16A34A' }} />
                    <span className={styles.socialConnectedLabel}>Compte lié</span>
                    <button
                      type="button"
                      className={styles.socialDisconnectBtn}
                      onClick={() => handleTogglePlatform('instagram')}
                    >
                      Délier
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.socialConnectBtn}
                    onClick={() => handleTogglePlatform('instagram')}
                  >
                    Connecter Instagram
                  </button>
                )}
              </div>

              {/* Facebook */}
              <div className={styles.socialCardLarge}>
                <div className={styles.socialCardHeader}>
                  <span className={styles.socialIconBoxLarge} style={{ background: '#1877F2' }}>
                    <Share2 size={18} strokeWidth={1.75} style={{ color: '#fff' }} />
                  </span>
                  <div>
                    <div className={styles.socialCardName}>Facebook</div>
                    <div className={styles.socialCardDesc}>Page & Publications</div>
                  </div>
                </div>
                {connectedPlatforms.facebook ? (
                  <div className={styles.socialConnectedRow}>
                    <CheckCircle2 size={14} strokeWidth={2} style={{ color: '#16A34A' }} />
                    <span className={styles.socialConnectedLabel}>Compte lié</span>
                    <button
                      type="button"
                      className={styles.socialDisconnectBtn}
                      onClick={() => handleTogglePlatform('facebook')}
                    >
                      Délier
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.socialConnectBtn}
                    onClick={() => handleTogglePlatform('facebook')}
                  >
                    Connecter Facebook
                  </button>
                )}
              </div>

              {/* Google Business */}
              <div className={styles.socialCardLarge}>
                <div className={styles.socialCardHeader}>
                  <span className={styles.socialIconBoxLarge} style={{ background: '#fff', border: '1.5px solid #E2E8F0' }}>
                    <MapPin size={18} strokeWidth={1.75} style={{ color: '#EA4335' }} />
                  </span>
                  <div>
                    <div className={styles.socialCardName}>Google Business</div>
                    <div className={styles.socialCardDesc}>Fiche & Avis clients</div>
                  </div>
                </div>
                {connectedPlatforms.google_business ? (
                  <div className={styles.socialConnectedRow}>
                    <CheckCircle2 size={14} strokeWidth={2} style={{ color: '#16A34A' }} />
                    <span className={styles.socialConnectedLabel}>Compte lié</span>
                    <button
                      type="button"
                      className={styles.socialDisconnectBtn}
                      onClick={() => handleTogglePlatform('google_business')}
                    >
                      Délier
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.socialConnectBtn}
                    onClick={() => handleTogglePlatform('google_business')}
                  >
                    Connecter Google
                  </button>
                )}
              </div>

              {/* TikTok */}
              <div className={styles.socialCardLarge}>
                <div className={styles.socialCardHeader}>
                  <span className={styles.socialIconBoxLarge} style={{ background: '#010101' }}>
                    <Zap size={18} strokeWidth={1.75} style={{ color: '#fff' }} />
                  </span>
                  <div>
                    <div className={styles.socialCardName}>TikTok</div>
                    <div className={styles.socialCardDesc}>Vidéos courtes & Tendances</div>
                  </div>
                </div>
                {connectedPlatforms.tiktok ? (
                  <div className={styles.socialConnectedRow}>
                    <CheckCircle2 size={14} strokeWidth={2} style={{ color: '#16A34A' }} />
                    <span className={styles.socialConnectedLabel}>Compte lié</span>
                    <button
                      type="button"
                      className={styles.socialDisconnectBtn}
                      onClick={() => handleTogglePlatform('tiktok')}
                    >
                      Délier
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.socialConnectBtn}
                    onClick={() => handleTogglePlatform('tiktok')}
                  >
                    Connecter TikTok
                  </button>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className={styles.errorBox}>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Navigation Section 5 */}
            <div className={styles.footerActions}>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className={styles.backBtn}
              >
                <ArrowLeft size={16} /> Retour
              </button>

              <div className={styles.nextBtnGroup}>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className={styles.skipBtn}
                >
                  Passer cette étape
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className={styles.primaryBtn}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Initialisation du copilote...</span>
                    </>
                  ) : (
                    <>
                      <span>Lancer mon copilote IA</span>
                      <Sparkles size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
