'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import OpportunityCard from '@/components/ui/OpportunityCard';
import StatCard from '@/components/ui/StatCard';
import { MOCK_OPPORTUNITIES, MOCK_RESTAURANT, MOCK_PUBLICATIONS } from '@/lib/mock-data';
import type { RestaurantDTO, OpportunityDTO, PublicationDTO } from '@/types/dto';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [restaurant, setRestaurant] = useState<RestaurantDTO | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityDTO[]>([]);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const restRes = await fetch('/api/restaurants');
        if (restRes.ok) {
          const restJson = await restRes.json();
          if (restJson.success && restJson.data && restJson.data.length > 0) {
            const currentRest: RestaurantDTO = restJson.data[0];
            setRestaurant(currentRest);

            // Charger les opportunités et publications en parallèle
            const [oppsRes, pubsRes] = await Promise.all([
              fetch(`/api/opportunities?restaurantId=${currentRest.id}`),
              fetch(`/api/publications?restaurantId=${currentRest.id}`),
            ]);

            if (oppsRes.ok) {
              const oppsJson = await oppsRes.json();
              if (oppsJson.success && Array.isArray(oppsJson.data) && oppsJson.data.length > 0) {
                setOpportunities(oppsJson.data.slice(0, 3));
              }
            }

            if (pubsRes.ok) {
              const pubsJson = await pubsRes.json();
              if (pubsJson.success && Array.isArray(pubsJson.data) && pubsJson.data.length > 0) {
                setPublications(pubsJson.data.slice(0, 3));
              }
            }
          }
        }
      } catch (err) {
        console.error('Erreur chargement Dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const stats = restaurant?.stats || MOCK_RESTAURANT.stats;
  const displayOpps = opportunities.length > 0 ? opportunities : MOCK_OPPORTUNITIES;
  const recentPosts = publications.length > 0 ? publications : MOCK_PUBLICATIONS.slice(0, 3);
  const restaurantName = restaurant?.name || MOCK_RESTAURANT.name;

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <PageHeader
        title={`Bonjour, ${restaurantName} 👋`}
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
          {displayOpps.map((opp) => (
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
