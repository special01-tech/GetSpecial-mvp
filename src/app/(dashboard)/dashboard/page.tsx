'use client';

import React from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import OpportunityCard from '@/components/ui/OpportunityCard';
import StatCard from '@/components/ui/StatCard';
import { MOCK_OPPORTUNITIES, MOCK_RESTAURANT, MOCK_PUBLICATIONS } from '@/lib/mock-data';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const stats = MOCK_RESTAURANT.stats;
  const recentPosts = MOCK_PUBLICATIONS.slice(0, 3);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <PageHeader
        title="Bonjour, Le Comptoir 👋"
        subtitle="Voici ce que GetSpecial a trouvé pour vous aujourd'hui."
      />

      {/* 3 Opportunities Section */}
      <section aria-labelledby="opportunities-heading">
        <div className={styles.sectionHeader}>
          <h2 id="opportunities-heading" className={styles.sectionTitle}>
            ✨ 3 opportunités pour votre restaurant
          </h2>
          <Link href="/idees" className={styles.viewAllLink}>
            Voir tout →
          </Link>
        </div>

        <div className={styles.opportunitiesGrid}>
          {MOCK_OPPORTUNITIES.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      </section>

      {/* Bottom Section : Activity stats & Recent Publications */}
      <section className={styles.bottomSection}>
        {/* Left Column : Weekly Activity */}
        <div className={styles.subCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Votre activité cette semaine</h3>
          </div>

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
        </div>

        {/* Right Column : Recent Publications */}
        <div className={styles.subCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Vos dernières publications</h3>
            <Link href="/publications" className={styles.viewAllLink}>
              Voir tout →
            </Link>
          </div>

          <div className={styles.recentPostsGrid}>
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href="/publications"
                className={styles.recentPostItem}
                title={post.title}
              >
                <img
                  src={post.image}
                  alt={post.title}
                  className={styles.recentPostImg}
                  loading="lazy"
                />
                <div className={styles.recentPostOverlay}>
                  <span className={styles.recentPostTitle}>{post.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
