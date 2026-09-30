'use client';

import React from 'react';
import { MapPin, Phone, Clock, Star, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { RestaurantSearchResult } from '@/services/restaurant-search/restaurant-search.types';
import styles from './RestaurantCard.module.css';

interface RestaurantCardProps {
  restaurant: RestaurantSearchResult;
  className?: string;
}

export default function RestaurantCard({ restaurant, className = '' }: RestaurantCardProps) {
  const gallery = restaurant.photoGallery && restaurant.photoGallery.length > 0
    ? restaurant.photoGallery
    : [restaurant.photoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'];

  return (
    <div className={`${styles.card} ${className}`}>
      {/* Photo Principale avec Badge d'Ouverture */}
      <div className={styles.mainImageWrapper}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={restaurant.photoUrl || gallery[0]}
          alt={restaurant.name}
          className={styles.mainImage}
        />
        <div className={styles.imageOverlay} />

        <div className={styles.topBadges}>
          <span className={`${styles.statusBadge} ${restaurant.isOpenNow !== false ? styles.open : styles.closed}`}>
            <span className={styles.statusDot} />
            <span>{restaurant.isOpenNow !== false ? 'Ouvert actuellement' : 'Fermé'}</span>
          </span>

          {restaurant.rating && (
            <span className={styles.ratingBadge}>
              <Star size={13} className={styles.starIcon} />
              <span>{restaurant.rating.toFixed(1)}</span>
              {restaurant.reviewsCount && (
                <span className={styles.reviewsCount}>({restaurant.reviewsCount})</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Détails du restaurant */}
      <div className={styles.details}>
        <div className={styles.titleSection}>
          <h2 className={styles.name}>{restaurant.name}</h2>
          {restaurant.cuisineType && (
            <span className={styles.cuisineTag}>{restaurant.cuisineType}</span>
          )}
        </div>

        <div className={styles.infoList}>
          {/* Adresse */}
          <div className={styles.infoItem}>
            <MapPin size={16} className={styles.infoIcon} />
            <span className={styles.infoText}>
              {restaurant.address}, {restaurant.city} {restaurant.postalCode || ''}
            </span>
          </div>

          {/* Téléphone */}
          {restaurant.phone && (
            <div className={styles.infoItem}>
              <Phone size={16} className={styles.infoIcon} />
              <span className={styles.infoText}>{restaurant.phone}</span>
            </div>
          )}

          {/* Horaires */}
          {restaurant.openingHours && (
            <div className={styles.infoItem}>
              <Clock size={16} className={styles.infoIcon} />
              <span className={styles.infoText}>{restaurant.openingHours}</span>
            </div>
          )}
        </div>

        {/* Galerie Photos */}
        {gallery.length > 1 && (
          <div className={styles.gallerySection}>
            <div className={styles.galleryHeader}>
              <ImageIcon size={14} className={styles.galleryIcon} />
              <span>Galerie photos</span>
            </div>
            <div className={styles.galleryGrid}>
              {gallery.slice(0, 3).map((imgUrl, idx) => (
                <div key={idx} className={styles.galleryThumbWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`${restaurant.name} photo ${idx + 1}`}
                    className={styles.galleryThumb}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
