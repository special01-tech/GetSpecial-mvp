'use client';

import React from 'react';
import {
  Store,
  Tag,
  Utensils,
  Clock,
  Sun,
  Bike,
  Sparkles,
  CheckCircle2,
  LucideIcon,
} from 'lucide-react';
import styles from './SummaryItem.module.css';

interface SummaryItemProps {
  icon: LucideIcon;
  label: string;
  value: string | React.ReactNode;
  badge?: string;
  isPositive?: boolean;
}

export default function SummaryItem({
  icon: Icon,
  label,
  value,
  badge,
  isPositive,
}: SummaryItemProps) {
  return (
    <div className={styles.itemRow}>
      <div className={styles.iconContainer}>
        <Icon size={16} strokeWidth={2.2} />
      </div>

      <div className={styles.labelCol}>
        <span className={styles.label}>{label}</span>
      </div>

      <div className={styles.valueCol}>
        {typeof value === 'string' ? (
          <span className={styles.value}>{value}</span>
        ) : (
          value
        )}

        {badge && (
          <span
            className={`${styles.badge} ${
              isPositive === true
                ? styles.badgePositive
                : isPositive === false
                ? styles.badgeNegative
                : styles.badgeNeutral
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
