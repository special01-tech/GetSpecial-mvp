'use client';

import React from 'react';
import { Zap, Clock, Users, ArrowRight, ChevronRight } from 'lucide-react';
import { TodayOpportunity, UrgencyLevel } from '@/services/today/today.data';
import styles from './OpportunityCard.module.css';

interface OpportunityCardProps {
  opportunity: TodayOpportunity;
  onClick: (opp: TodayOpportunity) => void;
}

export default function OpportunityCard({ opportunity, onClick }: OpportunityCardProps) {
  const isHigh = (opportunity.urgency as string) === 'High' || (opportunity.urgency as string) === 'Haute';

  return (
    <article
      onClick={() => onClick(opportunity)}
      className={`${styles.card} ${isHigh ? styles.cardHighUrgency : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(opportunity);
        }
      }}
    >
      <div className={styles.cardHeader}>
        <div className={styles.titleCol}>
          <div className={styles.badgeRow}>
            <span
              className={`${styles.urgencyBadge} ${
                isHigh ? styles.badgeHigh : styles.badgeMedium
              }`}
            >
              {isHigh ? <Zap size={11} strokeWidth={2.5} /> : <Clock size={11} />}
              <span>{opportunity.urgency}</span>
            </span>

            <span className={styles.potentialBadge}>
              <Users size={11} />
              <span>{opportunity.potentialCovers}</span>
            </span>
          </div>

          <h3 className={styles.title}>{opportunity.title}</h3>
        </div>

        <div className={styles.actionArrow}>
          <ChevronRight size={18} className={styles.arrowIcon} />
        </div>
      </div>

      <p className={styles.description}>{opportunity.description}</p>

      <div className={styles.footerRow}>
        <span className={styles.signalOrigin}>
          📡 {opportunity.signalOrigin}
        </span>
        <span className={styles.timeTag}>
          {opportunity.recommendedTime}
        </span>
      </div>
    </article>
  );
}
