'use client';

import React from 'react';
import { LucideIcon, TrendingUp } from 'lucide-react';
import styles from './MetricCard.module.css';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'accent';
}

export default function MetricCard({
  label,
  value,
  subtext,
  trend,
  icon: Icon,
  variant = 'secondary',
}: MetricCardProps) {
  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.topRow}>
        <div className={styles.iconCircle}>
          <Icon size={18} />
        </div>
        {trend && (
          <span className={styles.trendBadge}>
            <TrendingUp size={11} strokeWidth={2.5} />
            <span>{trend}</span>
          </span>
        )}
      </div>

      <div className={styles.valueGroup}>
        <span className={styles.value}>
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </span>
        <span className={styles.label}>{label}</span>
      </div>

      {subtext && <span className={styles.subtext}>{subtext}</span>}
    </div>
  );
}
