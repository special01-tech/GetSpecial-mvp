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
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useLanguage } from '@/i18n';
import CountrySelect from '@/components/ui/CountrySelect/CountrySelect';
import { getCountryDisplayName } from '@/services/country/countries.data';
import { restaurantSearchService } from '@/services/restaurant-search/restaurant-search.service';
import type { RestaurantSearchResult } from '@/services/restaurant-search/restaurant-search.types';
import styles from './onboarding.module.css';

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
  const { t } = useLanguage();

  // Types d'établissement généralistes & catégorisables avec icônes Lucide épurées
  const ESTABLISHMENT_TYPES = [
    { id: 'restaurant', label: t('onboarding.unified.typeRestaurant'), icon: Utensils },
    { id: 'bistro', label: t('onboarding.unified.typeBistro'), icon: Wine },
    { id: 'fast_casual', label: t('onboarding.unified.typeFastCasual'), icon: Zap },
    { id: 'cafe_brunch', label: t('onboarding.unified.typeCafeBrunch'), icon: Coffee },
    { id: 'bar_lounge', label: t('onboarding.unified.typeBarLounge'), icon: Martini },
    { id: 'bakery', label: t('onboarding.unified.typeBakery'), icon: Croissant },
    { id: 'food_truck', label: t('onboarding.unified.typeFoodTruck'), icon: Truck },
    { id: 'fine_dining', label: t('onboarding.unified.typeFineDining'), icon: Sparkles },
    { id: 'autre', label: t('onboarding.unified.typeOther'), icon: Store },
  ];

  // Objectifs sur les réseaux sociaux avec icônes Lucide (badges)
  const MARKETING_GOALS = [
    { id: 'more_clients', label: t('onboarding.unified.goalMoreClients'), icon: Target },
    { id: 'off_peak', label: t('onboarding.unified.goalOffPeak'), icon: Clock },
    { id: 'delivery', label: t('onboarding.unified.goalDelivery'), icon: Bike },
    { id: 'happy_hour', label: t('onboarding.unified.goalHappyHour'), icon: Martini },
    { id: 'promote_dishes', label: t('onboarding.unified.goalPromoteDishes'), icon: CookingPot },
  ];

  // Cibles prioritaires avec icônes Lucide (badges)
  const TARGET_AUDIENCES = [
    { id: 'young_pros', label: t('onboarding.unified.targetYoungPros'), icon: Briefcase },
    { id: 'families', label: t('onboarding.unified.targetFamilies'), icon: Users },
    { id: 'students', label: t('onboarding.unified.targetStudents'), icon: GraduationCap },
    { id: 'business', label: t('onboarding.unified.targetBusiness'), icon: HeartHandshake },
    { id: 'tourists', label: t('onboarding.unified.targetTourists'), icon: Plane },
    { id: 'couples', label: t('onboarding.unified.targetCouples'), icon: Heart },
  ];

  // Tons de communication avec icônes Lucide (badges clairs)
  const TONE_OPTIONS = [
    { id: 'chaleureux', label: t('onboarding.unified.toneWarm'), icon: Sun },
    { id: 'gourmand', label: t('onboarding.unified.toneFoodie'), icon: UtensilsCrossed },
    { id: 'festif', label: t('onboarding.unified.toneFestive'), icon: PartyPopper },
    { id: 'chic', label: t('onboarding.unified.toneChic'), icon: Sparkles },
    { id: 'decontracte', label: t('onboarding.unified.toneCasual'), icon: Smile },
    { id: 'convivial', label: t('onboarding.unified.toneFriendly'), icon: HeartHandshake },
  ];

  // Étapes de l'onboarding pour la barre de progression
  const ONBOARDING_STEPS = [
    { step: 1, label: t('onboarding.unified.step1Label'), shortLabel: t('onboarding.unified.step1Short') },
    { step: 2, label: t('onboarding.unified.step2Label'), shortLabel: t('onboarding.unified.step2Short') },
    { step: 3, label: t('onboarding.unified.step3Label'), shortLabel: t('onboarding.unified.step3Short') },
    { step: 4, label: t('onboarding.unified.step4Label'), shortLabel: t('onboarding.unified.step4Short') },
    { step: 5, label: t('onboarding.unified.step5Label'), shortLabel: t('onboarding.unified.step5Short') },
  ];

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
      setErrorMsg(t('onboarding.unified.gpsUnsupported'));
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
          setDetectedGpsInfo(t('onboarding.unified.gpsCoords', { coords: `${lat.toFixed(4)}, ${lon.toFixed(4)}` }));
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setErrorMsg(t('onboarding.unified.gpsDenied'));
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
      setErrorMsg(t('onboarding.unified.nameRequiredGoogle'));
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
        setErrorMsg(t('onboarding.unified.nameRequired'));
        return;
      }
      if (!city.trim()) {
        setErrorMsg(t('onboarding.unified.cityRequired'));
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
              {t('onboarding.unified.headerStepLabel')} <strong className={styles.headerStepBold}>{currentStep}</strong> {t('onboarding.unified.headerStepTotal')}
            </span>
            <span className={styles.headerStepBadge}>
              {Math.round((currentStep / 5) * 100)}%
            </span>
          </div>
          <LanguageToggle compact />
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
                <Store size={15} /> {t('onboarding.unified.s1Badge')}
              </span>
              <h1 className={styles.title}>{t('onboarding.unified.s1Title')}</h1>
              <p className={styles.subtitle}>
                {t('onboarding.unified.s1Subtitle')}
              </p>
            </div>

            {/* Nom du restaurant */}
            <div className={styles.fieldGroup}>
              <label htmlFor="name" className={styles.label}>
                <span>{t('onboarding.unified.nameLabel')}</span>
              </label>
              <div className={styles.inputWrapper}>
                <Store size={16} strokeWidth={1.75} className={styles.inputIcon} />
                <input
                  id="name"
                  type="text"
                  placeholder={t('onboarding.unified.namePlaceholder')}
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
                  <span>{t('onboarding.unified.cityLabel')}</span>
                </label>
                <div className={styles.inputWrapper}>
                  <MapPin size={16} strokeWidth={1.75} className={styles.inputIcon} />
                  <input
                    id="city"
                    type="text"
                    placeholder={t('onboarding.unified.cityPlaceholder')}
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
                  <span>{t('onboarding.unified.countryLabel')}</span>
                </label>
                <CountrySelect
                  id="country"
                  value={country}
                  onChange={(cCode) => setCountry(cCode)}
                  placeholder={t('onboarding.unified.countryPlaceholder')}
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
                        <span>{t('onboarding.unified.searchingGoogle')}</span>
                      </>
                    ) : (
                      <>
                        <Search size={14} strokeWidth={2} />
                        <span>{t('onboarding.unified.findOnGoogle')}</span>
                      </>
                    )}
                  </button>

                  {/* Indicateur de chargement */}
                  {isSearchingGoogle && (
                    <div className={styles.googleSearchLoading}>
                      <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>{t('onboarding.unified.searchingLive')}</span>
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
                                <Star size={11} fill="#FF5A00" stroke="#FF5A00" />
                                <span>{place.rating || '4.8'}</span>
                                <span style={{ color: '#8A8A8A', fontWeight: 400 }}>({place.reviewsCount || 120})</span>
                                {place.isOpenNow !== undefined && (
                                  <span className={place.isOpenNow ? styles.openBadge : styles.closedBadge}>
                                    {place.isOpenNow ? t('onboarding.unified.openBadge') : t('onboarding.unified.closedBadge')}
                                  </span>
                                )}
                              </span>
                            </div>
                              <div className={styles.googleResultMeta}>
                                <span className={styles.googleResultCategory}>{place.cuisineType || t('onboarding.unified.defaultCategory')}</span>
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
                            {t('onboarding.unified.noResultTitle')}
                          </div>
                          <div className={styles.googleNoResultSubtitle}>
                            {city
                              ? t('onboarding.unified.noResultWithCity', { name, city })
                              : t('onboarding.unified.noResultWithoutCity', { name })}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.manualAddressBtn}
                        onClick={() => setShowManualAddress(true)}
                      >
                        {t('onboarding.unified.manualAddressBtn')}
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
                      {t('onboarding.unified.notOnGoogle')}
                    </button>
                  ) : (
                    <div style={{ marginTop: '4px', animation: 'fadeIn 0.2s ease' }}>
                      <div className={styles.label} style={{ marginBottom: '4px' }}>
                        <span>{t('onboarding.unified.manualAddressLabel')}</span>
                        <button
                          type="button"
                          className={styles.manualAddressToggle}
                          onClick={() => setShowManualAddress(false)}
                        >
                          {t('onboarding.unified.hide')}
                        </button>
                      </div>
                      <div className={styles.inputWrapper}>
                        <MapPin size={16} strokeWidth={1.75} className={styles.inputIcon} />
                        <input
                          type="text"
                          placeholder={t('onboarding.unified.addressPlaceholder')}
                          value={address}
                          onChange={handleAddressChange}
                          className={styles.inputWithGps}
                        />
                        <button
                          type="button"
                          className={styles.inlineGpsBtn}
                          onClick={handleDetectGps}
                          disabled={isLocating}
                          title={t('onboarding.unified.detectGpsTitle')}
                        >
                          {isLocating ? (
                            <Loader2 size={11} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Navigation size={11} strokeWidth={2} />
                          )}
                          {isLocating ? t('onboarding.unified.locating') : t('onboarding.unified.locate')}
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
                          <Check size={11} strokeWidth={2.5} /> {t('onboarding.unified.linkedToGoogle')}
                        </span>
                      </div>
                      <div className={styles.selectedPlaceSub}>
                        <Star size={11} fill="#FF5A00" stroke="#FF5A00" />
                        <span style={{ fontWeight: 600, color: '#E04F00' }}>{selectedGooglePlace.rating || '4.8'}</span>
                        <span>• {selectedGooglePlace.cuisineType || t('onboarding.unified.defaultCategory')} •</span>
                        <MapPin size={11} strokeWidth={1.75} />
                        <span>{selectedGooglePlace.address}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelectedPlace}
                    className={styles.changePlaceBtn}
                    title={t('onboarding.unified.changePlaceTitle')}
                  >
                    <Edit2 size={12} strokeWidth={2} />
                    <span>{t('onboarding.unified.change')}</span>
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
                  <span>{t('onboarding.unified.continue')}</span>
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
                <Utensils size={15} /> {t('onboarding.unified.s2Badge')}
              </span>
              <h1 className={styles.title}>{t('onboarding.unified.s2Title')}</h1>
              <p className={styles.subtitle}>
                {t('onboarding.unified.s2Subtitle')}
              </p>
            </div>

            {/* Type d'établissement (Badges interactifs catégorisables) */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>{t('onboarding.unified.establishmentTypeLabel')}</span>
                <span className={styles.optionalTag}>{t('onboarding.unified.oneClick')}</span>
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
                      placeholder={t('onboarding.unified.customTypePlaceholder')}
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
                <span>{t('onboarding.unified.menuLabel')}</span>
                <span className={styles.optionalTag}>{t('onboarding.unified.optional')}</span>
              </label>
              <div className={styles.menuButtonsRow}>
                <button
                  type="button"
                  className={`${styles.menuCompactBtn} ${menuType === 'link' ? styles.menuCompactBtnActive : ''}`}
                  onClick={() => setMenuType(menuType === 'link' ? 'none' : 'link')}
                >
                  <LinkIcon size={13} strokeWidth={1.75} /> {t('onboarding.unified.pasteLink')}
                </button>
                <button
                  type="button"
                  className={`${styles.menuCompactBtn} ${menuType === 'file' ? styles.menuCompactBtnActive : ''}`}
                  onClick={() => setMenuType(menuType === 'file' ? 'none' : 'file')}
                >
                  <FileText size={13} strokeWidth={1.75} /> {t('onboarding.unified.importFile')}
                </button>
              </div>

              {menuType === 'link' && (
                <div className={styles.inputWrapper} style={{ marginTop: '4px' }}>
                  <LinkIcon size={14} strokeWidth={1.75} className={styles.inputIcon} />
                  <input
                    type="url"
                    placeholder={t('onboarding.unified.menuUrlPlaceholder')}
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
                    <FileText size={16} strokeWidth={1.75} style={{ color: '#FF5A00' }} />
                    <span className={styles.dropzoneTitle}>
                      {menuFileName ? t('onboarding.unified.menuFileSelected', { file: menuFileName }) : t('onboarding.unified.menuFileCta')}
                    </span>
                  </div>
                </label>
              )}
            </div>

            {/* Aménagements : Terrasse & Livraison en format chips compact */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>{t('onboarding.unified.servicesLabel')}</span>
                <span className={styles.optionalTag}>{t('onboarding.unified.servicesHint')}</span>
              </label>
              <div className={styles.amenitiesRow}>
                <button
                  type="button"
                  className={`${styles.amenityChip} ${hasTerrace ? styles.amenityChipActive : ''}`}
                  onClick={() => setHasTerrace(!hasTerrace)}
                >
                  <span className={styles.amenityChipLeft}>
                    <Sun size={15} strokeWidth={1.75} />
                    <span>{t('onboarding.unified.terrace')}</span>
                  </span>
                  <span className={styles.amenityChipBadge}>{hasTerrace ? t('onboarding.unified.enabled') : t('onboarding.unified.disabled')}</span>
                </button>

                <button
                  type="button"
                  className={`${styles.amenityChip} ${hasDelivery ? styles.amenityChipActive : ''}`}
                  onClick={() => setHasDelivery(!hasDelivery)}
                >
                  <span className={styles.amenityChipLeft}>
                    <Bike size={15} strokeWidth={1.75} />
                    <span>{t('onboarding.unified.delivery')}</span>
                  </span>
                  <span className={styles.amenityChipBadge}>{hasDelivery ? t('onboarding.unified.enabled') : t('onboarding.unified.disabled')}</span>
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
                <ArrowLeft size={16} /> {t('onboarding.unified.back')}
              </button>

              <div className={styles.nextBtnGroup}>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={styles.primaryBtn}
                >
                  <span>{t('onboarding.unified.continue')}</span>
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
                <Target size={15} /> {t('onboarding.unified.s3Badge')}
              </span>
              <h1 className={styles.title}>{t('onboarding.unified.s3Title')}</h1>
              <p className={styles.subtitle}>
                {t('onboarding.unified.s3Subtitle')}
              </p>
            </div>

            {/* Objectif principal sur les réseaux */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>{t('onboarding.unified.goalLabel')}</span>
                <span className={styles.optionalTag}>{t('onboarding.unified.oneClick')}</span>
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
                <span>{t('onboarding.unified.targetLabel')}</span>
                <span className={styles.optionalTag}>{t('onboarding.unified.targetMultiple')}</span>
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
                <span>{t('onboarding.unified.toneLabel')}</span>
                <span className={styles.optionalTag}>{t('onboarding.unified.oneClick')}</span>
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
                <ArrowLeft size={16} /> {t('onboarding.unified.back')}
              </button>

              <div className={styles.nextBtnGroup}>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={styles.primaryBtn}
                >
                  <span>{t('onboarding.unified.continue')}</span>
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
                <Palette size={15} /> {t('onboarding.unified.s4Badge')}
              </span>
              <h1 className={styles.title}>{t('onboarding.unified.s4Title')}</h1>
              <p className={styles.subtitle}>
                {t('onboarding.unified.s4Subtitle')}
              </p>
            </div>

            {/* Logo unique */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>{t('onboarding.unified.logoLabel')}</span>
                <span className={styles.optionalTag}>{t('onboarding.unified.optional')}</span>
              </label>
              {logoPreview ? (
                <div className={styles.logoPreviewRow}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPreview} alt={t('onboarding.unified.logoAlt')} className={styles.logoPreviewImg} />
                  <div className={styles.logoPreviewMeta}>
                    <span className={styles.logoPreviewName}>{t('onboarding.unified.logoLoaded')}</span>
                    <button
                      type="button"
                      className={styles.logoRemoveBtn}
                      onClick={() => setLogoPreview(null)}
                    >
                      <X size={13} strokeWidth={2} /> {t('onboarding.unified.logoRemove')}
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
                  <ImageIcon size={22} strokeWidth={1.75} style={{ color: '#8A8A8A' }} />
                  <span className={styles.dropzoneTitle}>{t('onboarding.unified.logoCta')}</span>
                  <span className={styles.dropzoneHint}>{t('onboarding.unified.logoHint')}</span>
                </label>
              )}
            </div>

            {/* Couleurs personnalisées */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>{t('onboarding.unified.brandColorsLabel')}</span>
                <span className={styles.optionalTag}>{t('onboarding.unified.brandColorsMax')}</span>
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
                              title={t('onboarding.unified.colorTitle', { index: idx + 1 })}
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
                              title={t('onboarding.unified.colorRemoveTitle')}
                            >
                              <X size={10} strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          customColors.length === idx && (
                            <label className={styles.colorPickerEmpty} title={t('onboarding.unified.colorAddTitle')}>
                              <input
                                type="color"
                                defaultValue="#1B4332"
                                className={styles.colorInput}
                                onChange={(e) => {
                                  setCustomColors([...customColors, e.target.value]);
                                }}
                              />
                              <Plus size={16} strokeWidth={1.75} style={{ color: '#8A8A8A' }} />
                              <span style={{ fontSize: '0.72rem', color: '#8A8A8A' }}>{t('onboarding.unified.colorAdd')}</span>
                            </label>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Suggestions rapides */}
                <div className={styles.colorSuggestionsRow}>
                  <span className={styles.colorSuggestLabel}>{t('onboarding.unified.colorSuggestions')}</span>
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
                <ArrowLeft size={16} /> {t('onboarding.unified.back')}
              </button>

              <div className={styles.nextBtnGroup}>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={styles.primaryBtn}
                >
                  <span>{t('onboarding.unified.continue')}</span>
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
                <Share2 size={15} /> {t('onboarding.unified.s5Badge')}
              </span>
              <h1 className={styles.title}>{t('onboarding.unified.s5Title')}</h1>
              <p className={styles.subtitle}>
                {t('onboarding.unified.s5Subtitle')}
              </p>
            </div>

            {/* Cartes réseaux sociaux */}
            <div className={styles.socialCardsGrid}>
              {/* Instagram */}
              <div className={styles.socialCardLarge}>
                <div className={styles.socialCardHeader}>
                  <span className={styles.socialIconBoxLarge} style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label={t('onboarding.unified.logoInstagram')}>
                      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.4" cy="6.6" r="1.1" fill="#FFFFFF" stroke="none" />
                    </svg>
                  </span>
                  <div>
                    <div className={styles.socialCardName}>Instagram</div>
                    <div className={styles.socialCardDesc}>{t('onboarding.unified.instaDesc')}</div>
                  </div>
                </div>
                {connectedPlatforms.instagram ? (
                  <div className={styles.socialConnectedRow}>
                    <CheckCircle2 size={14} strokeWidth={1.75} style={{ color: '#16A34A' }} />
                    <span className={styles.socialConnectedLabel}>{t('onboarding.unified.accountLinked')}</span>
                    <button
                      type="button"
                      className={styles.socialDisconnectBtn}
                      onClick={() => handleTogglePlatform('instagram')}
                    >
                      {t('onboarding.unified.unlink')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.socialConnectBtn}
                    onClick={() => handleTogglePlatform('instagram')}
                  >
                    {t('onboarding.unified.connectPlatform', { platform: 'Instagram' })}
                  </button>
                )}
              </div>

              {/* Facebook */}
              <div className={styles.socialCardLarge}>
                <div className={styles.socialCardHeader}>
                  <span className={styles.socialIconBoxLarge} style={{ background: '#1877F2' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF" aria-label={t('onboarding.unified.logoFacebook')}>
                      <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.7-1.6h1.5V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.7H7.8V14h2.7v8h3z" />
                    </svg>
                  </span>
                  <div>
                    <div className={styles.socialCardName}>Facebook</div>
                    <div className={styles.socialCardDesc}>{t('onboarding.unified.fbDesc')}</div>
                  </div>
                </div>
                {connectedPlatforms.facebook ? (
                  <div className={styles.socialConnectedRow}>
                    <CheckCircle2 size={14} strokeWidth={1.75} style={{ color: '#16A34A' }} />
                    <span className={styles.socialConnectedLabel}>{t('onboarding.unified.accountLinked')}</span>
                    <button
                      type="button"
                      className={styles.socialDisconnectBtn}
                      onClick={() => handleTogglePlatform('facebook')}
                    >
                      {t('onboarding.unified.unlink')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.socialConnectBtn}
                    onClick={() => handleTogglePlatform('facebook')}
                  >
                    {t('onboarding.unified.connectPlatform', { platform: 'Facebook' })}
                  </button>
                )}
              </div>

              {/* Google Business */}
              <div className={styles.socialCardLarge}>
                <div className={styles.socialCardHeader}>
                  <span className={styles.socialIconBoxLarge} style={{ background: '#FFFFFF', border: '1.5px solid rgba(13, 13, 13, 0.10)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-label={t('onboarding.unified.logoGoogle')}>
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                  </span>
                  <div>
                    <div className={styles.socialCardName}>Google Business</div>
                    <div className={styles.socialCardDesc}>{t('onboarding.unified.googleDesc')}</div>
                  </div>
                </div>
                {connectedPlatforms.google_business ? (
                  <div className={styles.socialConnectedRow}>
                    <CheckCircle2 size={14} strokeWidth={1.75} style={{ color: '#16A34A' }} />
                    <span className={styles.socialConnectedLabel}>{t('onboarding.unified.accountLinked')}</span>
                    <button
                      type="button"
                      className={styles.socialDisconnectBtn}
                      onClick={() => handleTogglePlatform('google_business')}
                    >
                      {t('onboarding.unified.unlink')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.socialConnectBtn}
                    onClick={() => handleTogglePlatform('google_business')}
                  >
                    {t('onboarding.unified.connectPlatform', { platform: 'Google' })}
                  </button>
                )}
              </div>

              {/* TikTok */}
              <div className={styles.socialCardLarge}>
                <div className={styles.socialCardHeader}>
                  <span className={styles.socialIconBoxLarge} style={{ background: '#010101' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" aria-label={t('onboarding.unified.logoTiktok')}>
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  </span>
                  <div>
                    <div className={styles.socialCardName}>TikTok</div>
                    <div className={styles.socialCardDesc}>{t('onboarding.unified.tiktokDesc')}</div>
                  </div>
                </div>
                {connectedPlatforms.tiktok ? (
                  <div className={styles.socialConnectedRow}>
                    <CheckCircle2 size={14} strokeWidth={1.75} style={{ color: '#16A34A' }} />
                    <span className={styles.socialConnectedLabel}>{t('onboarding.unified.accountLinked')}</span>
                    <button
                      type="button"
                      className={styles.socialDisconnectBtn}
                      onClick={() => handleTogglePlatform('tiktok')}
                    >
                      {t('onboarding.unified.unlink')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.socialConnectBtn}
                    onClick={() => handleTogglePlatform('tiktok')}
                  >
                    {t('onboarding.unified.connectPlatform', { platform: 'TikTok' })}
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
                <ArrowLeft size={16} /> {t('onboarding.unified.back')}
              </button>

              <div className={styles.nextBtnGroup}>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className={styles.skipBtn}
                >
                  {t('onboarding.unified.skipStep')}
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
                      <span>{t('onboarding.unified.finalizing')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('onboarding.unified.finish')}</span>
                      <Check size={16} />
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
