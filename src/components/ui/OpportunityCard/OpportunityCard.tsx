'use client';

import React from 'react';
import Link from 'next/link';
import { CloudRain, Trophy, Flame, Wine, Utensils, Music, ArrowRight } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import type { Opportunity } from '@/lib/mock-data';
import type { OpportunityDTO } from '@/types/dto';
import styles from './OpportunityCard.module.css';

interface OpportunityCardProps {
  opportunity: OpportunityDTO | Opportunity;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const renderIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return <CloudRain size={16} className={styles.iconBlue} />;
      case 'sport':
        return <Trophy size={16} className={styles.iconGreen} />;
      case 'cocktail':
        return <Wine size={16} className={styles.iconOrange} />;
      case 'music':
        return <Music size={16} className={styles.iconPurple} />;
      default:
        return <Flame size={16} className={styles.iconOrange} />;
    }
  };

  const badgeVariant = opportunity.badge === 'Relance' ? 'relance' : 'special';

  return (
    <div className={styles.card}>
      {/* Top Header : Icon circle & Badge */}
      <div className={styles.cardHeader}>
        <div className={styles.iconCircle}>
          {renderIcon(opportunity.iconType)}
        </div>
        <StatusBadge label={opportunity.badge} variant={badgeVariant} />
      </div>

      {/* Title & Description */}
      <div className={styles.body}>
        <h3 className={styles.title}>{opportunity.title}</h3>
        <p className={styles.description}>{opportunity.description}</p>
      </div>

      {/* Visual illustration image */}
      <div className={styles.imageContainer}>
        <img
          src={opportunity.image}
          alt={opportunity.title}
          className={styles.image}
          loading="lazy"
        />
      </div>

      {/* CTA Button */}
      <div className={styles.footer}>
        <Link
          href={`/creer?idea=${encodeURIComponent(opportunity.title)}`}
          className={styles.ctaButton}
        >
          <span>{opportunity.ctaText}</span>
        </Link>
      </div>
    </div>
  );
}
