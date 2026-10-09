'use client';

import React, { useState } from 'react';
import { Trophy, Clock, MapPin, Music, Sparkles, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { LocalEventData } from '@/services/today/today.data';
import styles from './TodayEventCard.module.css';

interface TodayEventCardProps {
  event?: LocalEventData | null;
  events?: LocalEventData[];
  loading?: boolean;
}

export default function TodayEventCard({ event, events, loading }: TodayEventCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const eventList = events && events.length > 0 ? events : event ? [event] : [];
  const currentEvent = eventList[activeIndex] || eventList[0];

  if (loading || !currentEvent) {
    return (
      <div className={styles.card} style={{ minHeight: 120, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F2F2F2', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: 80, height: 18, borderRadius: 12, background: '#F2F2F2', animation: 'pulse 1.5s infinite' }} />
        </div>
        <div style={{ width: '85%', height: 14, borderRadius: 4, background: '#F2F2F2', marginBottom: 6, animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '60%', height: 10, borderRadius: 4, background: '#F7F7F7', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  const category = currentEvent.category || 'sports';
  const isConcert = category === 'concert' || currentEvent.title.toLowerCase().includes('concert') || currentEvent.title.toLowerCase().includes('jazz');
  const isCulture = category === 'culture' || currentEvent.title.toLowerCase().includes('afterwork') || currentEvent.title.toLowerCase().includes('meetup');

  const getCategoryTheme = () => {
    if (isConcert) {
      return {
        bg: '#F3E8FF',
        badgeBg: '#FAF5FF',
        badgeColor: '#7E22CE',
        badgeBorder: '#E9D5FF',
        icon: <Music size={18} color="#7E22CE" />,
        label: 'Concert & Live',
      };
    }
    if (isCulture) {
      return {
        bg: '#E0F2FE',
        badgeBg: '#F0F9FF',
        badgeColor: '#0369A1',
        badgeBorder: '#BAE6FD',
        icon: <Sparkles size={18} color="#0284C7" />,
        label: 'Afterwork & Culture',
      };
    }
    return {
      bg: '#FEF3C7',
      badgeBg: '#FFFBEB',
      badgeColor: '#B45309',
      badgeBorder: '#FDE68A',
      icon: <Trophy size={18} color="#D97706" />,
      label: 'Match du jour',
    };
  };

  const theme = getCategoryTheme();

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.iconCircle} style={{ backgroundColor: theme.bg }}>
          {theme.icon}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className={styles.tagBadge}
            style={{
              backgroundColor: theme.badgeBg,
              color: theme.badgeColor,
              borderColor: theme.badgeBorder,
            }}
          >
            {theme.label}
          </span>

          {eventList.length > 1 && (
            <div className={styles.navControls}>
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : eventList.length - 1))}
                className={styles.navBtn}
                title="Événement précédent"
              >
                <ChevronLeft size={13} />
              </button>
              <span className={styles.pageIndicator}>
                {activeIndex + 1}/{eventList.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev < eventList.length - 1 ? prev + 1 : 0))}
                className={styles.navBtn}
                title="Événement suivant"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.infoArea}>
        <h3 className={styles.title} title={currentEvent.title}>
          {currentEvent.title}
        </h3>
        <div className={styles.metaRow}>
          <Clock size={12} className={styles.metaIcon} />
          <span>{currentEvent.time}</span>
        </div>
        <div className={styles.metaRow}>
          <MapPin size={12} className={styles.metaIcon} />
          <span>{currentEvent.distance}</span>
          {currentEvent.venue && <span style={{ opacity: 0.75 }}>• {currentEvent.venue}</span>}
        </div>
      </div>

      {eventList.length > 1 && (
        <div className={styles.dotsRow}>
          {eventList.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`${styles.dot} ${idx === activeIndex ? styles.dotActive : ''}`}
              title={`Événement ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

