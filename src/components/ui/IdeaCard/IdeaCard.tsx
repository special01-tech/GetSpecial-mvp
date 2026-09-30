'use client';

import React from 'react';
import Link from 'next/link';
import { CloudRain, Trophy, TrendingUp, Calendar, Music, Sparkles } from 'lucide-react';
import type { IdeaItem } from '@/lib/mock-data';
import type { IdeaItemDTO } from '@/types/dto';
import styles from './IdeaCard.module.css';

interface IdeaCardProps {
  idea: IdeaItemDTO | IdeaItem;
}

export default function IdeaCard({ idea }: IdeaCardProps) {
  const renderIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return <CloudRain size={16} className={styles.iconBlue} />;
      case 'sport':
        return <Trophy size={16} className={styles.iconGreen} />;
      case 'trend':
        return <TrendingUp size={16} className={styles.iconOrange} />;
      case 'calendar':
        return <Calendar size={16} className={styles.iconAmber} />;
      case 'music':
        return <Music size={16} className={styles.iconPurple} />;
      default:
        return <Sparkles size={16} className={styles.iconOrange} />;
    }
  };

  return (
    <div className={styles.card}>
      {/* Left Icon */}
      <div className={styles.iconBox}>
        {renderIcon(idea.iconType)}
      </div>

      {/* Center Details */}
      <div className={styles.content}>
        <div className={styles.metaRow}>
          <span className={styles.category}>{idea.category}</span>
          <span className={styles.dot}>•</span>
          <span className={styles.period}>{idea.period}</span>
        </div>
        <h3 className={styles.title}>{idea.title}</h3>
        <p className={styles.description}>{idea.description}</p>
      </div>

      {/* Right Thumbnail & CTA */}
      <div className={styles.rightSide}>
        <div className={styles.thumbnail}>
          <img src={idea.image} alt={idea.title} className={styles.thumbImg} loading="lazy" />
        </div>
        <Link
          href={`/creer?idea=${encodeURIComponent(idea.title)}`}
          className={styles.viewBtn}
        >
          <span>Voir l&apos;idée →</span>
        </Link>
      </div>
    </div>
  );
}
