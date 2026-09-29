import React from 'react';
import styles from './StatusBadge.module.css';

export type BadgeVariant = 'to_publish' | 'scheduled' | 'published' | 'special' | 'relance' | 'success' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
}

export default function StatusBadge({ label, variant = 'neutral', dot = false }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {dot && <span className={styles.dot} />}
      {label}
    </span>
  );
}
