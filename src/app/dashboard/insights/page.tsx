'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Eye,
  Heart,
  TrendingUp,
  Share2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Info,
} from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard/MetricCard';
import { useLanguage } from '@/i18n';
import PlatformStats from '@/components/ui/PlatformStats/PlatformStats';
import TopContentCard from '@/components/ui/TopContentCard/TopContentCard';
import AnalyticsChart from '@/components/ui/AnalyticsChart/AnalyticsChart';
import {
  InsightsTab,
  MOCK_INSIGHTS_DATA,
} from '@/services/insights/insights.data';
import styles from './insights.module.css';

/**
 * Écran 19 : Insights (Dashboard Analytique)
 *
 * Tabs :
 * - Vue d'ensemble
 * - Posts
 * - Audience
 *
 * Section Performance globale (30 jours) :
 * - 12 480 vues
 * - 892 interactions
 * - +7% taux d'engagement
 *
 * Section Par plateforme :
 * - Instagram (55%)
 * - Facebook (30%)
 * - Google Business (15%)
 * - Représentation graphique
 *
 * Section Top contenu :
 * - "Ailes de poulet -50%" (2.4k vues, 180 interactions)
 *
 * Composants créés :
 * - MetricCard
 * - PlatformStats
 * - TopContentCard
 * - AnalyticsChart
 */
export default function InsightsPage() {
  const { t, formatDate } = useLanguage();
  const [activeTab, setActiveTab] = useState<InsightsTab>('overview');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setAnalyticsData(json.data);
        }
      })
      .catch((err) => console.warn('Could not load analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  const data = MOCK_INSIGHTS_DATA;
  const isReal = analyticsData?.isReal === true;

  const platformsData = isReal && analyticsData?.overview
    ? [
        {
          id: 'tiktok',
          name: `TikTok (@${analyticsData.accountUsername || 'getspecial_app'})`,
          percentage: 100,
          views: analyticsData.overview.totalViews,
          interactions: (analyticsData.overview.totalLikes || 0) + (analyticsData.overview.totalComments || 0),
          color: '#0D0D0D',
        },
      ]
    : data.platforms;

  const topContentItems = (isReal && Array.isArray(analyticsData?.posts) && analyticsData.posts.length > 0)
    ? analyticsData.posts.map((p: any) => ({
        id: p.id,
        title: p.content.slice(0, 60) + (p.content.length > 60 ? '...' : ''),
        date: formatDate(p.publishedAt, { month: 'short', day: 'numeric' }),
        platform: p.platform || 'tiktok',
        views: t('engagement.insights.viewsUnit', { count: p.views }),
        interactions: t('engagement.insights.likesUnit', { count: p.likes }),
        engagement: `${p.engagementRate}%`,
        imageUrl: p.thumbnailUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
        postUrl: p.url,
      }))
    : data.topContent;

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Source Badge: REAL vs MOCK */}
        <div style={{
          padding: '8px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: isReal ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
          color: isReal ? '#15803D' : '#a16207',
          border: `1px solid ${isReal ? '#86EFAC' : '#fde047'}`,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isReal ? (
              <>
                <CheckCircle2 size={16} strokeWidth={1.75} />
                <span>{t('engagement.insights.realBadge', { platform: analyticsData?.platform?.toUpperCase() ?? '', account: analyticsData?.accountUsername ?? '' })}</span>
              </>
            ) : (
              <>
                <Info size={16} strokeWidth={1.75} />
                <span>{t('engagement.insights.mockBadge')}</span>
              </>
            )}
          </span>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.8 }}>
            {isReal ? t('engagement.insights.verifiedFeed') : t('engagement.insights.simulatedPreview')}
          </span>
        </div>

        {/* Header Insights */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.iconCircle}>
              <BarChart3 size={22} className={styles.headerIcon} />
            </div>
            <div>
              <h1 className={styles.pageTitle}>{t('engagement.insights.title')}</h1>
              <p className={styles.pageSubtitle}>
                {isReal ? t('engagement.insights.subtitleLive') : t('engagement.insights.subtitleMock')}
              </p>
            </div>
          </div>

          <div className={styles.periodPill}>
            <Calendar size={12} />
            <span>{isReal ? t('engagement.insights.periodLive') : t('engagement.insights.periodMock')}</span>
          </div>
        </header>

        {/* Navigation par Onglets (Tabs) */}
        <nav className={styles.tabsNav} aria-label={t('engagement.insights.tabsLabel')}>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabActive : ''}`}
          >
            {t('engagement.insights.tabOverview')}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.tabActive : ''}`}
          >
            {t('engagement.insights.tabPosts')}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audience')}
            className={`${styles.tabBtn} ${activeTab === 'audience' ? styles.tabActive : ''}`}
          >
            {t('engagement.insights.tabAudience')}
          </button>
        </nav>

        {/* CONTENU ONGLET 1 : VUE D'ENSEMBLE */}
        {activeTab === 'overview' && (
          <main className={styles.mainContent}>
            {/* Section 1 : Performance globale (30 jours) */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{t('engagement.insights.globalPerf')}</h2>
                <span className={styles.periodTag}>{data.metrics.period}</span>
              </div>

              <div className={styles.metricsGrid}>
                {/* Views */}
                <MetricCard
                  label={isReal ? t('engagement.insights.viewsLabelReal') : t('engagement.insights.viewsLabelMock')}
                  value={isReal ? analyticsData.overview.totalViews.toLocaleString('en-US') : data.metrics.views}
                  subtext={isReal ? t('engagement.insights.viewsSubReal', { account: analyticsData.accountUsername ?? '' }) : t('engagement.insights.viewsSubMock')}
                  trend="+18%"
                  icon={Eye}
                  variant="primary"
                />

                {/* Interactions */}
                <MetricCard
                  label={isReal ? t('engagement.insights.likesLabelReal') : t('engagement.insights.likesLabelMock')}
                  value={isReal ? analyticsData.overview.totalLikes.toLocaleString('en-US') : data.metrics.interactions}
                  subtext={isReal ? t('engagement.insights.likesSubReal', { comments: analyticsData.overview.totalComments, shares: analyticsData.overview.totalShares }) : t('engagement.insights.likesSubMock')}
                  trend="+12%"
                  icon={Heart}
                />

                {/* Engagement Rate */}
                <MetricCard
                  label={t('engagement.insights.engagementLabel')}
                  value={isReal ? `${analyticsData.overview.engagementRate}%` : data.metrics.engagementRate}
                  subtext={isReal ? t('engagement.insights.engagementSubReal') : t('engagement.insights.engagementSubMock')}
                  trend="+7%"
                  icon={TrendingUp}
                  variant="accent"
                />
              </div>
            </section>

            {/* Progression & Graphique */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{t('engagement.insights.weeklyProgress')}</h2>
              </div>
              <AnalyticsChart data={data.chartWeekly} />
            </section>

            {/* Section 2 : Par plateforme */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{t('engagement.insights.byPlatform')}</h2>
                <span className={styles.badgeChannels}>{t('engagement.insights.activeChannels')}</span>
              </div>

              <PlatformStats platforms={platformsData} />
            </section>

            {/* Section 3 : Top contenu */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{t('engagement.insights.topContent')}</h2>
                <span className={styles.badgeHighlight}>{t('engagement.insights.topPerformer')}</span>
              </div>

              <div className={styles.topContentList}>
                {topContentItems.map((item: any) => (
                  <TopContentCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          </main>
        )}

        {/* CONTENU ONGLET 2 : POSTS */}
        {activeTab === 'posts' && (
          <main className={styles.mainContent}>
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{t('engagement.insights.aiHistory')}</h2>
                <span className={styles.badgeChannels}>
                  {t('engagement.insights.publishedCount', { count: topContentItems.length })}
                </span>
              </div>

              <div className={styles.topContentList}>
                {topContentItems.map((item: any) => (
                  <TopContentCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          </main>
        )}

        {/* CONTENU ONGLET 3 : AUDIENCE */}
        {activeTab === 'audience' && (
          <main className={styles.mainContent}>
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{t('engagement.insights.audienceSplit')}</h2>
              </div>

              <PlatformStats platforms={platformsData} />

              <div className={styles.audienceInsightsCard}>
                <div className={styles.audienceInsightRow}>
                  <Sparkles size={16} className={styles.sparkleIcon} />
                  <div>
                    <span className={styles.insightTitle}>{t('engagement.insights.peakTitle')}</span>
                    <p className={styles.insightDesc}>
                      {t('engagement.insights.peakDescBefore')} <strong>{t('engagement.insights.peakSlot')}</strong>.
                    </p>
                  </div>
                </div>

                <div className={styles.audienceInsightRow}>
                  <TrendingUp size={16} className={styles.trendIcon} />
                  <div>
                    <span className={styles.insightTitle}>{t('engagement.insights.localTitle')}</span>
                    <p className={styles.insightDesc}>
                      {t('engagement.insights.localDescBefore')} <strong>{t('engagement.insights.localRadius')}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </main>
        )}

        {/* Spacer pour Bottom Navigation */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
