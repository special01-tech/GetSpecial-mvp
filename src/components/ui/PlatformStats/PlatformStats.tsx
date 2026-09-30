'use client';

import React from 'react';
import { PlatformStatItem } from '@/services/insights/insights.data';
import styles from './PlatformStats.module.css';

interface PlatformStatsProps {
  platforms: PlatformStatItem[];
}

export default function PlatformStats({ platforms }: PlatformStatsProps) {
  const totalViews = platforms.reduce((acc, p) => acc + p.views, 0);

  return (
    <div className={styles.container}>
      {/* Barre de répartition segmentée visuelle */}
      <div className={styles.segmentedBar} aria-label="Répartition des vues par plateforme">
        {platforms.map((p) => (
          <div
            key={p.id}
            className={styles.segment}
            style={{
              width: `${(p.views / totalViews) * 100}%`,
              backgroundColor: p.color,
            }}
            title={`${p.name}: ${p.views.toLocaleString('fr-FR')} vues (${p.percentage}%)`}
          />
        ))}
      </div>

      {/* Détail par plateforme */}
      <div className={styles.platformsList}>
        {platforms.map((plat) => (
          <div key={plat.id} className={styles.platformRow}>
            <div className={styles.leftCol}>
              <span className={styles.dot} style={{ backgroundColor: plat.color }} />
              <div>
                <span className={styles.name}>{plat.name}</span>
                <span className={styles.interactionsText}>
                  {plat.interactions} interactions
                </span>
              </div>
            </div>

            <div className={styles.rightCol}>
              <span className={styles.viewsCount}>
                {plat.views.toLocaleString('fr-FR')} vues
              </span>
              <span className={styles.percentagePill}>{plat.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
