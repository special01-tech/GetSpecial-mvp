'use client';

import React from 'react';
import { Trophy, Clock, MapPin, Music, Sparkles } from 'lucide-react';
import { LocalEventData } from '@/services/today/today.data';
import styles from './TodayEventCard.module.css';

interface TodayEventCardProps {
  event?: LocalEventData | null;
  loading?: boolean;
}

export default function TodayEventCard({ event, loading }: TodayEventCardProps) {
  if (!event || loading) {
    return (
      <div className={styles.card} style={{ minHeight: 110, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F2F2F2', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: 80, height: 18, borderRadius: 12, background: '#F2F2F2', animation: 'pulse 1.5s infinite' }} />
        </div>
        <div style={{ width: '85%', height: 14, borderRadius: 4, background: '#F2F2F2', marginBottom: 6, animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '60%', height: 10, borderRadius: 4, background: '#F7F7F7', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  const isConcert =
    event.category === 'concert' ||
    event.title.toLowerCase().includes('pass') ||
    event.title.toLowerCase().includes('tour') ||
    event.title.toLowerCase().includes('ensemble') ||
    event.title.toLowerCase().includes('concert');

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <div
          className={styles.iconCircle}
          style={{
            backgroundColor: isConcert ? '#F3E8FF' : '#FEF3C7',
          }}
        >
          {isConcert ? (
            <Music size={20} color="#7E22CE" />
          ) : (
            <Trophy size={20} className={styles.trophyIcon} />
          )}
        </div>
        <span className={styles.tagBadge}>
          {event.isReal
            ? 'Ticketmaster Live'
            : event.category === 'sports'
            ? 'Game of the Day'
            : 'Local Event'}
        </span>
      </div>

      <div className={styles.infoArea}>
        <h3 className={styles.title} title={event.title}>
          {event.title}
        </h3>
        <div className={styles.metaRow}>
          <Clock size={12} className={styles.metaIcon} />
          <span>{event.time}</span>
        </div>
        <div className={styles.metaRow}>
          <MapPin size={12} className={styles.metaIcon} />
          <span>{event.distance}</span>
        </div>
      </div>
    </div>
  );
}
