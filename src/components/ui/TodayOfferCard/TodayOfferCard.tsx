'use client';

import React from 'react';
import { Tag, Clock, Sparkles, Check, ArrowRight } from 'lucide-react';
import { TodayOffer } from '@/services/today/today.data';
import { useLanguage } from '@/i18n';
import styles from './TodayOfferCard.module.css';

interface TodayOfferCardProps {
  offer: TodayOffer;
  onActivateToggle?: (id: string) => void;
}

export default function TodayOfferCard({ offer, onActivateToggle }: TodayOfferCardProps) {
  const { t } = useLanguage();
  return (
    <div className={styles.card}>
      <div className={styles.leftAccent} />

      <div className={styles.mainContent}>
        <div className={styles.topRow}>
          <div className={styles.badgeGroup}>
            <span className={styles.discountBadge}>{offer.discountBadge}</span>
            <span className={styles.itemTypeBadge}>{offer.itemType}</span>
          </div>

          <div className={styles.timeTag}>
            <Clock size={12} className={styles.clockIcon} />
            <span>{offer.timeSlot}</span>
          </div>
        </div>

        <h3 className={styles.title}>{offer.title}</h3>
        <p className={styles.description}>{offer.description}</p>

        <div className={styles.actionRow}>
          <span className={styles.activeIndicator}>
            <span className={styles.statusDot} />
            <span>{t('common.components.todayOfferCard.readyLabel')}</span>
          </span>

          <button
            type="button"
            onClick={() => onActivateToggle && onActivateToggle(offer.id)}
            className={styles.boostBtn}
          >
            <span>{t('common.components.todayOfferCard.boostButton')}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
