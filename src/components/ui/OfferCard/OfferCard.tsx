'use client';

import React from 'react';
import { Clock, Percent, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { RestaurantOffer, OfferStatus } from '@/services/restaurant/restaurant-offers.data';
import { PlatformType } from '@/services/planning/planning.data';
import styles from './OfferCard.module.css';

interface OfferCardProps {
  offer: RestaurantOffer;
  onClick?: (offer: RestaurantOffer) => void;
}

export default function OfferCard({ offer, onClick }: OfferCardProps) {
  const getStatusBadge = (status: OfferStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className={`${styles.statusBadge} ${styles.statusActive}`}>
            <span className={styles.statusDot} />
            <span>Active</span>
          </span>
        );
      case 'scheduled':
        return (
          <span className={`${styles.statusBadge} ${styles.statusScheduled}`}>
            <Clock size={11} />
            <span>Programmée</span>
          </span>
        );
      case 'draft':
        return (
          <span className={`${styles.statusBadge} ${styles.statusDraft}`}>
            <AlertCircle size={11} />
            <span>Brouillon</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getPlatformLabel = (platform: PlatformType): string => {
    switch (platform) {
      case 'instagram':
        return 'Instagram';
      case 'facebook':
        return 'Facebook';
      case 'google_business':
        return 'Google Business';
    }
  };

  return (
    <article
      className={styles.card}
      onClick={() => onClick?.(offer)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(offer);
        }
      }}
    >
      <div className={styles.imageCol}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={offer.image} alt={offer.name} className={styles.cardImage} />
        {offer.discount && (
          <span className={styles.discountBadge}>
            <Percent size={10} strokeWidth={2.5} />
            {offer.discount}
          </span>
        )}
      </div>

      <div className={styles.contentCol}>
        <div className={styles.topRow}>
          <h3 className={styles.name}>{offer.name}</h3>
          {getStatusBadge(offer.status)}
        </div>

        <p className={styles.description}>{offer.description}</p>

        <div className={styles.periodRow}>
          <Clock size={12} className={styles.clockIcon} />
          <span>{offer.period}</span>
        </div>

        <div className={styles.platformsRow}>
          {offer.platforms.map((p) => (
            <span key={p} className={styles.platformBadge}>
              {getPlatformLabel(p)}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
