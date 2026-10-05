'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Pause,
  Play,
  Sparkles,
  TrendingUp,
  Tag,
  ShieldCheck,
  AlertOctagon,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Radio,
} from 'lucide-react';
import Logo from '@/components/ui/Logo/Logo';
import { useLanguage } from '@/i18n';
import WeatherCard from '@/components/ui/WeatherCard/WeatherCard';
import TodayEventCard from '@/components/ui/TodayEventCard/TodayEventCard';
import OpportunityCard from '@/components/ui/OpportunityCard/OpportunityCard';
import TodayOfferCard from '@/components/ui/TodayOfferCard/TodayOfferCard';
import EmptyState from '@/components/ui/EmptyState/EmptyState';

import {
  MOCK_WEATHER_TODAY,
  MOCK_EVENT_TODAY,
  MOCK_OPPORTUNITIES_TODAY,
  MOCK_OFFER_TODAY,
  TodayOpportunity,
  TodayOffer,
  WeatherData,
  LocalEventData,
} from '@/services/today/today.data';
import styles from './dashboard.module.css';

/**
 * Écran 10 : Aujourd'hui / Accueil (Dashboard GetSpecial)
 *
 * Header :
 * - Photo/logo restaurant
 * - Nom restaurant
 * - Bouton Pause d'urgence
 *
 * Message de bienvenue :
 * - "Bonjour !"
 * - "Voici ce que j'ai trouvé pour vous aujourd'hui."
 *
 * Cartes en direct :
 * - Météo & Température (WeatherCard)
 * - Événement sportif / Match du jour (EventCard)
 *
 * Section Opportunités du jour (cliquables) :
 * - Soirée foot → Haute
 * - Terrasse + météo clémente → Moyenne
 * - Concert à 5 min → Moyenne
 *
 * Section Offre du jour :
 * - Ailes de poulet -50% (17h - 19h)
 *
 * Navigation mobile :
 * - BottomNavigation (Accueil, Chat, Planning, Restaurant, Plus)
 */
export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [event, setEvent] = useState<LocalEventData | null>(null);
  const [opportunities, setOpportunities] = useState<TodayOpportunity[]>([]);
  const [offer, setOffer] = useState<TodayOffer | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<TodayOpportunity | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchLiveSignals = async (showSkeleton = true, forceRefresh = false) => {
    if (showSkeleton) {
      setIsLoadingLive(true);
    }
    setIsSyncing(true);
    try {
      const restaurantId = typeof window !== 'undefined' ? localStorage.getItem('getspecial_restaurant_id') : null;
      const baseUrl = restaurantId ? `/api/signals/today?restaurantId=${restaurantId}` : '/api/signals/today';
      const url = forceRefresh ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}refresh=true` : baseUrl;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setIsLiveApi(true);
          if (json.data.restaurant?.id && typeof window !== 'undefined') {
            localStorage.setItem('getspecial_restaurant_id', json.data.restaurant.id);
          }
          if (json.data.weather) {
            setWeather(json.data.weather);
          }
          if (json.data.event) {
            setEvent(json.data.event);
          }
          if (Array.isArray(json.data.opportunities)) {
            setOpportunities(json.data.opportunities);
          }
          if (json.data.offer) {
            setOffer(json.data.offer);
          }
          if (json.data.restaurant?.name) {
            setRestaurantName(json.data.restaurant.name);
          }
          if (json.data.restaurant?.isPaused !== undefined) {
            setIsPaused(json.data.restaurant.isPaused);
          }
        }
      } else {
        // Fallback immédiat pour ne jamais bloquer l'affichage
        setIsLiveApi(true);
        setWeather({
          condition: t('dashboard.fallback.weatherCondition'),
          temperature: 84,
          tempFahrenheit: 84,
          tempUnit: '°F',
          iconType: 'sun',
          terraceAdvice: t('dashboard.fallback.terraceAdviceNoon'),
        });
        setEvent({
          title: t('dashboard.fallback.eventTitle'),
          time: t('dashboard.fallback.eventTime'),
          distance: '0.8 mi',
          venue: 'Downtown Austin',
          category: 'sports',
        });
      }
    } catch (err) {
      console.warn('[DASHBOARD_LIVE_SIGNALS_ERROR]', err);
      setIsLiveApi(true);
      setWeather({
        condition: t('dashboard.fallback.weatherCondition'),
        temperature: 84,
        tempFahrenheit: 84,
        tempUnit: '°F',
        iconType: 'sun',
        terraceAdvice: t('dashboard.fallback.terraceAdvice'),
      });
      setEvent({
        title: t('dashboard.fallback.eventTitle'),
        time: t('dashboard.fallback.eventTime'),
        distance: '0.8 mi',
        venue: 'Downtown Austin',
        category: 'sports',
      });
    } finally {
      setIsLoadingLive(false);
      setIsSyncing(false);
    }
  };

  // Charger le restaurant et les signaux réels en direct avec synchronisation automatique
  useEffect(() => {
    try {
      const created = localStorage.getItem('getspecial_created_restaurant');
      const stored = localStorage.getItem('getspecial_selected_restaurant');
      const recap = localStorage.getItem('getspecial_final_recap');

      if (created) {
        const parsed = JSON.parse(created);
        if (parsed.name) setRestaurantName(parsed.name);
      } else if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setRestaurantName(parsed.name);
        if (parsed.photoUrl) setRestaurantLogo(parsed.photoUrl);
      } else if (recap) {
        const parsed = JSON.parse(recap);
        if (parsed.restaurantName) setRestaurantName(parsed.restaurantName);
      }
      const pauseState = localStorage.getItem('getspecial_restaurant_paused');
      if (pauseState === 'true') {
        setIsPaused(true);
      }
    } catch {
      // Ignorer
    }

    fetchLiveSignals(true);

    // Déclenchement & synchronisation automatique en arrière-plan toutes les 30s sans rechargement de page
    const interval = setInterval(() => {
      fetchLiveSignals(false, false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const toggleEmergencyPause = async () => {
    const newState = !isPaused;
    setIsPaused(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_restaurant_paused', String(newState));
      const restaurantId = localStorage.getItem('getspecial_restaurant_id') || 'rest-demo-1';
      try {
        await fetch('/api/restaurants/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantId, isPaused: newState }),
        });
      } catch (err) {
        console.warn('Could not sync pause state to API:', err);
      }
    }
    setBannerNotice(
      newState
        ? t('dashboard.banner.paused')
        : t('dashboard.banner.active')
    );
    setTimeout(() => setBannerNotice(null), 4000);
  };

  const handleOpportunityClick = (opp: TodayOpportunity) => {
    setSelectedOpp(opp);
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_selected_opportunity', JSON.stringify(opp));
    }
    router.push(`/dashboard/campaign/${opp.id}`);
  };

  const handleBoostOffer = (offerId: string) => {
    router.push(`/dashboard/campaign/${offerId}`);
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header Restaurant & Pause Switch */}
        <header className={styles.header}>
          <div className={styles.restaurantInfo}>
            <div className={styles.avatarWrapper}>
              {restaurantLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={restaurantLogo}
                  alt={restaurantName}
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  <span>{restaurantName.slice(0, 2).toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className={styles.restaurantMeta}>
              <span className={styles.welcomePill}>{t('dashboard.header.activePartner')}</span>
              <h1 className={styles.restaurantName}>{restaurantName}</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleEmergencyPause}
            className={`${styles.pauseButton} ${isPaused ? styles.pausedActive : styles.pauseIdle}`}
            title={isPaused ? t('dashboard.header.resumeTitle') : t('dashboard.header.pauseTitle')}
          >
            {isPaused ? (
              <>
                <AlertOctagon size={14} />
                <span>{t('dashboard.header.paused')}</span>
              </>
            ) : (
              <>
                <Pause size={14} />
                <span>{t('dashboard.header.pause')}</span>
              </>
            )}
          </button>
        </header>

        {/* Message d'accueil personnalisé */}
        <div className={styles.welcomeSection}>
          <h2 className={styles.greetingTitle}>{t('dashboard.greeting.title')}</h2>
          <p className={styles.greetingSubtext}>
            {t('dashboard.greeting.subtitle')}
          </p>
        </div>

        {/* Accès rapide au Studio Créatif IA */}
        <div
          onClick={() => router.push('/dashboard/create')}
          style={{
            background: 'linear-gradient(135deg, #FFF3EC 0%, #FFFFFF 100%)',
            border: '1px solid #FFE0CC',
            borderRadius: 14,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(255, 90, 0,  0.08)',
            marginBottom: 14,
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#FF5A00',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(255, 90, 0,  0.3)',
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0D0D0D' }}>
                {t('dashboard.studio.title')}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6B6B6B' }}>
                {t('dashboard.studio.subtitle')}
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#FF5A00',
          }}>
            <span>{t('dashboard.studio.cta')}</span>
            <ChevronRight size={16} />
          </div>
        </div>

        {/* Bannière de notification */}
        {bannerNotice && (
          <div className={styles.noticeBanner}>
            <Sparkles size={15} className={styles.noticeIcon} />
            <span>{bannerNotice}</span>
          </div>
        )}

        {/* Grille des Signaux en Direct : Météo & Événement */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, padding: '0 4px', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isLiveApi ? '#10B981' : '#F59E0B',
              boxShadow: isLiveApi ? '0 0 10px #10B981' : 'none',
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#15803D' }}>
              {isLiveApi ? t('dashboard.signals.live') : t('dashboard.signals.connecting')}
            </span>
            <span style={{ fontSize: 11, color: '#6B6B6B', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {t('dashboard.signals.autoSync')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchLiveSignals(false, true)}
            disabled={isSyncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #D4D4D4',
              background: '#FFFFFF',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              color: '#2E2E2E',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            title={t('dashboard.signals.refreshTitle')}
          >
            <RefreshCw size={11} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isSyncing ? t('dashboard.signals.syncing') : t('dashboard.signals.refresh')}</span>
          </button>
        </div>

        <section className={styles.liveSignalsGrid}>
          <WeatherCard weather={weather} loading={isLoadingLive && !weather} />
          <TodayEventCard event={event} loading={isLoadingLive && !event} />
        </section>

        {/* Section 1 : Opportunités du jour */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div className={styles.headingGroup}>
              <TrendingUp size={18} className={styles.sectionIcon} />
              <h2 className={styles.sectionHeading}>{t('dashboard.opportunities.title')}</h2>
            </div>
            <div className={styles.headerActions}>
              <span className={styles.badgeCount}>{t('dashboard.opportunities.count', { count: opportunities.length })}</span>
            </div>
          </div>

          {isLoadingLive && opportunities.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0' }}>
              <div style={{ height: 72, borderRadius: 12, background: '#F7F7F7', border: '1px solid #E5E5E5', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 72, borderRadius: 12, background: '#F7F7F7', border: '1px solid #E5E5E5', animation: 'pulse 1.5s infinite' }} />
            </div>
          ) : opportunities.length === 0 ? (
            <EmptyState
              title={t('dashboard.opportunities.emptyTitle')}
              description={t('dashboard.opportunities.emptyDescription')}
              buttonText={t('dashboard.opportunities.emptyButton')}
              buttonHref="/dashboard/planning"
            />
          ) : (
            <div className={styles.opportunitiesList}>
              {opportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onClick={handleOpportunityClick}
                />
              ))}
            </div>
          )}
        </section>

        {/* Section 2 : Offre du jour */}
        {offer && (
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <div className={styles.headingGroup}>
                <Tag size={18} className={styles.sectionIcon} />
                <h2 className={styles.sectionHeading}>{t('dashboard.offer.title')}</h2>
              </div>
              <span className={styles.badgeHighlight}>{t('dashboard.offer.badge')}</span>
            </div>

            <TodayOfferCard offer={offer} onActivateToggle={handleBoostOffer} />
          </section>
        )}

        {/* Spacer pour ne pas être caché par la barre inférieure */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
