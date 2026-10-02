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
          color: '#111827',
        },
      ]
    : data.platforms;

  const topContentItems = (isReal && Array.isArray(analyticsData?.posts) && analyticsData.posts.length > 0)
    ? analyticsData.posts.map((p: any) => ({
        id: p.id,
        title: p.content.slice(0, 60) + (p.content.length > 60 ? '...' : ''),
        date: new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        platform: p.platform || 'tiktok',
        views: `${p.views} views`,
        interactions: `${p.likes} likes`,
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
          color: isReal ? '#15803d' : '#a16207',
          border: `1px solid ${isReal ? '#86efac' : '#fde047'}`,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isReal ? (
              <>
                <CheckCircle2 size={16} strokeWidth={1.75} />
                <span>REAL ANALYTICS — Source: Zernio Unified API ({analyticsData?.platform?.toUpperCase()} @{analyticsData?.accountUsername})</span>
              </>
            ) : (
              <>
                <Info size={16} strokeWidth={1.75} />
                <span>MOCK / DEMO ANALYTICS — Connect Instagram, Facebook or Google Business to pull real live data</span>
              </>
            )}
          </span>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.8 }}>
            {isReal ? 'Verified Feed' : 'Simulated Preview'}
          </span>
        </div>

        {/* Header Insights */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.iconCircle}>
              <BarChart3 size={22} className={styles.headerIcon} />
            </div>
            <div>
              <h1 className={styles.pageTitle}>Insights & Analytics</h1>
              <p className={styles.pageSubtitle}>
                {isReal ? 'Live performance data from connected channels' : 'Marketing performance and reach metrics'}
              </p>
            </div>
          </div>

          <div className={styles.periodPill}>
            <Calendar size={12} />
            <span>{isReal ? 'Real-Time Sync' : 'Last 30 Days'}</span>
          </div>
        </header>

        {/* Navigation par Onglets (Tabs) */}
        <nav className={styles.tabsNav} aria-label="Sections analytiques">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabActive : ''}`}
          >
            Vue d&apos;ensemble
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.tabActive : ''}`}
          >
            Posts
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audience')}
            className={`${styles.tabBtn} ${activeTab === 'audience' ? styles.tabActive : ''}`}
          >
            Audience
          </button>
        </nav>

        {/* CONTENU ONGLET 1 : VUE D'ENSEMBLE */}
        {activeTab === 'overview' && (
          <main className={styles.mainContent}>
            {/* Section 1 : Performance globale (30 jours) */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Performance globale</h2>
                <span className={styles.periodTag}>{data.metrics.period}</span>
              </div>

              <div className={styles.metricsGrid}>
                {/* Views */}
                <MetricCard
                  label={isReal ? "Verified Total Views" : "Total Cumulative Views"}
                  value={isReal ? analyticsData.overview.totalViews.toLocaleString('en-US') : data.metrics.views}
                  subtext={isReal ? `Live TikTok Feed (@${analyticsData.accountUsername})` : "On Instagram, FB & Google"}
                  trend="+18%"
                  icon={Eye}
                  variant="primary"
                />

                {/* Interactions */}
                <MetricCard
                  label={isReal ? "Verified Likes" : "Total Interactions"}
                  value={isReal ? analyticsData.overview.totalLikes.toLocaleString('en-US') : data.metrics.interactions}
                  subtext={isReal ? `${analyticsData.overview.totalComments} comments, ${analyticsData.overview.totalShares} shares` : "Likes, clicks & shares"}
                  trend="+12%"
                  icon={Heart}
                />

                {/* Engagement Rate */}
                <MetricCard
                  label="Average Engagement Rate"
                  value={isReal ? `${analyticsData.overview.engagementRate}%` : data.metrics.engagementRate}
                  subtext={isReal ? "Calculated from impressions" : "Industry benchmark: 3.8%"}
                  trend="+7%"
                  icon={TrendingUp}
                  variant="accent"
                />
              </div>
            </section>

            {/* Progression & Graphique */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Progression hebdomadaire</h2>
              </div>
              <AnalyticsChart data={data.chartWeekly} />
            </section>

            {/* Section 2 : Par plateforme */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Par plateforme</h2>
                <span className={styles.badgeChannels}>3 canaux actifs</span>
              </div>

              <PlatformStats platforms={platformsData} />
            </section>

            {/* Section 3 : Top contenu */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Top contenu</h2>
                <span className={styles.badgeHighlight}>Le plus performant</span>
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
                <h2 className={styles.sectionTitle}>Historique des posts IA</h2>
                <span className={styles.badgeChannels}>
                  {topContentItems.length} publiés
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
                <h2 className={styles.sectionTitle}>Répartition de l&apos;audience</h2>
              </div>

              <PlatformStats platforms={platformsData} />

              <div className={styles.audienceInsightsCard}>
                <div className={styles.audienceInsightRow}>
                  <Sparkles size={16} className={styles.sparkleIcon} />
                  <div>
                    <span className={styles.insightTitle}>Pic d&apos;activité</span>
                    <p className={styles.insightDesc}>
                      Vos clients consultent vos offres principalement entre <strong>17h et 19h30</strong>.
                    </p>
                  </div>
                </div>

                <div className={styles.audienceInsightRow}>
                  <TrendingUp size={16} className={styles.trendIcon} />
                  <div>
                    <span className={styles.insightTitle}>Clientèle de quartier</span>
                    <p className={styles.insightDesc}>
                      74% des interactions proviennent d&apos;un rayon de <strong>moins de 3 km</strong>.
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
