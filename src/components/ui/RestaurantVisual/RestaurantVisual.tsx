'use client';

import React from 'react';
import Image from 'next/image';
import styles from './RestaurantVisual.module.css';

interface RestaurantVisualProps {
  imageUrl?: string;
  badgeText?: string;
  className?: string;
}

export default function RestaurantVisual({
  imageUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  badgeText = 'Service du midi complet • +34% de couverts',
  className = '',
}: RestaurantVisualProps) {
  return (
    <div className={`${styles.visualWrapper} ${className}`}>
      <div className={styles.imageContainer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Ambiance restaurant GetSpecial"
          className={styles.image}
        />
        <div className={styles.gradientOverlay} />
      </div>

      {badgeText && (
        <div className={styles.floatingBadge}>
          <span className={styles.pulseDot} />
          <span className={styles.badgeText}>{badgeText}</span>
        </div>
      )}
    </div>
  );
}
