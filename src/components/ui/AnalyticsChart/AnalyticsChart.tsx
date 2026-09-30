'use client';

import React from 'react';
import { ChartDataPoint } from '@/services/insights/insights.data';
import styles from './AnalyticsChart.module.css';

interface AnalyticsChartProps {
  data: ChartDataPoint[];
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  const maxViews = Math.max(...data.map((d) => d.views), 1);

  return (
    <div className={styles.container}>
      <div className={styles.chartHeader}>
        <div className={styles.legendGroup}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.viewsDot}`} />
            <span>Vues totales</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.interactionsDot}`} />
            <span>Interactions</span>
          </div>
        </div>
        <span className={styles.periodLabel}>4 dernières semaines</span>
      </div>

      {/* Barres d'histogramme SVG/CSS stylisées */}
      <div className={styles.barsContainer}>
        {data.map((point) => {
          const heightPercent = Math.round((point.views / maxViews) * 100);

          return (
            <div key={point.day} className={styles.barCol}>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ height: `${heightPercent}%` }}
                >
                  <span className={styles.tooltip}>{point.views.toLocaleString('fr-FR')}</span>
                </div>
              </div>
              <span className={styles.colLabel}>{point.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
