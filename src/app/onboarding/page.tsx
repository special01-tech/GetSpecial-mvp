'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  MapPin,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
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
  const [country, setCountry] = useState('');
  const [customCoords, setCustomCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [detectedGpsInfo, setDetectedGpsInfo] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Type d'établissement
  const [restaurantType, setRestaurantType] = useState('restaurant');
  const [customRestaurantTypeInput, setCustomRestaurantTypeInput] = useState('');
  const selectedTypeItem = ESTABLISHMENT_TYPES.find((et) => et.id === restaurantType) || ESTABLISHMENT_TYPES[0];
  const SelectedTypeIcon = selectedTypeItem ? selectedTypeItem.icon : Utensils;

  // Menu (Lien / Upload)
  const [menuType, setMenuType] = useState<'none' | 'link' | 'file'>('none');
  const [menuUrl, setMenuUrl] = useState('');
  const [menuFileName, setMenuFileName] = useState('');
  // Extraction IA du menu pendant l'onboarding
  const [isExtractingMenu, setIsExtractingMenu] = useState(false);
  const [menuRawSummary, setMenuRawSummary] = useState('');
  const [menuMetadataState, setMenuMetadataState] = useState(null);
  const [scrapedOpeningHoursRaw, setScrapedOpeningHoursRaw] = useState(null);
  const addressDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuExtractionNotice, setMenuExtractionNotice] = useState<string | null>(null);
  const [extractedMenuDishes, setExtractedMenuDishes] = useState<any[]>([]);
  const [extractedMenuOffers, setExtractedMenuOffers] = useState<any[]>([]);

  // Équipements & Paramètres Métier (Saisis par le restaurateur)
  const [hasTerrace, setHasTerrace] = useState(true);
  const [hasDelivery, setHasDelivery] = useState(false);
  const [capacityCovers, setCapacityCovers] = useState('45');
  const [offPeakDays, setOffPeakDays] = useState<string[]>(['Lundi', 'Mardi']);
  const [averageTicket, setAverageTicket] = useState('26');

  const toggleOffPeakDay = (day: string) => {
    setOffPeakDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Recherche Google Places & Établissement lié
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [isScrapingPlace, setIsScrapingPlace] = useState(false);
  const [scrapingPlaceId, setScrapingPlaceId] = useState<string | null>(null);
  const [scrapedNotice, setScrapedNotice] = useState<string | null>(null);
  const [googleResults, setGoogleResults] = useState<RestaurantSearchResult[]>([]);
  const [hasSearchedGoogle, setHasSearchedGoogle] = useState(false);
  const [selectedGooglePlace, setSelectedGooglePlace] = useState<RestaurantSearchResult | null>(null);
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [openingHoursText, setOpeningHoursText] = useState('');

  // Suggestions d'adresses en direct (si saisie manuelle)
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // --- SECTION 3 : COMMUNICATION & OBJECTIFS ---
  const [marketingGoal, setMarketingGoal] = useState('more_clients');
  const [targetAudiences, setTargetAudiences] = useState<string[]>(['young_pros', 'families']);
  const [tone, setTone] = useState('chaleureux');

  const selectedGoalItem = MARKETING_GOALS.find((g) => g.id === marketingGoal) || MARKETING_GOALS[0];
  const SelectedGoalIcon = selectedGoalItem ? selectedGoalItem.icon : Target;

  const selectedToneItem = TONE_OPTIONS.find((t) => t.id === tone) || TONE_OPTIONS[0];
  const SelectedToneIcon = selectedToneItem ? selectedToneItem.icon : Sun;

  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);
  const targetDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(event.target as Node)) {
        setIsTargetDropdownOpen(false);
      }
    }
    if (isTargetDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTargetDropdownOpen]);

  // --- SECTION 4 : MARQUE & BRANDING ---
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [customColors, setCustomColors] = useState<string[]>(['#1B4332', '#FAEDCD']);

  // --- SECTION 5 : RÉSEAUX SOCIAUX (CONNEXION RÉELLE OAUTH) ---
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({
    instagram: false,
    facebook: false,
    google_business: false,
  });
  const [connectedHandles, setConnectedHandles] = useState<Record<string, string>>({});
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  // Restaurer les infos locales ou initialiser
  useEffect(() => {
    try {
      // 1. Restaurer le brouillon complet de l'onboarding si retour de redirection OAuth
      const draftStr = localStorage.getItem('getspecial_onboarding_draft');
      if (draftStr) {
        try {
          const d = JSON.parse(draftStr);
          if (d.name) setName(d.name);
          if (d.restaurantType) setRestaurantType(d.restaurantType);
          if (d.customRestaurantTypeInput) setCustomRestaurantTypeInput(d.customRestaurantTypeInput);
          if (d.address) setAddress(d.address);
          if (d.city) setCity(d.city);
          if (d.postalCode) setPostalCode(d.postalCode);
          if (d.country) setCountry(d.country);
          if (d.customCoords) setCustomCoords(d.customCoords);
          if (d.detectedGpsInfo) setDetectedGpsInfo(d.detectedGpsInfo);
          if (d.selectedGooglePlace) setSelectedGooglePlace(d.selectedGooglePlace);
          if (d.hasTerrace !== undefined) setHasTerrace(d.hasTerrace);
          if (d.hasDelivery !== undefined) setHasDelivery(d.hasDelivery);
          if (d.capacityCovers) setCapacityCovers(d.capacityCovers);
          if (d.averageTicket) setAverageTicket(d.averageTicket);
          if (d.offPeakDays) setOffPeakDays(d.offPeakDays);
          if (d.marketingGoal) setMarketingGoal(d.marketingGoal);
          if (d.targetAudiences) setTargetAudiences(d.targetAudiences);
          if (d.tone) setTone(d.tone);
          if (d.logoPreview) setLogoPreview(d.logoPreview);
          if (d.customColors) setCustomColors(d.customColors);
          if (d.menuType) setMenuType(d.menuType);
          if (d.menuUrl) setMenuUrl(d.menuUrl);
          if (d.menuFileName) setMenuFileName(d.menuFileName);
          if (d.extractedMenuDishes) setExtractedMenuDishes(d.extractedMenuDishes);
          if (d.extractedMenuOffers) setExtractedMenuOffers(d.extractedMenuOffers);
          if (d.menuRawSummary) setMenuRawSummary(d.menuRawSummary);
          if (d.menuMetadataState) setMenuMetadataState(d.menuMetadataState);
          if (d.scrapedOpeningHoursRaw) setScrapedOpeningHoursRaw(d.scrapedOpeningHoursRaw);
          if (d.connectedPlatforms) setConnectedPlatforms(d.connectedPlatforms);
          if (d.connectedHandles) setConnectedHandles(d.connectedHandles);
          if (d.phone) setPhone(d.phone);
          if (d.website) setWebsite(d.website);
          if (d.openingHoursText) setOpeningHoursText(d.openingHoursText);
          if (d.scrapedNotice) setScrapedNotice(d.scrapedNotice);
        } catch {}
      }

      // 2. Détection du retour d'autorisation OAuth dans l'URL (?connection=success ou ?connection=error)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const connectionStatus = urlParams.get('connection');
        const platform = urlParams.get('platform');
        const username = urlParams.get('username');
        const errorMsg = urlParams.get('message');
        const stepParam = urlParams.get('step');

        if (stepParam === '5' || connectionStatus) {
          setCurrentStep(5);
        }

        if (connectionStatus === 'success' && platform) {
          const displayPlatform = platform === 'google_business' ? 'Google Business' : platform.toUpperCase();
          const accountHandle = username ? ` (${username})` : '';
          setConnectedPlatforms((prev) => {
            const next = { ...prev, [platform]: true };
            try {
              const draftStr = localStorage.getItem('getspecial_onboarding_draft');
              if (draftStr) {
                const draft = JSON.parse(draftStr);
                draft.connectedPlatforms = next;
                if (username) {
                  draft.connectedHandles = { ...(draft.connectedHandles || {}), [platform]: username };
                }
                localStorage.setItem('getspecial_onboarding_draft', JSON.stringify(draft));
              }
            } catch {}
            return next;
          });
          if (username) {
            setConnectedHandles((prev) => ({ ...prev, [platform]: username }));
          }
          setSocialNotice(`🎉 Compte ${displayPlatform}${accountHandle} relié avec succès via OAuth Direct !`);
          window.history.replaceState({}, '', '/onboarding?step=5');
          setTimeout(() => setSocialNotice(null), 5000);
        } else if (connectionStatus === 'error') {
          setSocialError(`⚠️ Échec de connexion OAuth : ${errorMsg || 'Autorisation non accordée'}`);
          window.history.replaceState({}, '', '/onboarding?step=5');
          setTimeout(() => setSocialError(null), 6000);
        }
      }

      const savedRestName = localStorage.getItem('getspecial_new_restaurant_name');
      if (savedRestName && savedRestName.trim()) {
        setName(savedRestName.trim());
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
          const res = await fetch(`/api/geocode?mode=reverse&lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const json = await res.json();
            const data = json.data || json;
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

  // Autocomplétion d'adresse avec proxy serveur et debounce 350ms
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddress(val);

    if (addressDebounceRef.current) {
      clearTimeout(addressDebounceRef.current);
    }

    if (val.trim().length >= 3) {
      setIsSearchingAddress(true);
      addressDebounceRef.current = setTimeout(async () => {
        try {
          const countryParam = country ? `&country=${country.toLowerCase()}` : '';
          const res = await fetch(`/api/geocode?mode=search&q=${encodeURIComponent(val.trim())}${countryParam}`);
          if (res.ok) {
            const json = await res.json();
            const places = json.data || json;
            if (Array.isArray(places)) {
              const mapped: AddressSuggestion[] = places.map((p: any) => {
                const a = p.address || {};
                const street = [a.house_number, a.road].filter(Boolean).join(' ') || p.name || val;
                const detectedCity = a.city || a.town || a.village || a.municipality || '';
                const cCode = (a.country_code || country || 'FR').toUpperCase();
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
      }, 350);
    } else {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
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
      const res = await fetch(`/api/geocode?mode=search&q=${encodeURIComponent(city.trim())}`);
      if (res.ok) {
        const json = await res.json();
        const places = json.data || json;
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

  // Sélection d'un établissement Google Places (Magic Fill en 2 étapes)
  const handleSelectGooglePlace = async (place: RestaurantSearchResult) => {
    setIsScrapingPlace(true);
    setScrapingPlaceId(place.id);
    setErrorMsg(null);
    setScrapedNotice(null);

    // 1. Remplissage optimiste immédiat avec les données de base de l'occurrence
    setSelectedGooglePlace(place);
    if (place.name) setName(place.name);
    if (place.city) setCity(place.city);
    if (place.country) setCountry(place.country.toUpperCase());
    if (place.address) setAddress(place.address);
    if (place.postalCode) setPostalCode(place.postalCode);
    if (place.latitude && place.longitude) {
      setCustomCoords({ lat: place.latitude, lon: place.longitude });
      setDetectedGpsInfo(`${place.city || city}, ${place.country || country}`);
    }
    if (place.phone) setPhone(place.phone);
    if (place.hasTerrace !== undefined) setHasTerrace(Boolean(place.hasTerrace));
    if (place.hasDelivery !== undefined) setHasDelivery(Boolean(place.hasDelivery));
    if (place.photoUrl && !place.photoUrl.includes('unsplash.com')) {
      setLogoPreview(place.photoUrl);
    }

    const initialInferred = inferRestaurantTypeFromCategory(`${place.cuisineType || ''} ${place.name}`);
    setRestaurantType(initialInferred);

    // S'assurer que le bloc d'adresse modifiable reste visible et accessible à l'utilisateur
    setShowManualAddress(true);

    // 2. Scraping ciblé et approfondi de la fiche sélectionnée
    try {
      const scrapeRes = await restaurantSearchService.scrapePlace(place);
      if (scrapeRes.success && scrapeRes.data) {
        const d = scrapeRes.data;
        if (d.name) setName(d.name);
        if (d.city) setCity(d.city);
        if (d.country) setCountry(d.country.toUpperCase());
        if (d.address) setAddress(d.address);
        if (d.postalCode) setPostalCode(d.postalCode);
        if (d.latitude != null && d.longitude != null) {
          setCustomCoords({ lat: Number(d.latitude), lon: Number(d.longitude) });
          setDetectedGpsInfo(`${d.city || place.city || city}, ${d.country || place.country || country}`);
        }
        if (d.type || d.categories?.length) {
          const catStr = [d.type, ...(d.categories || [])].filter(Boolean).join(' ');
          setRestaurantType(inferRestaurantTypeFromCategory(catStr || d.name));
        }
        if (d.hasTerrace !== undefined) setHasTerrace(Boolean(d.hasTerrace));
        if (d.hasDelivery !== undefined) setHasDelivery(Boolean(d.hasDelivery));
        if (d.phone) setPhone(d.phone);
        if (d.website) setWebsite(d.website);
        if (d.openingHours) {
          setScrapedOpeningHoursRaw(d.openingHours);
          let oh = '';
          if (typeof d.openingHours === 'string') {
            oh = d.openingHours;
          } else if (Array.isArray(d.openingHours)) {
            oh = d.openingHours.map((h: any) => `${h.day}: ${h.hours}`).join(' • ');
          } else if (d.openingHours.rawText) {
            oh = d.openingHours.rawText;
          }
          setOpeningHoursText(oh);
        }
        if (d.photoUrl && !d.photoUrl.includes('unsplash.com')) {
          setLogoPreview(d.photoUrl);
        }

        setSelectedGooglePlace((prev) => ({
          ...(prev || place),
          ...d,
        }));

        setScrapedNotice(
          '✨ Profil Google Maps importé : adresse, coordonnées GPS, concept et équipements renseignés automatiquement.'
        );
      }
    } catch (err) {
      console.warn('[SELECT_GOOGLE_PLACE_SCRAPE_ERROR]', err);
    } finally {
      setIsScrapingPlace(false);
      setScrapingPlaceId(null);
      setGoogleResults([]); // Fermer la liste des résultats après sélection
    }
  };

  // Réinitialiser la sélection pour chercher un autre établissement
  const handleClearSelectedPlace = () => {
    setSelectedGooglePlace(null);
    setScrapedNotice(null);
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

  // Extraction IA du menu lors de l'upload dans l'onboarding (PDF & Image uniquement)
  const extractMenuFile = async (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      setMenuExtractionNotice('Format non supporté. Veuillez importer un fichier PDF ou une image (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setMenuExtractionNotice('Ce fichier dépasse la taille maximale autorisée de 15 Mo.');
      return;
    }

    setMenuFileName(file.name);
    setIsExtractingMenu(true);
    setMenuExtractionNotice('Analyse IA du menu en cours...');

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/menu/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceType: isPdf ? 'pdf' : 'image',
            fileName: file.name,
            fileBase64: base64,
            restaurantName: name.trim() || 'Restaurant',
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          const { dishes, extractedOffers, rawSummary, menuMetadata } = json.data;
          const safeDishes = dishes || [];
          const safeOffers = extractedOffers || [];
          setExtractedMenuDishes(safeDishes);
          setExtractedMenuOffers(safeOffers);
          setMenuRawSummary(rawSummary || '');
          setMenuMetadataState(menuMetadata || null);

          // Persistance locale immédiate (zéro perte de données en cas de reload)
          if (typeof window !== 'undefined') {
            localStorage.setItem('getspecial_restaurant_dishes', JSON.stringify(safeDishes));
            localStorage.setItem('getspecial_restaurant_offers', JSON.stringify(safeOffers));
            if (menuMetadata) {
              localStorage.setItem('getspecial_restaurant_menu', JSON.stringify(menuMetadata));
            }
          }

          // Persistance immédiate en base de données si un restaurantId existe déjà
          const existingRestId = typeof window !== 'undefined' ? localStorage.getItem('getspecial_restaurant_id') : null;
          if (existingRestId && existingRestId !== 'rest_onboarding_temp') {
            fetch(`/api/restaurants/${existingRestId}/dishes`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dishes: safeDishes,
                rawSummary: rawSummary || null,
                menuMetadata: menuMetadata || null,
              }),
            }).catch(e => console.warn('[AUTO_SAVE_DISHES_WARN]', e));
          }

          setMenuExtractionNotice(
            `✨ Menu analysé : ${safeDishes.length} plat(s) et ${safeOffers.length} offre(s) détecté(s).`
          );
        } else {
          setMenuExtractionNotice(
            json?.error || 'L’analyse du menu n’a pas abouti. Vous pourrez importer votre carte dans Mon Resto.'
          );
        }
      } catch {
        setMenuExtractionNotice('Erreur réseau lors de l’analyse. Vous pourrez réessayer dans Mon Resto.');
      } finally {
        setIsExtractingMenu(false);
      }
    };
    reader.onerror = () => {
      setMenuExtractionNotice('Erreur de lecture du fichier.');
      setIsExtractingMenu(false);
    };
    reader.readAsDataURL(file);
  };

  const saveOnboardingDraft = () => {
    if (typeof window === 'undefined') return;
    const draft = {
      name,
      restaurantType,
      customRestaurantTypeInput,
      address,
      city,
      postalCode,
      country,
      customCoords,
      detectedGpsInfo,
      selectedGooglePlace,
      hasTerrace,
      hasDelivery,
      capacityCovers,
      averageTicket,
      offPeakDays,
      marketingGoal,
      targetAudiences,
      tone,
      logoPreview,
      customColors,
      menuType,
      menuUrl,
      menuFileName,
      connectedPlatforms,
      connectedHandles,
      phone,
      website,
      openingHoursText,
      scrapedNotice,
    };
    localStorage.setItem('getspecial_onboarding_draft', JSON.stringify(draft));
  };

  // Vraie connexion / Déconnexion OAuth pour les réseaux sociaux
  const handleTogglePlatform = async (platform: string) => {
    setSocialError(null);
    setSocialNotice(null);

    const isConnected = Boolean(connectedPlatforms[platform]);

    if (isConnected) {
      // Déconnexion réelle
      try {
        const restId = localStorage.getItem('getspecial_restaurant_id') || 'rest_onboarding_temp';
        await fetch('/api/social-connections', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantId: restId, platform }),
        });
      } catch {}

      setConnectedPlatforms((prev) => {
        const next = { ...prev, [platform]: false };
        try {
          const draftStr = localStorage.getItem('getspecial_onboarding_draft');
          if (draftStr) {
            const draft = JSON.parse(draftStr);
            draft.connectedPlatforms = next;
            if (draft.connectedHandles) {
              delete draft.connectedHandles[platform];
            }
            localStorage.setItem('getspecial_onboarding_draft', JSON.stringify(draft));
          }
        } catch {}
        return next;
      });
      setConnectedHandles((prev) => {
        const next = { ...prev };
        delete next[platform];
        return next;
      });
      setSocialNotice(`Compte ${platform.toUpperCase()} dissocié.`);
      setTimeout(() => setSocialNotice(null), 3500);
    } else {
      // Initier le flux OAuth Direct réel vers le fournisseur
      setConnectingPlatform(platform);
      saveOnboardingDraft();

      try {
        // Enregistrer d'abord l'établissement en base pour avoir son VRAI restaurantId
        let restId = localStorage.getItem('getspecial_restaurant_id');
        if (!restId || restId === 'rest_onboarding_temp') {
          const initRes = await fetch('/api/restaurants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name.trim() || 'Mon Restaurant',
              type: restaurantType,
              address: address.trim() || `${name.trim() || 'Restaurant'}, ${city.trim() || 'Paris'}`,
              city: city.trim() || undefined,
              postalCode: postalCode ? postalCode.trim() : undefined,
              country: country.trim().toUpperCase() || 'FR',
              latitude: customCoords?.lat,
              longitude: customCoords?.lon,
              timezone: typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Europe/Paris',
              tone,
              hasTerrace,
              hasDelivery,
              capacityCovers: parseInt(capacityCovers, 10) || undefined,
              averageTicket: parseFloat(averageTicket) || undefined,
              offPeakDays,
              marketingGoal,
              targetAudience: targetAudiences,
              logoUrl: logoPreview || undefined,
              brandColors: customColors.filter(Boolean),
              dishes: extractedMenuDishes.length > 0 ? extractedMenuDishes : undefined,
              extractedOffers: extractedMenuOffers.length > 0 ? extractedMenuOffers : undefined,
              rawSummary: menuRawSummary || undefined,
              menuMetadata: menuMetadataState || undefined,
            }),
          });
          const initJson = await initRes.json().catch(() => null);
          if (initRes.ok && initJson?.data?.id) {
            restId = String(initJson.data.id);
            localStorage.setItem('getspecial_restaurant_id', restId);
          }
        }

        const effectiveRestId = restId || 'rest_onboarding_temp';
        const res = await fetch(
          `/api/social/connect?platform=${platform}&restaurantId=${effectiveRestId}&returnUrl=${encodeURIComponent('/onboarding?step=5')}`
        );
        const json = await res.json();

        if (res.ok && json.success && json.data?.url) {
          // Redirection vers le fournisseur officiel (accounts.google.com ou facebook.com)
          window.location.href = json.data.url;
        } else {
          throw new Error(json.error || json.message || `Impossible d’initialiser la connexion OAuth pour ${platform}.`);
        }
      } catch (err: any) {
        setSocialError(err.message || 'Une erreur est survenue lors de la tentative de connexion.');
        setConnectingPlatform(null);
      }
    }
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

  // Passer et compléter plus tard (non bloquant, sauvegarde intégrale des données déjà acquises)
  const handleSkipLater = async () => {
    setIsSubmitting(true);
    try {
      if (name.trim()) {
        const clientTz = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Europe/Paris';
        const signatureDishes = extractedMenuDishes
          .filter((d: any) => d.isSignature)
          .map((d: any) => d.name)
          .slice(0, 5);
        const derivedSpecialties = signatureDishes.length > 0
          ? signatureDishes
          : extractedMenuDishes.slice(0, 4).map((d: any) => d.name);

        const res = await fetch('/api/restaurants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            type: restaurantType || 'restaurant',
            address: address.trim() || `${name.trim()}, ${city.trim() || 'Paris'}`,
            city: city.trim() || undefined,
            postalCode: postalCode ? postalCode.trim() : undefined,
            country: country.trim().toUpperCase() || 'FR',
            latitude: customCoords?.lat,
            longitude: customCoords?.lon,
            timezone: clientTz,
            phone: phone.trim() || undefined,
            website: website.trim() || undefined,
            hasTerrace,
            hasDelivery,
            capacityCovers: parseInt(capacityCovers, 10) || undefined,
            averageTicket: parseFloat(averageTicket) || undefined,
            offPeakDays,
            marketingGoal,
            targetAudience: targetAudiences,
            specialties: derivedSpecialties.length > 0 ? derivedSpecialties : undefined,
            menuUrl: menuFileName ? `menu://${menuFileName}` : undefined,
            rawSummary: menuRawSummary || undefined,
            menuMetadata: menuMetadataState || undefined,
            dishes: extractedMenuDishes.length > 0 ? extractedMenuDishes : undefined,
            extractedOffers: extractedMenuOffers.length > 0 ? extractedMenuOffers : undefined,
          }),
        });
        const json = await res.json().catch(() => null);
        if (json?.data?.id) {
          localStorage.setItem('getspecial_restaurant_id', json.data.id);
          localStorage.setItem('getspecial_selected_restaurant', JSON.stringify(json.data));
        }
      }
      localStorage.setItem('getspecial_onboarding_completed', 'true');
      localStorage.setItem('getspecial_restaurant_status', 'active');
      localStorage.removeItem('getspecial_onboarding_draft');
      localStorage.removeItem('getspecial_onboarding_step');
      localStorage.removeItem('getspecial_new_restaurant_name');
      router.replace('/dashboard');
    } catch {
      localStorage.setItem('getspecial_onboarding_completed', 'true');
      router.replace('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Soumission finale et création vérifiée en base (zéro échec silencieux)
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const storedUser = localStorage.getItem('getspecial_auth_user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      // Coordonnées GPS réelles (pas de fallback 48.8566 qui écrasait la ville saisie)
      const lat = customCoords?.lat ?? selectedGooglePlace?.latitude;
      const lon = customCoords?.lon ?? selectedGooglePlace?.longitude;

      const formattedAddress =
        address.trim() ||
        selectedGooglePlace?.address ||
        [name.trim(), city.trim(), postalCode.trim()].filter(Boolean).join(', ');

      const finalType =
        restaurantType === 'autre' && customRestaurantTypeInput.trim()
          ? customRestaurantTypeInput.trim()
          : restaurantType;

      const finalPhotos =
        selectedGooglePlace?.photoUrl && !selectedGooglePlace.photoUrl.includes('unsplash.com')
          ? [selectedGooglePlace.photoUrl]
          : [];

      const parsedCapacity = parseInt(capacityCovers, 10);
      const parsedAverageTicket = parseFloat(averageTicket);

      const socialAccountsPayload = Object.entries(connectedPlatforms)
        .filter(([_, isConn]) => isConn)
        .map(([plat]) => ({
          platform: plat,
          username: connectedHandles[plat] || undefined,
          status: 'connected',
        }));

      const clientTz = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Europe/Paris';

      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type: finalType,
          address: formattedAddress || `${name.trim()}, ${city.trim()}`,
          city: city.trim() || undefined,
          postalCode: postalCode ? postalCode.trim() : undefined,
          googlePlaceId: (selectedGooglePlace as any)?.placeId || undefined,
          latitude: lat,
          longitude: lon,
          timezone: clientTz,
          country: country.trim().toUpperCase() || 'FR',
          userId: parsedUser?.id || undefined,
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
          openingHours: scrapedOpeningHoursRaw || selectedGooglePlace?.openingHours || undefined,
          specialties: ((selectedGooglePlace as any)?.specialties?.length ? (selectedGooglePlace as any).specialties : (
            extractedMenuDishes.filter((d: any) => d.isSignature).map((d: any) => d.name).slice(0, 5).length
              ? extractedMenuDishes.filter((d: any) => d.isSignature).map((d: any) => d.name).slice(0, 5)
              : extractedMenuDishes.slice(0, 4).map((d: any) => d.name)
          )),
          tone,
          hasTerrace,
          hasDelivery,
          capacityCovers: !isNaN(parsedCapacity) && parsedCapacity > 0 ? parsedCapacity : undefined,
          offPeakDays,
          averageTicket: !isNaN(parsedAverageTicket) && parsedAverageTicket > 0 ? parsedAverageTicket : undefined,
          targetAudience: targetAudiences,
          marketingGoal,
          logoUrl: logoPreview || undefined,
          photos: finalPhotos,
          brandColors: customColors.filter(Boolean),
          menuUrl: menuFileName ? `menu://${menuFileName}` : undefined,
          rawSummary: menuRawSummary || undefined,
          menuMetadata: menuMetadataState || undefined,
          socialAccounts: socialAccountsPayload,
          dishes: extractedMenuDishes.length > 0 ? extractedMenuDishes : undefined,
          extractedOffers: extractedMenuOffers.length > 0 ? extractedMenuOffers : undefined,
        }),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.error || 'Impossible d’enregistrer votre établissement pour le moment. Veuillez vérifier les champs saisis.'
        );
      }

      if (json.data?.id) {
        localStorage.setItem('getspecial_restaurant_id', json.data.id);
        localStorage.setItem('getspecial_selected_restaurant', JSON.stringify(json.data));
      }

      // Nettoyage définitif du brouillon
      localStorage.setItem('getspecial_onboarding_completed', 'true');
      localStorage.setItem('getspecial_restaurant_status', 'active');
      localStorage.removeItem('getspecial_onboarding_step');
      localStorage.removeItem('getspecial_onboarding_draft');
      localStorage.removeItem('getspecial_new_restaurant_name');

      await new Promise((resolve) => setTimeout(resolve, 400));
      router.replace('/dashboard');
    } catch (err: any) {
      console.error('[ONBOARDING_FINAL_ERROR]', err);
      setErrorMsg(err.message || 'Une erreur est survenue lors de l’enregistrement. Veuillez réessayer.');
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
                  <span className={styles.stepTitle}>
                    <span className={styles.stepTitleFull}>{s.label}</span>
                    <span className={styles.stepTitleShort}>{s.shortLabel}</span>
                  </span>
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
                    disabled={!name.trim() || isSearchingGoogle || isScrapingPlace}
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

                  {/* Indicateur de recherche des occurrences */}
                  {isSearchingGoogle && (
                    <div className={styles.googleSearchLoading}>
                      <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>{t('onboarding.unified.searchingLive')}</span>
                    </div>
                  )}

                  {/* Bandeau pendant le scraping de la fiche validée */}
                  {isScrapingPlace && (
                    <div className={styles.scrapingIndicatorBanner}>
                      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Récupération approfondie des données de l&apos;établissement (adresse, terrasse, services)...</span>
                    </div>
                  )}

                  {/* Liste des résultats / candidats découverts */}
                  {googleResults.length > 0 && (
                    <div className={styles.googleResultsList}>
                      {googleResults.map((place) => {
                        const isThisScraping = isScrapingPlace && scrapingPlaceId === place.id;
                        return (
                          <div
                            key={place.id}
                            className={styles.googleResultCard}
                            onClick={() => !isScrapingPlace && handleSelectGooglePlace(place)}
                            style={{ cursor: isScrapingPlace ? 'wait' : 'pointer' }}
                          >
                            {place.photoUrl && !place.photoUrl.includes('unsplash.com') ? (
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
                                {place.rating ? (
                                  <span className={styles.googleResultRating}>
                                    <Star size={11} fill="#FF5A00" stroke="#FF5A00" />
                                    <span>{place.rating}</span>
                                    {place.reviewsCount ? (
                                      <span style={{ color: '#8A8A8A', fontWeight: 400 }}>({place.reviewsCount})</span>
                                    ) : null}
                                  </span>
                                ) : null}
                                {place.isOpenNow !== undefined && (
                                  <span className={place.isOpenNow ? styles.openBadge : styles.closedBadge}>
                                    {place.isOpenNow ? t('onboarding.unified.openBadge') : t('onboarding.unified.closedBadge')}
                                  </span>
                                )}
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
                            <button
                              type="button"
                              className={styles.candidateSelectBtn}
                              disabled={isScrapingPlace}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectGooglePlace(place);
                              }}
                            >
                              {isThisScraping ? (
                                <>
                                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                  <span>Importation...</span>
                                </>
                              ) : (
                                <>
                                  <Check size={12} strokeWidth={2.5} />
                                  <span>Sélectionner</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
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
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setAddress(city ? `${name}, ${city}` : name);
                            setShowManualAddress(true);
                            setHasSearchedGoogle(false);
                          }}
                          style={{
                            background: '#FF5A00',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Continuer avec &quot;{name}&quot;
                        </button>
                        <button
                          type="button"
                          className={styles.manualAddressBtn}
                          onClick={() => setShowManualAddress(true)}
                        >
                          {t('onboarding.unified.manualAddressBtn')}
                        </button>
                      </div>
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
                    <div className={styles.editableAddressCard}>
                      <div className={styles.editableAddressHeader}>
                        <span className={styles.editableAddressTitle}>
                          <MapPin size={15} strokeWidth={2} style={{ color: '#FF5A00' }} />
                          <span>{t('onboarding.unified.manualAddressLabel')}</span>
                        </span>
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

                      {addressSuggestions.length > 0 && (
                        <div className={styles.addressSuggestionsList}>
                          {addressSuggestions.map((sug, idx) => (
                            <div
                              key={idx}
                              className={styles.addressSuggestionItem}
                              onClick={() => handleSelectSuggestion(sug)}
                            >
                              <MapPin size={14} className={styles.addressSuggestionIcon} />
                              <div>
                                <div className={styles.addressSuggestionTitle}>{sug.title}</div>
                                <div className={styles.addressSuggestionSub}>{sug.subtitle}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={styles.formRow} style={{ marginTop: '2px' }}>
                        <div style={{ flex: 1 }}>
                          <label className={styles.label} style={{ fontSize: '0.74rem', marginBottom: '2px' }}>
                            Code postal
                          </label>
                          <input
                            type="text"
                            placeholder="Ex. 75001"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            className={styles.input}
                            style={{ padding: '8px 10px', fontSize: '0.84rem' }}
                          />
                        </div>

                        {customCoords && (
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span className={styles.label} style={{ fontSize: '0.74rem', marginBottom: '2px' }}>
                              Coordonnées GPS
                            </span>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.76rem',
                              color: '#166534',
                              background: '#f0fdf4',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid #bbf7d0',
                              fontWeight: 500,
                            }}>
                              <Navigation size={12} strokeWidth={2} />
                              <span>{customCoords.lat.toFixed(4)}, {customCoords.lon.toFixed(4)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Carte d'établissement lié à Google Places + Champs toujours éditables */
                <>
                  <div className={styles.selectedPlaceCard}>
                    <div className={styles.selectedPlaceLeft}>
                      {selectedGooglePlace.photoUrl && !selectedGooglePlace.photoUrl.includes('unsplash.com') ? (
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
                            {selectedGooglePlace.id.startsWith('google_') ? (
                              <>
                                <Check size={11} strokeWidth={2.5} /> {t('onboarding.unified.linkedToGoogle')}
                              </>
                            ) : selectedGooglePlace.id.startsWith('place_osm_') ? (
                              <>
                                <Check size={11} strokeWidth={2.5} /> Vérifié OpenStreetMap
                              </>
                            ) : (
                              <>
                                <Store size={11} strokeWidth={2.5} /> Fiche personnalisée
                              </>
                            )}
                          </span>
                        </div>
                        <div className={styles.selectedPlaceSub}>
                          {selectedGooglePlace.rating ? (
                            <>
                              <Star size={11} fill="#FF5A00" stroke="#FF5A00" />
                              <span style={{ fontWeight: 600, color: '#E04F00' }}>{selectedGooglePlace.rating}</span>
                              {selectedGooglePlace.reviewsCount ? (
                                <span style={{ color: '#8A8A8A', fontWeight: 400 }}>({selectedGooglePlace.reviewsCount})</span>
                              ) : null}
                              <span>•</span>
                            </>
                          ) : null}
                          <span>{selectedGooglePlace.cuisineType || t('onboarding.unified.defaultCategory')}</span>
                          {selectedGooglePlace.address && (
                            <>
                              <span>•</span>
                              <MapPin size={11} strokeWidth={1.75} />
                              <span>{selectedGooglePlace.address}</span>
                            </>
                          )}
                        </div>

                        {/* Badges des caractéristiques détectées automatiquement */}
                        <div className={styles.selectedPlaceFeatures}>
                          {hasTerrace && (
                            <span className={styles.detectedFeatureTag}>
                              <Sun size={10} strokeWidth={2} /> Terrasse détectée
                            </span>
                          )}
                          {hasDelivery && (
                            <span className={styles.detectedFeatureTag}>
                              <Bike size={10} strokeWidth={2} /> Livraison détectée
                            </span>
                          )}
                          {customCoords && (
                            <span className={styles.detectedFeatureTag}>
                              <Navigation size={10} strokeWidth={2} /> Coordonnées GPS vérifiées
                            </span>
                          )}
                          {phone && (
                            <span className={styles.detectedFeatureTag}>
                              <Phone size={10} strokeWidth={2} /> {phone}
                            </span>
                          )}
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

                  {/* Bandeau d'information : les données sont pré-remplies et modifiables */}
                  <div className={styles.scrapedNoticeBox}>
                    <Sparkles size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: '2px', color: '#16a34a' }} />
                    <div>
                      <strong>Informations importées de Google Maps :</strong> vos coordonnées ont été remplies automatiquement ci-dessous. Vous pouvez les ajuster à tout moment.
                    </div>
                  </div>

                  {/* Champs d'adresse et de coordonnées complètement visibles et éditables */}
                  <div className={styles.editableAddressCard}>
                    <div className={styles.editableAddressHeader}>
                      <span className={styles.editableAddressTitle}>
                        <MapPin size={15} strokeWidth={2} style={{ color: '#FF5A00' }} />
                        <span>Adresse & localisation de l&apos;établissement</span>
                      </span>
                      <span className={styles.editableAddressBadge}>Modifiable</span>
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

                    {addressSuggestions.length > 0 && (
                      <div className={styles.addressSuggestionsList}>
                        {addressSuggestions.map((sug, idx) => (
                          <div
                            key={idx}
                            className={styles.addressSuggestionItem}
                            onClick={() => handleSelectSuggestion(sug)}
                          >
                            <MapPin size={14} className={styles.addressSuggestionIcon} />
                            <div>
                              <div className={styles.addressSuggestionTitle}>{sug.title}</div>
                              <div className={styles.addressSuggestionSub}>{sug.subtitle}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={styles.formRow} style={{ marginTop: '2px' }}>
                      <div style={{ flex: 1 }}>
                        <label className={styles.label} style={{ fontSize: '0.74rem', marginBottom: '2px' }}>
                          Code postal
                        </label>
                        <input
                          type="text"
                          placeholder="Ex. 75001 ou BP..."
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className={styles.input}
                          style={{ padding: '8px 10px', fontSize: '0.84rem' }}
                        />
                      </div>

                      {customCoords && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <span className={styles.label} style={{ fontSize: '0.74rem', marginBottom: '2px' }}>
                            Position GPS
                          </span>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.76rem',
                            color: '#166534',
                            background: '#f0fdf4',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid #bbf7d0',
                            fontWeight: 500,
                          }}>
                            <Navigation size={12} strokeWidth={2} />
                            <span>{customCoords.lat.toFixed(4)}, {customCoords.lon.toFixed(4)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {errorMsg && (
              <div className={styles.errorBox}>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Navigation Section 1 avec option passer */}
            <div className={styles.footerActions}>
              <button
                type="button"
                onClick={handleSkipLater}
                disabled={isSubmitting}
                className={styles.skipBtn}
              >
                Passer et compléter plus tard
              </button>
              <div className={styles.nextBtnGroup}>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isSubmitting}
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

            {/* Type d'établissement (Liste déroulante en 1 clic) */}
            <div className={styles.fieldGroup}>
              <label htmlFor="restaurantTypeSelect" className={styles.label}>
                <span>{t('onboarding.unified.establishmentTypeLabel')}</span>
                <span className={styles.optionalTag}>{t('onboarding.unified.oneClick')}</span>
              </label>

              <div className={styles.selectWrapper}>
                <SelectedTypeIcon size={16} strokeWidth={1.75} className={styles.inputIcon} />
                <select
                  id="restaurantTypeSelect"
                  value={restaurantType}
                  onChange={(e) => setRestaurantType(e.target.value)}
                  className={styles.selectInput}
                >
                  {ESTABLISHMENT_TYPES.map((et) => (
                    <option key={et.id} value={et.id} className={styles.selectOption}>
                      {et.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} strokeWidth={2} className={styles.selectArrow} />
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

            {/* Menu / Carte du restaurant (Direct PDF & Image) */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>{t('onboarding.unified.menuLabel')}</span>
                <span className={styles.optionalTag}>PDF ou Image (max 15 Mo)</span>
              </label>

              <div style={{ marginTop: '4px' }}>
                <label className={styles.dropzone} style={{ padding: '12px 14px', cursor: isExtractingMenu ? 'wait' : 'pointer' }}>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    disabled={isExtractingMenu}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) extractMenuFile(f);
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isExtractingMenu ? (
                        <Loader2 size={18} style={{ color: '#FF5A00', animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <FileText size={18} strokeWidth={1.75} style={{ color: '#FF5A00' }} />
                      )}
                      <span className={styles.dropzoneTitle}>
                        {menuFileName ? t('onboarding.unified.menuFileSelected', { file: menuFileName }) : 'Importer le menu ou la carte (PDF, JPG, PNG)'}
                      </span>
                    </div>
                    {menuFileName && !isExtractingMenu && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuFileName('');
                          setExtractedMenuDishes([]);
                          setExtractedMenuOffers([]);
                          setMenuRawSummary('');
                          setMenuExtractionNotice('');
                        }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px' }}
                        title="Retirer le fichier"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </label>

                {menuExtractionNotice && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    background: menuExtractionNotice.startsWith('✨') ? '#f0fdf4' : '#fff7ed',
                    color: menuExtractionNotice.startsWith('✨') ? '#166534' : '#92400e',
                    border: menuExtractionNotice.startsWith('✨') ? '1px solid #bbf7d0' : '1px solid #fde68a',
                  }}>
                    {menuExtractionNotice}
                  </div>
                )}
              </div>
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

            {/* Capacité de la salle (Nombre de couverts - non public sur Google Maps) */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Capacité de la salle (Nombre de couverts)</span>
                <span className={styles.optionalTag}>Saisie restaurateur (non public sur Maps)</span>
              </label>
              <div className={styles.inputWrapper}>
                <Users size={17} strokeWidth={1.75} className={styles.inputIcon} />
                <input
                  type="number"
                  min="5"
                  max="500"
                  placeholder="Ex: 45 couverts"
                  value={capacityCovers}
                  onChange={(e) => setCapacityCovers(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            {/* Jours creux choisis par le restaurateur */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Vos journées creuses habituelles</span>
                <span className={styles.optionalTag}>Indiquez vos jours calmes pour orienter l'IA</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => {
                  const isSelected = offPeakDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleOffPeakDay(day)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: isSelected ? '1.5px solid #ff5a00' : '1px solid #d1d5db',
                        background: isSelected ? '#fff7ed' : '#ffffff',
                        color: isSelected ? '#c2410c' : '#374151',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected ? `✓ ${day}` : day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ticket moyen estimé par client */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Ticket moyen estimé par client (€)</span>
                <span className={styles.optionalTag}>Saisi ou calculé selon les plats</span>
              </label>
              <div className={styles.inputWrapper}>
                <span style={{ position: 'absolute', left: '12px', color: '#ff5a00', fontWeight: 700 }}>€</span>
                <input
                  type="number"
                  min="5"
                  max="200"
                  placeholder="Ex: 26 €"
                  value={averageTicket}
                  onChange={(e) => setAverageTicket(e.target.value)}
                  className={styles.input}
                  style={{ paddingLeft: '32px' }}
                />
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

            {/* Objectif principal sur les réseaux (Liste déroulante en 1 clic) */}
            <div className={styles.fieldGroup}>
              <label htmlFor="marketingGoalSelect" className={styles.label}>
                <span>{t('onboarding.unified.goalLabel')}</span>
                <span className={styles.optionalTag}>{t('onboarding.unified.oneClick')}</span>
              </label>
              <div className={styles.selectWrapper}>
                <SelectedGoalIcon size={16} strokeWidth={1.75} className={styles.inputIcon} />
                <select
                  id="marketingGoalSelect"
                  value={marketingGoal}
                  onChange={(e) => setMarketingGoal(e.target.value)}
                  className={styles.selectInput}
                >
                  {MARKETING_GOALS.map((goal) => (
                    <option key={goal.id} value={goal.id} className={styles.selectOption}>
                      {goal.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} strokeWidth={2} className={styles.selectArrow} />
              </div>
            </div>

            {/* Cible prioritaire (Liste déroulante à sélection multiple) */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>{t('onboarding.unified.targetLabel')}</span>
                <span className={styles.optionalTag}>{t('onboarding.unified.targetMultiple')}</span>
              </label>

              <div className={styles.multiSelectContainer} ref={targetDropdownRef}>
                <div
                  className={`${styles.multiSelectTrigger} ${
                    isTargetDropdownOpen ? styles.multiSelectTriggerOpen : ''
                  }`}
                  onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsTargetDropdownOpen(!isTargetDropdownOpen);
                    }
                  }}
                >
                  <Users size={16} strokeWidth={1.75} className={styles.inputIcon} />
                  <div className={styles.multiSelectValue}>
                    {targetAudiences.length === 0 ? (
                      <span className={styles.multiSelectPlaceholder}>
                        Sélectionnez un ou plusieurs publics cibles...
                      </span>
                    ) : (
                      <span>
                        {targetAudiences
                          .map((id) => TARGET_AUDIENCES.find((a) => a.id === id)?.label)
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    )}
                  </div>
                  <div className={styles.multiSelectRight}>
                    {targetAudiences.length > 0 && (
                      <span className={styles.multiSelectBadgeCount}>{targetAudiences.length}</span>
                    )}
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      className={`${styles.selectArrowStatic} ${
                        isTargetDropdownOpen ? styles.selectArrowOpen : ''
                      }`}
                    />
                  </div>
                </div>

                {isTargetDropdownOpen && (
                  <div className={styles.multiSelectDropdown}>
                    {TARGET_AUDIENCES.map((target) => {
                      const TargetIcon = target.icon;
                      const isSelected = targetAudiences.includes(target.id);
                      return (
                        <div
                          key={target.id}
                          className={`${styles.multiSelectOption} ${
                            isSelected ? styles.multiSelectOptionSelected : ''
                          }`}
                          onClick={() => toggleTarget(target.id)}
                        >
                          <div className={styles.multiSelectOptionLeft}>
                            <div
                              className={`${styles.multiSelectCheckbox} ${
                                isSelected ? styles.multiSelectCheckboxActive : ''
                              }`}
                            >
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                            <TargetIcon size={15} strokeWidth={1.75} className={styles.multiSelectOptionIcon} />
                            <span className={styles.multiSelectOptionLabel}>{target.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Badges amovibles des cibles sélectionnées */}
              {targetAudiences.length > 0 && (
                <div className={styles.selectedTargetsRow}>
                  {targetAudiences.map((id) => {
                    const item = TARGET_AUDIENCES.find((a) => a.id === id);
                    if (!item) return null;
                    const ItemIcon = item.icon;
                    return (
                      <span key={id} className={styles.selectedTargetChip}>
                        <ItemIcon size={12} strokeWidth={1.75} />
                        <span>{item.label}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTarget(id);
                          }}
                          className={styles.removeTargetChipBtn}
                          title="Retirer cette cible"
                        >
                          <X size={11} strokeWidth={2.5} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ton de communication (Liste déroulante en 1 clic) */}
            <div className={styles.fieldGroup}>
              <label htmlFor="toneSelect" className={styles.label}>
                <span>{t('onboarding.unified.toneLabel')}</span>
                <span className={styles.optionalTag}>{t('onboarding.unified.oneClick')}</span>
              </label>
              <div className={styles.selectWrapper}>
                <SelectedToneIcon size={16} strokeWidth={1.75} className={styles.inputIcon} />
                <select
                  id="toneSelect"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className={styles.selectInput}
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id} className={styles.selectOption}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} strokeWidth={2} className={styles.selectArrow} />
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

            {/* Messages de statut OAuth Direct (Succès vert ou Erreur rouge) */}
            {socialNotice && (
              <div style={{
                marginBottom: 20,
                padding: '12px 16px',
                borderRadius: 10,
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <CheckCircle2 size={18} color="#059669" />
                <span>{socialNotice}</span>
              </div>
            )}

            {socialError && (
              <div style={{
                marginBottom: 20,
                padding: '12px 16px',
                borderRadius: 10,
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <AlertCircle size={18} color="#DC2626" />
                <span>{socialError}</span>
              </div>
            )}

            {/* Cartes réseaux sociaux */}
            <div className={styles.socialCardsGrid}>
              {/* Instagram */}
              <div className={styles.socialCardLarge}>
                <div className={styles.socialCardHeader}>
                  <span className={styles.socialIconBoxLarge} style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF" aria-label={t('onboarding.unified.logoInstagram')}>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </span>
                  <div>
                    <div className={styles.socialCardName}>Instagram</div>
                    <div className={styles.socialCardDesc}>
                      {connectedHandles.instagram
                        ? `Connecté en tant que ${connectedHandles.instagram}`
                        : t('onboarding.unified.instaDesc')}
                    </div>
                  </div>
                </div>
                {connectedPlatforms.instagram ? (
                  <div className={styles.socialConnectedRow}>
                    <CheckCircle2 size={14} strokeWidth={1.75} style={{ color: '#16A34A' }} />
                    <span className={styles.socialConnectedLabel}>
                      {connectedHandles.instagram || t('onboarding.unified.accountLinked')}
                    </span>
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
                    disabled={connectingPlatform === 'instagram'}
                    onClick={() => handleTogglePlatform('instagram')}
                  >
                    {connectingPlatform === 'instagram' ? (
                      <>
                        <Loader2 size={14} className={styles.spinIcon} />
                        <span>Redirection OAuth...</span>
                      </>
                    ) : (
                      t('onboarding.unified.connectPlatform', { platform: 'Instagram' })
                    )}
                  </button>
                )}
              </div>

              {/* Facebook */}
              <div className={styles.socialCardLarge}>
                <div className={styles.socialCardHeader}>
                  <span className={styles.socialIconBoxLarge} style={{ background: '#0866FF' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF" aria-label={t('onboarding.unified.logoFacebook')}>
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </span>
                  <div>
                    <div className={styles.socialCardName}>Facebook</div>
                    <div className={styles.socialCardDesc}>
                      {connectedHandles.facebook
                        ? `Page connectée : ${connectedHandles.facebook}`
                        : t('onboarding.unified.fbDesc')}
                    </div>
                  </div>
                </div>
                {connectedPlatforms.facebook ? (
                  <div className={styles.socialConnectedRow}>
                    <CheckCircle2 size={14} strokeWidth={1.75} style={{ color: '#16A34A' }} />
                    <span className={styles.socialConnectedLabel}>
                      {connectedHandles.facebook || t('onboarding.unified.accountLinked')}
                    </span>
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
                    disabled={connectingPlatform === 'facebook'}
                    onClick={() => handleTogglePlatform('facebook')}
                  >
                    {connectingPlatform === 'facebook' ? (
                      <>
                        <Loader2 size={14} className={styles.spinIcon} />
                        <span>Redirection OAuth...</span>
                      </>
                    ) : (
                      t('onboarding.unified.connectPlatform', { platform: 'Facebook' })
                    )}
                  </button>
                )}
              </div>

              {/* Google Business */}
              <div className={styles.socialCardLarge}>
                <div className={styles.socialCardHeader}>
                  <span className={styles.socialIconBoxLarge} style={{ background: '#FFFFFF', border: '1px solid rgba(13, 13, 13, 0.12)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" aria-label={t('onboarding.unified.logoGoogle')}>
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                  </span>
                  <div>
                    <div className={styles.socialCardName}>Google Business</div>
                    <div className={styles.socialCardDesc}>
                      {connectedHandles.google_business
                        ? `Fiche vérifiée : ${connectedHandles.google_business}`
                        : t('onboarding.unified.googleDesc')}
                    </div>
                  </div>
                </div>
                {connectedPlatforms.google_business ? (
                  <div className={styles.socialConnectedRow}>
                    <CheckCircle2 size={14} strokeWidth={1.75} style={{ color: '#16A34A' }} />
                    <span className={styles.socialConnectedLabel}>
                      {connectedHandles.google_business || t('onboarding.unified.accountLinked')}
                    </span>
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
                    disabled={connectingPlatform === 'google_business'}
                    onClick={() => handleTogglePlatform('google_business')}
                  >
                    {connectingPlatform === 'google_business' ? (
                      <>
                        <Loader2 size={14} className={styles.spinIcon} />
                        <span>Redirection OAuth...</span>
                      </>
                    ) : (
                      t('onboarding.unified.connectPlatform', { platform: 'Google' })
                    )}
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
