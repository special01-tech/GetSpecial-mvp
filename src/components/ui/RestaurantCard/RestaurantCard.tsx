'use client';

import React from 'react';
import { MapPin, Phone, Clock, Star, CheckCircle, Image as ImageIcon, Store } from 'lucide-react';
import { RestaurantSearchResult } from '@/services/restaurant-search/restaurant-search.types';
import { useLanguage } from '@/i18n';
import styles from './RestaurantCard.module.css';

interface RestaurantCardProps {
  restaurant: RestaurantSearchResult;
  className?: string;
}

export default function RestaurantCard({ restaurant, className = '' }: RestaurantCardProps) {
  const { t } = useLanguage();
  const validPhoto = restaurant.photoUrl && !restaurant.photoUrl.includes('unsplash.com')
    ? restaurant.photoUrl
    : undefined;

  const validGallery = (restaurant.photoGallery || []).filter(
    (img: string) => img && !img.includes('unsplash.com')
  );

  return (
    <div className={`${styles.card} ${className}`}>
      {/* Photo Principale avec Badge d'Ouverture */}
      <div className={styles.mainImageWrapper}>
        {validPhoto ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={validPhoto}
              alt={restaurant.name}
              className={styles.mainImage}
            />
            <div className={styles.imageOverlay} />
          </>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
              color: '#FF5A00',
            }}
          >
            <Store size={48} strokeWidth={1.5} opacity={0.7} />
          </div>
        )}

        <div className={styles.topBadges}>
          <span className={`${styles.statusBadge} ${restaurant.isOpenNow !== false ? styles.open : styles.closed}`}>
            <span className={styles.statusDot} />
            <span>
              {restaurant.isOpenNow !== false
                ? t('common.components.restaurantCard.openNow')
                : t('common.components.restaurantCard.closed')}
            </span>
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
        {validGallery.length > 1 && (
          <div className={styles.gallerySection}>
            <div className={styles.galleryHeader}>
              <ImageIcon size={14} className={styles.galleryIcon} />
              <span>{t('common.components.restaurantCard.galleryTitle')}</span>
            </div>
            <div className={styles.galleryGrid}>
              {validGallery.slice(0, 3).map((imgUrl: string, idx: number) => (
                <div key={idx} className={styles.galleryThumbWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={t('common.components.restaurantCard.photoAlt', {
                      name: restaurant.name,
                      index: idx + 1,
                    })}
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
