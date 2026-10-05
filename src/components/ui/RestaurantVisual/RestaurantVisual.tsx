'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/i18n';
import styles from './RestaurantVisual.module.css';

interface RestaurantVisualProps {
  imageUrl?: string;
  badgeText?: string;
  className?: string;
}

export default function RestaurantVisual({
  imageUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  badgeText,
  className = '',
}: RestaurantVisualProps) {
  const { t } = useLanguage();
  const resolvedBadgeText =
    badgeText ?? t('common.components.restaurantVisual.defaultBadge');
  return (
    <div className={`${styles.visualWrapper} ${className}`}>
      <div className={styles.imageContainer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={t('common.components.restaurantVisual.imageAlt')}
          className={styles.image}
        />
        <div className={styles.gradientOverlay} />
      </div>

      {resolvedBadgeText && (
        <div className={styles.floatingBadge}>
          <span className={styles.pulseDot} />
          <span className={styles.badgeText}>{resolvedBadgeText}</span>
        </div>
      )}
    </div>
  );
}
