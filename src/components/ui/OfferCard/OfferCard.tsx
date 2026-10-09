'use client';

import React from 'react';
import { Clock, Percent, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { RestaurantOffer, OfferStatus } from '@/services/restaurant/restaurant-offers.data';
import { PlatformType } from '@/services/planning/planning.data';
import { useLanguage } from '@/i18n';
import styles from './OfferCard.module.css';

interface OfferCardProps {
  offer: RestaurantOffer;
  onClick?: (offer: RestaurantOffer) => void;
  onEdit?: (offer: RestaurantOffer) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
}

export default function OfferCard({
  offer,
  onClick,
  onEdit,
  onDelete,
  onToggleStatus,
}: OfferCardProps) {
  const { t } = useLanguage();

  const getStatusBadge = (status: OfferStatus) => {
    switch (status) {
      case 'active':
        return (
          <button
            type="button"
            className={`${styles.statusBadge} ${styles.statusActive}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus?.(offer.id);
            }}
            title="Cliquez pour changer le statut"
          >
            <span className={styles.statusDot} />
            <span>Active</span>
          </button>
        );
      case 'scheduled':
        return (
          <button
            type="button"
            className={`${styles.statusBadge} ${styles.statusScheduled}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus?.(offer.id);
            }}
            title="Cliquez pour changer le statut"
          >
            <Clock size={11} />
            <span>{t('common.components.offerCard.scheduled')}</span>
          </button>
        );
      case 'draft':
        return (
          <button
            type="button"
            className={`${styles.statusBadge} ${styles.statusDraft}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus?.(offer.id);
            }}
            title="Cliquez pour changer le statut"
          >
            <AlertCircle size={11} />
            <span>{t('common.components.offerCard.draft')}</span>
          </button>
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

          <div className={styles.badgeAndActions}>
            {getStatusBadge(offer.status)}

            {onEdit && (
              <button
                type="button"
                className={styles.actionBtn}
                title="Modifier cette offre"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(offer);
                }}
                aria-label="Modifier"
              >
                <Edit2 size={12} />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                title="Supprimer cette offre"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(offer.id);
                }}
                aria-label="Supprimer"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
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
