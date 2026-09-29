import React from 'react';
import StatusBadge, { BadgeVariant } from '@/components/ui/StatusBadge';
import { PublicationItem } from '@/lib/mock-data';
import styles from './PublicationCard.module.css';

interface PublicationCardProps {
  publication: PublicationItem;
}

export default function PublicationCard({ publication }: PublicationCardProps) {
  let badgeVariant: BadgeVariant = 'to_publish';
  if (publication.status === 'scheduled') badgeVariant = 'scheduled';
  if (publication.status === 'published') badgeVariant = 'published';

  return (
    <div className={styles.card}>
      {/* Media Image */}
      <div className={styles.imageContainer}>
        <img
          src={publication.image}
          alt={publication.title}
          className={styles.image}
          loading="lazy"
        />
        <div className={styles.badgeOverlay}>
          <StatusBadge label={publication.statusLabel} variant={badgeVariant} dot />
        </div>
      </div>

      {/* Details */}
      <div className={styles.content}>
        <h4 className={styles.title}>{publication.title}</h4>
        <div className={styles.metaRow}>
          <span className={styles.datetime}>
            {publication.date} • {publication.time}
          </span>
          {publication.reach && (
            <span className={styles.reachInfo}>
              👁️ {publication.reach}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
