import React from 'react';
import { LucideIcon } from 'lucide-react';
import styles from './BenefitItem.module.css';

interface BenefitItemProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export default function BenefitItem({
  icon: Icon,
  title,
  description,
  className = '',
}: BenefitItemProps) {
  return (
    <div className={`${styles.itemCard} ${className}`}>
      <div className={styles.iconContainer}>
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
      </div>
    </div>
  );
}
