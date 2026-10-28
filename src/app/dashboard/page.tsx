'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  TrendingUp,
  Tag,
  ChevronRight,
  Sun,
  CloudSun,
  CloudRain,
  Cloud,
  Image as ImageIcon,
  CalendarPlus,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  RotateCw,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import StatCard from '@/components/ui/StatCard/StatCard';
import MarketingContextCard from '@/components/ui/MarketingContextCard/MarketingContextCard';
import OpportunityCard from '@/components/ui/OpportunityCard/OpportunityCard';
import OpportunityDetailModal from '@/components/ui/OpportunityDetailModal/OpportunityDetailModal';
import TodayOfferCard from '@/components/ui/TodayOfferCard/TodayOfferCard';
import EmptyState from '@/components/ui/EmptyState/EmptyState';

import {
  TodayOpportunity,
  TodayOffer,
  WeatherData,
  LocalEventData,
} from '@/services/today/today.data';
import PwaInstallBanner from '@/components/pwa/PwaInstallBanner';
import styles from './dashboard.module.css';

/**
 * Dashboard GetSpecial - Données Réelles en direct :
 * 1. Header (Restaurant réel & Météo réelle Open-Meteo)
 * 2. Rangée des 4 StatCards (Total posts, Scheduled, Published, This week depuis la BDD)
 * 3. Grille asymétrique à 2 colonnes :
 *    - Gauche : Dernières publications réelles
 *    - Droite : Carte Contexte Marketing (Météo en direct & Événements réels)
 * 4. Propositions marketing IA générées en direct
 */
export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [events, setEvents] = useState<LocalEventData[]>([]);
  const [opportunities, setOpportunities] = useState<TodayOpportunity[]>([]);
  const [offer, setOffer] = useState<TodayOffer | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<TodayOpportunity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [isRefreshingOpps, setIsRefreshingOpps] = useState(false);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  // 4 statistiques réelles
  const [stats, setStats] = useState({
    totalPosts: 0,
    scheduled: 0,
    published: 0,
    thisWeek: 0,
  });

  // Publications récentes réelles
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  const fetchLiveSignals = async (showSkeleton = true, forceRefresh = false) => {
    if (showSkeleton) {
      setIsLoadingLive(true);
    }
    if (forceRefresh) {
      setIsRefreshingOpps(true);
    }
    try {
      const restaurantId = typeof window !== 'undefined' ? localStorage.getItem('getspecial_restaurant_id') : null;
      const params = new URLSearchParams();
      if (restaurantId) params.append('restaurantId', restaurantId);
      if (forceRefresh) params.append('refresh', 'true');
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const baseUrl = `/api/signals/today${queryString}`;

      const res = await fetch(baseUrl);
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
          if (Array.isArray(json.data.events)) {
            setEvents(json.data.events);
          } else if (json.data.event) {
            setEvents([json.data.event]);
          } else {
            setEvents([]);
          }
          if (Array.isArray(json.data.opportunities)) {
            setOpportunities(json.data.opportunities);
          } else {
            setOpportunities([]);
          }
          if (json.data.offer) {
            setOffer(json.data.offer);
          } else {
            setOffer(null);
          }
          if (json.data.restaurant?.name) {
            setRestaurantName(json.data.restaurant.name);
            const rest = json.data.restaurant;
            const hasHours = Array.isArray(rest.openingHours) ? rest.openingHours.length > 0 : Boolean(rest.openingHours);
            const hasDishes = Array.isArray(rest.profile?.customRules?.dishes) && rest.profile.customRules.dishes.length > 0;
            setIsProfileIncomplete(!hasHours || !hasDishes);
          }
        }
      }
    } catch (err) {
      console.warn('[DASHBOARD_LIVE_SIGNALS_ERROR]', err);
    } finally {
      setIsLoadingLive(false);
      setIsRefreshingOpps(false);
    }
  };

  // Charger le restaurant et les statistiques en direct
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
    } catch {
      // Ignorer
    }

    fetchLiveSignals(true);

    const storedRestId = typeof window !== 'undefined' ? localStorage.getItem('getspecial_restaurant_id') : null;
    const analyticsUrl = storedRestId ? `/api/analytics?restaurantId=${encodeURIComponent(storedRestId)}` : '/api/analytics';

    // Chargement des analytics pour les 4 statistiques et publications
    fetch(analyticsUrl)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const overview = json.data.overview || {};
          setStats({
            totalPosts: overview.totalPosts ?? 0,
            scheduled: overview.scheduledPosts ?? 0,
            published: overview.publishedPosts ?? 0,
            thisWeek: overview.thisWeek ?? 0,
          });

          if (Array.isArray(json.data.posts) && json.data.posts.length > 0) {
            const mapped = json.data.posts.slice(0, 5).map((p: any) => ({
              id: p.id,
              title: p.content ? (p.content.slice(0, 60) + (p.content.length > 60 ? '...' : '')) : 'Publication du restaurant',
              views: `${(p.views || 0).toLocaleString('fr-FR')} vues`,
              interactions: `${p.likes || 0} réactions`,
              imageUrl: p.thumbnailUrl || p.imageUrl || null,
              engagement: (p.engagementRate !== undefined && p.engagementRate !== null && p.engagementRate > 0) ? `${p.engagementRate}%` : null,
              platform: p.platform || 'instagram',
              date: p.publishedAt
                ? new Date(p.publishedAt).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
                : 'Récemment',
              url: p.url,
            }));
            setRecentPosts(mapped);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleRefreshOpportunities = async () => {
    await fetchLiveSignals(false, true);
  };

  const handleOpportunityClick = (opp: TodayOpportunity) => {
    setSelectedOpp(opp);
    setIsDetailModalOpen(true);
  };

  const handleUpdateOpportunity = (updatedOpp: TodayOpportunity) => {
    setSelectedOpp(updatedOpp);
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === updatedOpp.id ? updatedOpp : opp))
    );
  };

  const handleProceedOpportunity = (opp: TodayOpportunity) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_selected_opportunity', JSON.stringify(opp));
    }
    setIsDetailModalOpen(false);
    router.push(`/dashboard/campaign/${opp.id}`);
  };

  const handleBoostOffer = (offerId: string) => {
    router.push(`/dashboard/campaign/${offerId}`);
  };

  const handleSignalAction = (ev: LocalEventData) => {
    router.push(`/dashboard/create?topic=${encodeURIComponent(ev.title)}`);
  };

  const handleScrollToOpportunities = () => {
    const el = document.getElementById('marketing-actions');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Bannière / Popup d'installation PWA Mobile */}
        <PwaInstallBanner />

        {/* Bannière incitative si le profil du restaurant n'est pas encore complet */}
        {isProfileIncomplete && (
          <div
            style={{
              background: '#FFF7ED',
              border: '1px solid #FFEDD5',
              borderRadius: '12px',
              padding: '12px 18px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} color="#EA580C" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.88rem', color: '#9A3412', fontWeight: 500 }}>
                Votre profil établissement est incomplet. Renseignez vos horaires et votre carte dans Mon Resto pour débloquer toutes les opportunités.
              </span>
            </div>
            <Link
              href="/dashboard/restaurant"
              style={{
                background: '#EA580C',
                color: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Compléter dans Mon Resto
            </Link>
          </div>
        )}

        {/* Header Restaurant & Météo compacte en direct à sa place */}
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
                  <span>{(restaurantName || 'GS').slice(0, 2).toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className={styles.restaurantMeta}>
              <span className={styles.welcomePill}>{t('dashboard.header.activePartner')}</span>
              <h1 className={styles.restaurantName}>{restaurantName || 'Votre Établissement'}</h1>
            </div>
          </div>

          {/* Météo compacte discrète dans le header (reste à sa place) */}
          <div
            className={styles.compactWeatherBadge}
            title={weather?.terraceAdvice || 'Météo en direct'}
          >
            <div
              className={styles.compactWeatherIcon}
              style={{
                backgroundColor:
                  weather?.iconType === 'rain'
                    ? '#E0F2FE'
                    : weather?.iconType === 'cloud'
                    ? '#F3F4F6'
                    : '#FEF3C7',
              }}
            >
              {weather?.iconType === 'rain' ? (
                <CloudRain size={16} color="#0284C7" />
              ) : weather?.iconType === 'cloud' ? (
                <Cloud size={16} color="#6B6B6B" />
              ) : weather?.iconType === 'cloud-sun' ? (
                <CloudSun size={16} color="#D97706" />
              ) : (
                <Sun size={16} color="#D97706" />
              )}
            </div>
            <div className={styles.compactWeatherMeta}>
              <div className={styles.compactWeatherTemp}>
                <span className={styles.compactWeatherVal}>
                  {weather?.temperature !== undefined && weather?.temperature !== null
                    ? `${weather.temperature}°`
                    : isLoadingLive
                    ? '...°'
                    : '--°'}
                </span>
                <span className={styles.compactWeatherUnit}>
                  {(weather?.tempUnit || 'C').replace('°', '')}
                </span>
              </div>
              <span className={styles.compactWeatherDesc}>
                {weather?.condition || (isLoadingLive ? 'Chargement météo...' : 'Météo indisponible')}
              </span>
            </div>
          </div>
        </header>

        {/* Message d'accueil personnalisé & CTA Opportunités juste en face */}
        <div className={styles.welcomeSection}>
          <div className={styles.welcomeTextGroup}>
            <h1 className={styles.greetingTitle}>{t('dashboard.greeting.title')}</h1>
            <p className={styles.greetingSubtext}>
              {t('dashboard.greeting.subtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleScrollToOpportunities}
            className={styles.opportunitiesCtaBtn}
            title={t('dashboard.greeting.cta')}
          >
            <Sparkles size={16} />
            <span>{t('dashboard.greeting.cta')}</span>
            <span className={styles.opportunitiesCtaBadge}>
              {opportunities.length}
            </span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* ========================================================= */}
        {/* RANGÉE DES 4 CARTES STATISTIQUES (Fidèle à la capture)    */}
        {/* ========================================================= */}
        <section className={styles.statsGrid}>
          <StatCard
            icon={ImageIcon}
            value={stats.totalPosts}
            label={t('dashboard.stats.totalPosts')}
            subtext={t('dashboard.stats.totalPostsSub')}
            variant="orange"
          />
          <StatCard
            icon={CalendarPlus}
            value={stats.scheduled}
            label={t('dashboard.stats.scheduled')}
            subtext={t('dashboard.stats.scheduledSub')}
            variant="yellow"
          />
          <StatCard
            icon={CheckCircle2}
            value={stats.published}
            label={t('dashboard.stats.published')}
            subtext={t('dashboard.stats.publishedSub')}
            variant="green"
          />
          <StatCard
            icon={TrendingUp}
            value={stats.thisWeek}
            label={t('dashboard.stats.thisWeek')}
            subtext={t('dashboard.stats.thisWeekSub')}
            variant="purple"
          />
        </section>

        {/* ========================================================= */}
        {/* GRILLE PRINCIPALE EN 2 COLONNES ASYMÉTRIQUES              */}
        {/* ========================================================= */}
        <div className={styles.mainGrid}>
          {/* COLONNE GAUCHE : ACTIONS MARKETING DU JOUR (Directement visibles) */}
          <div id="marketing-actions" className={styles.recentCol}>
            <div className={styles.recentHeader}>
              <div className={styles.headingGroup}>
                <Sparkles size={18} className={styles.sectionIcon} />
                <h3 className={styles.recentHeading}>{t('dashboard.opportunities.title')}</h3>
              </div>
              <div className={styles.oppsHeaderRight}>
                <span className={styles.badgeCount}>
                  {t('dashboard.opportunities.count', { count: opportunities.length })}
                </span>
                <button
                  type="button"
                  onClick={handleRefreshOpportunities}
                  className={styles.refreshOppsBtn}
                  disabled={isRefreshingOpps}
                  title="Actualiser les opportunités du jour (nouvelle analyse IA)"
                  aria-label="Actualiser les opportunités du jour"
                >
                  <RotateCw size={13} className={isRefreshingOpps ? styles.spinIcon : ''} />
                  <span>{isRefreshingOpps ? 'Actualisation...' : 'Actualiser'}</span>
                </button>
              </div>
            </div>

            {isLoadingLive && opportunities.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ height: 96, borderRadius: 14, background: '#F7F7F7', border: '1px solid #E5E5E5' }} />
                <div style={{ height: 96, borderRadius: 14, background: '#F7F7F7', border: '1px solid #E5E5E5' }} />
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
          </div>

          {/* COLONNE DROITE : ÉVÉNEMENTS (CARROUSEL SUR UNE SEULE CARTE VISUELLE) */}
          <div className={styles.contextCol}>
            <div className={styles.recentHeader}>
              <h3 className={styles.recentHeading}>{t('dashboard.events.title')}</h3>
            </div>
            <MarketingContextCard
              events={events}
              loading={isLoadingLive && events.length === 0}
              onActionClick={handleSignalAction}
              onPreferencesUpdated={() => fetchLiveSignals(true)}
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION INFÉRIEURE : DERNIÈRES PUBLICATIONS               */}
        {/* ========================================================= */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div className={styles.headingGroup}>
              <h3 className={styles.sectionHeading}>{t('dashboard.recentPosts.title')}</h3>
            </div>
            <Link href="/dashboard/insights" className={styles.viewAllBtn}>
              <span>{t('dashboard.recentPosts.viewAll')}</span>
            </Link>
          </div>

          <div className={styles.recentContentCard} style={{ minHeight: 'auto', padding: '16px 20px' }}>
            {recentPosts.length === 0 ? (
              <div className={styles.emptyStateContainer} style={{ padding: '24px 20px' }}>
                <div className={styles.emptyIconCircle} style={{ width: 44, height: 44, marginBottom: 10 }}>
                  <Sparkles size={18} />
                </div>
                <h4 className={styles.emptyTitle} style={{ fontSize: '0.95rem' }}>{t('dashboard.recentPosts.emptyTitle')}</h4>
                <p className={styles.emptySubtitle} style={{ fontSize: '0.8rem' }}>{t('dashboard.recentPosts.emptyDescription')}</p>
              </div>
            ) : (
              <div className={styles.postsListContainer}>
                {recentPosts.map((post) => (
                  <div key={post.id} className={styles.postItemRow}>
                    <div className={styles.postItemLeft}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className={styles.postThumbnail}
                        />
                      ) : (
                        <div className={styles.postThumbnail} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
                          <ImageIcon size={18} color="#9CA3AF" />
                        </div>
                      )}
                      <div className={styles.postMetaGroup}>
                        <span className={styles.postTitle}>{post.title}</span>
                        <span className={styles.postSubmeta}>
                          {post.platform} • {post.date}
                        </span>
                      </div>
                    </div>
                    <div className={styles.postItemRight}>
                      <span className={styles.postStatBadge}>{post.views}</span>
                      {post.url && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#6B7280' }}
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Modale Détaillée d'Opportunité (au clic sur une ligne) */}
        <OpportunityDetailModal
          opportunity={selectedOpp}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onProceed={handleProceedOpportunity}
          onUpdateOpportunity={handleUpdateOpportunity}
        />

        {/* Espace inférieur pour la barre de navigation mobile */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
