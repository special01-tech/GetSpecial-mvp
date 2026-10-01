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
  const [showWhy, setShowWhy] = React.useState(false);
  const isHigh = (opportunity.urgency as string) === 'High' || (opportunity.urgency as string) === 'Haute';

  const handleWhyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowWhy((prev) => !prev);
  };

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

            {opportunity.potentialCovers && (
              <span className={styles.potentialBadge}>
                <Users size={11} />
                <span>{opportunity.potentialCovers}</span>
              </span>
            )}
          </div>

          <h3 className={styles.title}>{opportunity.title}</h3>
        </div>

        <div className={styles.actionArrow}>
          <ChevronRight size={18} className={styles.arrowIcon} />
        </div>
      </div>

      <p className={styles.description}>{opportunity.description}</p>

      {/* Accordéon Pourquoi cette recommandation */}
      <div style={{ marginTop: '4px' }}>
        <button
          type="button"
          onClick={handleWhyClick}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 0',
            color: 'var(--color-primary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {showWhy ? 'Masquer la justification' : 'Pourquoi cette recommandation ?'}
        </button>

        {showWhy && (
          <div
            style={{
              marginTop: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'var(--color-bg-app)',
              border: '1px solid var(--color-border)',
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.4,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-primary)' }}>
              Faits vérifiés utilisés :
            </div>
            {Array.isArray(opportunity.verifiedFacts) && opportunity.verifiedFacts.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {opportunity.verifiedFacts.map((fact: string, idx: number) => (
                  <li key={idx}>{fact}</li>
                ))}
              </ul>
            ) : (
              <div>{opportunity.signalOrigin || 'Conditions et offres du restaurant observées ce jour.'}</div>
            )}
          </div>
        )}
      </div>

      <div className={styles.footerRow} style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
        <span className={styles.signalOrigin}>
          📡 {opportunity.signalOrigin}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--color-primary)',
          }}
        >
          Créer la campagne <ArrowRight size={14} />
        </span>
      </div>
    </article>
  );
}
