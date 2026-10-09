'use client';

import React from 'react';
import {
  Calendar,
  Sun,
  Clock,
  Gift,
  Zap,
  ArrowUpRight,
  Coffee,
  Sparkles,
  Bookmark,
} from 'lucide-react';
import { TodayOpportunity } from '@/services/today/today.data';
import styles from './OpportunityCard.module.css';

interface OpportunityCardProps {
  opportunity: TodayOpportunity;
  onClick: (opp: TodayOpportunity) => void;
}

export default function OpportunityCard({ opportunity, onClick }: OpportunityCardProps) {
  const importance = opportunity.importance || 'HIGH';
  const score = opportunity.impactScore || (importance === 'HIGH' ? 92 : importance === 'MEDIUM' ? 78 : 65);
  const isHigh = importance === 'HIGH' || score >= 85;

  // Sélection de l'icône et du style pastel selon la catégorie (comme dans l'image de référence)
  const getIconConfig = () => {
    switch (opportunity.category) {
      case 'LOCAL_EVENT':
        return {
          icon: <Calendar size={22} strokeWidth={2} />,
          className: styles.iconBlue,
        };
      case 'WEATHER_BOOST':
        return {
          icon: <Sun size={22} strokeWidth={2} />,
          className: styles.iconYellow,
        };
      case 'EMPTY_SLOT':
        return {
          icon: <Clock size={22} strokeWidth={2} />,
          className: styles.iconPurple,
        };
      case 'OFFER_PROMOTION':
        return {
          icon: <Gift size={22} strokeWidth={2} />,
          className: styles.iconPink,
        };
      default:
        return {
          icon: isHigh ? <Zap size={22} strokeWidth={2} /> : <Sparkles size={22} strokeWidth={2} />,
          className: isHigh ? styles.iconOrange : styles.iconBlue,
        };
    }
  };

  const { icon, className: iconColorClass } = getIconConfig();

  // Petit signe subtil sur la ligne (sans badge)
  const getDotClass = () => {
    if (importance === 'HIGH' || score >= 85) return styles.dotHigh;
    if (importance === 'MEDIUM' || score >= 70) return styles.dotMedium;
    return styles.dotModerate;
  };

  const getStrengthText = () => {
    if (importance === 'HIGH' || score >= 85) return 'Forte';
    if (importance === 'MEDIUM' || score >= 70) return 'Moyenne';
    return 'Modérée';
  };

  // Sous-texte sobre et contextuel (sans mot-code)
  const contextSubtitle =
    opportunity.offer?.validityText ||
    opportunity.signalOrigin ||
    opportunity.description;

  return (
    <article
      onClick={() => onClick(opportunity)}
      className={styles.cardRow}
      role="button"
      tabIndex={0}
      aria-label={`Opportunité : ${opportunity.title}. Force : ${getStrengthText()}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(opportunity);
        }
      }}
    >
      {/* Partie Gauche : Icône squircle pastel + Titre & Sous-titre */}
      <div className={styles.leftSection}>
        <div className={`${styles.iconSquare} ${iconColorClass}`}>
          {icon}
        </div>

        <div className={styles.textColumn}>
          <h4 className={styles.title}>{opportunity.title}</h4>
          <p className={styles.subtitle}>{contextSubtitle}</p>
        </div>
      </div>

      {/* Partie Droite : Valeur sobre avec signe subtil + Bouton d'action */}
      <div className={styles.rightSection}>
        <div className={styles.valueBlock}>
          <div className={styles.impactRow}>
            {/* Petit signe subtil sur la ligne */}
            <span
              className={`${styles.subtleDot} ${getDotClass()}`}
              title={`Force évaluée par l'IA : ${score}%`}
            />
            <span className={styles.impactValue}>{getStrengthText()}</span>
          </div>
        </div>

        {/* Petit bouton d'action discret pastel (comme sur l'image) */}
        <div className={styles.actionsRow}>
          <div className={styles.actionButton} title="Voir le détail de l'opportunité">
            <ArrowUpRight size={17} strokeWidth={2.2} />
          </div>
        </div>
      </div>
    </article>
  );
}
