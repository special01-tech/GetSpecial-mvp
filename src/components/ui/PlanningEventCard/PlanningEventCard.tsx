'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  CloudRain,
  Trophy,
  Sparkles,
  Music,
  PartyPopper,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { PlanningItem, PlanningEventType, PlatformType } from '@/services/planning/planning.data';
import StatusBadge from '@/components/ui/StatusBadge/StatusBadge';
import styles from './PlanningEventCard.module.css';

interface PlanningEventCardProps {
  event: PlanningItem;
  onClick?: (event: PlanningItem) => void;
}

export default function PlanningEventCard({ event, onClick }: PlanningEventCardProps) {
  const getTypeIcon = (type: PlanningEventType) => {
    switch (type) {
      case 'weather':
        return <CloudRain size={16} className={styles.iconWeather} />;
      case 'sport':
        return <Trophy size={16} className={styles.iconSport} />;
      case 'commercial':
        return <Sparkles size={16} className={styles.iconCommercial} />;
      case 'culture':
        return <Music size={16} className={styles.iconCulture} />;
      case 'holiday':
        return <PartyPopper size={16} className={styles.iconHoliday} />;
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
      onClick={() => onClick?.(event)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(event);
        }
      }}
    >
      {/* Header : Type & Statut */}
      <div className={styles.header}>
        <div className={styles.typeWrapper}>
          <div className={styles.typeIconBox}>{getTypeIcon(event.type)}</div>
          <span className={styles.dateText}>{event.date}</span>
        </div>
        <StatusBadge status={event.status} size="sm" />
      </div>

      {/* Titre & Description */}
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{event.title}</h3>
          <div className={styles.timeTag}>
            <Clock size={12} />
            <span>{event.time}</span>
          </div>
        </div>
        <p className={styles.description}>{event.description}</p>
      </div>

      {/* Footer : Plateformes & Estimation d'impact */}
      <div className={styles.footer}>
        <div className={styles.platformsList}>
          {event.platforms.map((p) => (
            <span key={p} className={styles.platformBadge}>
              {getPlatformLabel(p)}
            </span>
          ))}
        </div>

        {event.impactEstimate && (
          <div className={styles.impactBadge}>
            <TrendingUp size={12} />
            <span>{event.impactEstimate}</span>
          </div>
        )}
      </div>
    </article>
  );
}
