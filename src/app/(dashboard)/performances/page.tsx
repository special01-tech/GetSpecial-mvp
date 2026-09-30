'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lightbulb, ArrowRight } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import DonutChart from '@/components/ui/DonutChart';
import {
  MOCK_RESTAURANT,
  MOCK_TOP_PERFORMANCES,
  MOCK_PLATFORMS_BREAKDOWN,
} from '@/lib/mock-data';
import type { PerformanceDTO } from '@/types/dto';
import styles from './performances.module.css';

export default function PerformancesPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState<'posts' | 'formats'>('posts');
  const [perfData, setPerfData] = useState<PerformanceDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPerformances() {
      try {
        const restRes = await fetch('/api/restaurants');
        if (restRes.ok) {
          const restJson = await restRes.json();
          if (restJson.success && restJson.data && restJson.data.length > 0) {
            const restId = restJson.data[0].id;
            const res = await fetch(`/api/performances?restaurantId=${restId}`);
            if (res.ok) {
              const json = await res.json();
              if (json.success && json.data) {
                setPerfData(json.data);
              }
            }
          }
        }
      } catch (err) {
        console.error('Erreur chargement performances:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPerformances();
  }, []);

  const stats = perfData?.summary || MOCK_RESTAURANT.stats;
  const topList = perfData?.topPublications || MOCK_TOP_PERFORMANCES;
  const donutSlices = perfData?.platformDistribution
    ? perfData.platformDistribution.map((d) => ({
        name: d.label,
        percent: d.percentage,
        color: d.color,
      }))
    : MOCK_PLATFORMS_BREAKDOWN;

  return (
    <div className={styles.container}>
      {/* Header */}
      <PageHeader
        title="Performances"
        subtitle="Suivez l'impact de vos publications et l'évolution de votre visibilité."
        action={
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={styles.timeSelect}
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">Ce trimestre</option>
          </select>
        }
      />

      {/* 3 Main Stat Cards */}
      <div className={styles.statsRow}>
        <StatCard
          label="Portée"
          value={stats.reach}
          growth={stats.reachGrowth}
        />
        <StatCard
          label="Interactions"
          value={stats.interactions}
          growth={stats.interactionsGrowth}
        />
        <StatCard
          label="Clics"
          value={stats.clicks}
          growth={stats.clicksGrowth}
        />
      </div>

      {/* Two main cards: Top Performing & Platform breakdown */}
      <div className={styles.chartsGrid}>
        {/* Left: Ce qui fonctionne le mieux */}
        <div className={styles.cardPanel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Ce qui fonctionne le mieux</h3>
            <div className={styles.tabSwitch}>
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.tabBtnActive : ''}`}
              >
                Publications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('formats')}
                className={`${styles.tabBtn} ${activeTab === 'formats' ? styles.tabBtnActive : ''}`}
              >
                Formats
              </button>
            </div>
          </div>

          <div className={styles.rankList}>
            {MOCK_TOP_PERFORMANCES.map((item) => (
              <div key={item.rank} className={styles.rankItem}>
                <div className={styles.rankLeft}>
                  <img src={item.image} alt={item.title} className={styles.rankThumb} />
                  <div className={styles.rankInfo}>
                    <span className={styles.rankTitle}>
                      {item.rank}. {item.title}
                    </span>
                    <span className={styles.rankMeta}>
                      {item.reach} • {item.interactions}
                    </span>
                  </div>
                </div>
                <span className={styles.rankGrowth}>{item.growth}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Répartition par plateforme + Donut Chart */}
        <div className={styles.cardPanel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Répartition par plateforme</h3>
          </div>

          {/* SVG Donut Chart */}
          <DonutChart slices={MOCK_PLATFORMS_BREAKDOWN} />

          {/* Insight box */}
          <div className={styles.insightBox}>
            <div className={styles.insightTextGroup}>
              <Lightbulb size={20} className={styles.insightIcon} />
              <p className={styles.insightText}>
                Vos publications génèrent plus d&apos;engagement que la moyenne de votre secteur.
              </p>
            </div>
            <Link href="#detail" className={styles.insightLink}>
              <span>Voir le détail →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
