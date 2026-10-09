'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import styles from './StatCard.module.css';

export type StatCardVariant = 'orange' | 'yellow' | 'green' | 'purple';

interface StatCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  subtext: string;
  variant?: StatCardVariant;
}

const variantStyles: Record<
  StatCardVariant,
  { bg: string; color: string }
> = {
  orange: { bg: '#FFF4ED', color: '#F97316' },
  yellow: { bg: '#FEF9C3', color: '#CA8A04' },
  green: { bg: '#DCFCE7', color: '#16A34A' },
  purple: { bg: '#F3E8FF', color: '#9333EA' },
};

export default function StatCard({
  icon: Icon,
  value,
  label,
  subtext,
  variant = 'orange',
}: StatCardProps) {
  const theme = variantStyles[variant] || variantStyles.orange;

  return (
    <div className={styles.statCard}>
      <div className={styles.iconWrapper} style={{ backgroundColor: theme.bg }}>
        <Icon size={22} color={theme.color} />
      </div>
      <div className={styles.contentWrapper}>
        <span className={styles.value}>{value}</span>
        <span className={styles.label}>{label}</span>
        <span className={styles.subtext}>{subtext}</span>
      </div>
    </div>
  );
}
