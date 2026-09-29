import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string;
  growth: string;
  isPositive?: boolean;
}

export default function StatCard({
  label,
  value,
  growth,
  isPositive = true,
}: StatCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      <div className={styles.valueRow}>
        <span className={styles.value}>{value}</span>
        <div className={`${styles.growth} ${isPositive ? styles.positive : styles.negative}`}>
          {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span>{growth}</span>
        </div>
      </div>
    </div>
  );
}
