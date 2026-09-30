'use client';

import React from 'react';
import { MapPin, Star, Check } from 'lucide-react';
import { RestaurantSearchResult } from '@/services/restaurant-search/restaurant-search.types';
import styles from './RestaurantResultCard.module.css';

interface RestaurantResultCardProps {
  restaurant: RestaurantSearchResult;
  isSelected?: boolean;
  onSelect: (restaurant: RestaurantSearchResult) => void;
}

export default function RestaurantResultCard({
  restaurant,
  isSelected = false,
  onSelect,
}: RestaurantResultCardProps) {
  return (
    <article
      onClick={() => onSelect(restaurant)}
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(restaurant);
        }
      }}
    >
      <div className={styles.imageWrapper}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={restaurant.photoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80'}
          alt={restaurant.name}
          className={styles.image}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <h3 className={styles.name}>{restaurant.name}</h3>
          {isSelected && (
            <span className={styles.checkBadge}>
              <Check size={14} strokeWidth={2.5} />
            </span>
          )}
        </div>

        <div className={styles.addressRow}>
          <MapPin size={14} className={styles.mapIcon} />
          <span className={styles.address}>
            {restaurant.address}, {restaurant.city}
          </span>
        </div>

        <div className={styles.footerRow}>
          {restaurant.cuisineType && (
            <span className={styles.cuisineTag}>{restaurant.cuisineType}</span>
          )}
          {restaurant.rating && (
            <div className={styles.ratingBox}>
              <Star size={12} className={styles.starIcon} />
              <span>{restaurant.rating.toFixed(1)}</span>
              {restaurant.reviewsCount && (
                <span className={styles.reviewsCount}>({restaurant.reviewsCount})</span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
