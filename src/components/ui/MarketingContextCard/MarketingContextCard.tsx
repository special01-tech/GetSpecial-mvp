'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Trophy,
  Music,
  Zap,
} from 'lucide-react';
import { LocalEventData } from '@/services/today/today.data';
import { useLanguage } from '@/i18n';
import styles from './MarketingContextCard.module.css';

interface MarketingContextCardProps {
  events: LocalEventData[];
  loading?: boolean;
  onActionClick?: (event: LocalEventData) => void;
}

export default function MarketingContextCard({
  events,
  loading = false,
  onActionClick,
}: MarketingContextCardProps) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const eventList = events && events.length > 0 ? events : [];
  const currentEvent = eventList[activeIndex] || eventList[0];

  // Défilement automatique doux toutes les 5 secondes (pause au survol)
  useEffect(() => {
    if (eventList.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev < eventList.length - 1 ? prev + 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, [eventList.length, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : eventList.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev < eventList.length - 1 ? prev + 1 : 0));
  };

  const getEventCategoryInfo = (ev: LocalEventData) => {
    const titleLower = (ev.title || '').toLowerCase();
    const category = ev.category || '';
    if (category === 'concert' || titleLower.includes('concert') || titleLower.includes('jazz')) {
      return {
        label: 'Concert & Live',
        badgeBg: 'rgba(126, 34, 206, 0.9)',
        badgeColor: '#FFFFFF',
        icon: <Music size={12} color="#FFFFFF" />,
        defaultImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        advice: 'Ambiance festive : mettez en avant vos cocktails signatures et planches à partager.',
      };
    }
    if (category === 'culture' || titleLower.includes('afterwork') || titleLower.includes('mixer')) {
      return {
        label: 'Afterwork & Pro',
        badgeBg: 'rgba(3, 105, 161, 0.9)',
        badgeColor: '#FFFFFF',
        icon: <Sparkles size={12} color="#FFFFFF" />,
        defaultImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
        advice: 'Clientèle d’entreprises : formule Happy Hour bière & tapas idéale dès 18h30.',
      };
    }
    return {
      label: 'Match du jour',
      badgeBg: 'rgba(217, 119, 6, 0.9)',
      badgeColor: '#FFFFFF',
      icon: <Trophy size={12} color="#FFFFFF" />,
      defaultImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80',
      advice: 'Supporters attendus : diffusez le match et proposez une offre spéciale burgers & bières.',
    };
  };

  if (loading) {
    return (
      <div className={styles.card} style={{ minHeight: 280, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '90%', height: 120, background: '#F3F4F6', borderRadius: 12, marginBottom: 12 }} />
        <div style={{ width: '70%', height: 16, background: '#F3F4F6', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ width: '50%', height: 12, background: '#F3F4F6', borderRadius: 4 }} />
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className={styles.card} style={{ minHeight: 240, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16 }}>
        <Sparkles size={28} color="#FF5C00" style={{ marginBottom: 12 }} />
        <h4 style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 600, color: '#111827' }}>Aucun événement de quartier aujourd&apos;hui</h4>
        <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#6B7280', maxWidth: 280 }}>
          Vous organisez une soirée ou un concert ? Ajoutez votre propre événement pour booster vos opportunités.
        </p>
        <a
          href="/dashboard/restaurant/events"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            backgroundColor: '#FFF7ED',
            color: '#FF5C00',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            border: '1px solid #FED7AA',
          }}
        >
          + Ajouter un événement
        </a>
      </div>
    );
  }

  const catInfo = getEventCategoryInfo(currentEvent);
  const eventImg = currentEvent.imageUrl || catInfo.defaultImage;

  return (
    <div
      className={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Bannière visuelle haute avec image et contrôles flottants */}
      <div className={styles.bannerWrapper}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={eventImg}
          alt={currentEvent.title}
          className={styles.bannerImg}
        />
        <div className={styles.bannerGradient} />

        {/* Contrôles supérieurs sur l'image : Badge catégorie & Flèches de navigation */}
        <div className={styles.bannerTopControls}>
          <span
            className={styles.tagBadge}
            style={{
              backgroundColor: catInfo.badgeBg,
              color: catInfo.badgeColor,
            }}
          >
            {catInfo.icon}
            {catInfo.label}
          </span>

          {eventList.length > 1 && (
            <div className={styles.navControls}>
              <button
                type="button"
                onClick={handlePrev}
                className={styles.navBtn}
                aria-label="Signal précédent"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className={styles.navBtn}
                aria-label="Signal suivant"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Titre sur le bas de la bannière visuelle */}
        <div className={styles.bannerBottomText}>
          <h4 className={styles.bannerTitle}>{currentEvent.title}</h4>
        </div>
      </div>

      {/* Corps de la carte */}
      <div className={styles.cardBody}>
        {/* Métadonnées : Horaires et Lieu */}
        <div className={styles.metaRow}>
          <span className={styles.metaItem}>
            <Clock size={13} className={styles.metaIcon} />
            {currentEvent.time}
          </span>
          <span className={styles.metaItem}>
            <MapPin size={13} className={styles.metaIcon} />
            {currentEvent.distance} {currentEvent.venue ? `• ${currentEvent.venue}` : ''}
          </span>
        </div>

        {/* Conseil / Opportunité IA mis en valeur */}
        <div className={styles.insightBox}>
          <Zap size={14} className={styles.insightIcon} />
          <span className={styles.insightText}>
            {currentEvent.summary || catInfo.advice}
          </span>
        </div>

        {/* Bouton d'action directe */}
        <button
          type="button"
          onClick={() => onActionClick && onActionClick(currentEvent)}
          className={styles.actionBtn}
        >
          <Sparkles size={14} />
          <span>{t('dashboard.marketingContext.boostAction')}</span>
        </button>

        {/* Puces simples en bas (sans numéro de page) */}
        {eventList.length > 1 && (
          <div className={styles.dotsRow}>
            {eventList.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`${styles.dot} ${idx === activeIndex ? styles.dotActive : ''}`}
                aria-label={`Aller à l'événement ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
