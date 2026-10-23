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
  ExternalLink,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';
import { LocalEventData } from '@/services/today/today.data';
import EventPreferencesModal from '@/components/ui/EventPreferencesModal/EventPreferencesModal';
import { useLanguage } from '@/i18n';
import styles from './MarketingContextCard.module.css';

interface MarketingContextCardProps {
  events: LocalEventData[];
  loading?: boolean;
  onActionClick?: (event: LocalEventData) => void;
  onPreferencesUpdated?: () => void;
  restaurantId?: string;
}

export default function MarketingContextCard({
  events,
  loading = false,
  onActionClick,
  onPreferencesUpdated,
  restaurantId,
}: MarketingContextCardProps) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);

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
    const category = (ev.category || '').toLowerCase();

    // 1. Célébrations et Fêtes (Calendarific / National)
    if (titleLower.includes('halloween')) {
      return {
        label: 'Fête & Célébration',
        badgeBg: 'rgba(234, 88, 12, 0.95)',
        badgeColor: '#FFFFFF',
        icon: <Calendar size={12} color="#FFFFFF" />,
        defaultImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
        advice: 'Soirée festive : proposez un cocktail signature d’Halloween, des tapas à partager et une ambiance thématique.',
      };
    }

    if (category === 'holiday' || titleLower.includes('fête') || titleLower.includes('journée') || titleLower.includes('célébration') || titleLower.includes('toussaint') || titleLower.includes('noël')) {
      return {
        label: 'Fête & Célébration',
        badgeBg: 'rgba(234, 88, 12, 0.95)',
        badgeColor: '#FFFFFF',
        icon: <Calendar size={12} color="#FFFFFF" />,
        defaultImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80',
        advice: 'Occasion festive : mettez en avant un menu spécial, un plat signature ou une offre à partager.',
      };
    }

    // 2. Concerts et Musique Live (Ticketmaster)
    if (category === 'concert' || category === 'music' || titleLower.includes('concert') || titleLower.includes('tour') || titleLower.includes('live') || titleLower.includes('festival') || titleLower.includes('jazz')) {
      return {
        label: 'Concert & Spectacle',
        badgeBg: 'rgba(126, 34, 206, 0.95)',
        badgeColor: '#FFFFFF',
        icon: <Music size={12} color="#FFFFFF" />,
        defaultImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        advice: 'Public avant/après concert : formule repas rapide ou planches & cocktails avant 20h.',
      };
    }

    // 3. Sport & Match (Ticketmaster)
    if (category === 'sports' || category === 'sport' || titleLower.includes('match') || titleLower.includes('tournoi') || titleLower.includes('vs') || titleLower.includes('cup') || titleLower.includes('foot') || titleLower.includes('rugby') || titleLower.includes('tennis') || titleLower.includes('open') || titleLower.includes('basketball') || titleLower.includes('nba')) {
      return {
        label: 'Sport & Match',
        badgeBg: 'rgba(217, 119, 6, 0.95)',
        badgeColor: '#FFFFFF',
        icon: <Trophy size={12} color="#FFFFFF" />,
        defaultImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
        advice: 'Supporters et fans attendus : diffusez le match et proposez une offre spéciale burgers & bières.',
      };
    }

    // 4. Arts, Théâtre & Comédie (Ticketmaster)
    if (category === 'arts' || category === 'theatre' || category === 'theatre & comedy' || titleLower.includes('théâtre') || titleLower.includes('spectacle') || titleLower.includes('comédie') || titleLower.includes('stand-up') || titleLower.includes('museum') || titleLower.includes('exposition')) {
      return {
        label: 'Arts & Théâtre',
        badgeBg: 'rgba(3, 105, 161, 0.95)',
        badgeColor: '#FFFFFF',
        icon: <Sparkles size={12} color="#FFFFFF" />,
        defaultImage: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
        advice: 'Sortie culturelle : formule dîner d’après-spectacle ou apéritif dînatoire.',
      };
    }

    // 5. Défaut / Culturel
    return {
      label: 'Événement local',
      badgeBg: 'rgba(79, 70, 229, 0.95)',
      badgeColor: '#FFFFFF',
      icon: <Sparkles size={12} color="#FFFFFF" />,
      defaultImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      advice: 'Affluence locale attendue : captez le flux de passants avec votre formule du moment.',
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
        <h4 style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 600, color: '#111827' }}>Aucun événement correspondant à vos critères</h4>
        <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#6B7280', maxWidth: 300 }}>
          Ajustez vos préférences ou élargissez le rayon géographique pour capter de nouveaux événements locaux.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => setIsPrefModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              backgroundColor: '#FF5C00',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={14} />
            Modifier mes filtres
          </button>
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
            + Événement restaurant
          </a>
        </div>
        <EventPreferencesModal
          isOpen={isPrefModalOpen}
          onClose={() => setIsPrefModalOpen(false)}
          onPreferencesUpdated={() => onPreferencesUpdated && onPreferencesUpdated()}
          restaurantId={restaurantId}
        />
      </div>
    );
  }

  const catInfo = getEventCategoryInfo(currentEvent);
  // Vraie image Ticketmaster en priorité, puis fallback catégoriel HD
  const eventImg = currentEvent.imageUrl || catInfo.defaultImage;

  return (
    <div
      className={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Bannière visuelle haute avec image réelle et contrôles flottants */}
      <div className={styles.bannerWrapper}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={eventImg}
          alt={currentEvent.title}
          className={styles.bannerImg}
        />
        <div className={styles.bannerGradient} />

        {/* Contrôles supérieurs sur l'image : Badge catégorie & Flèches de navigation & Bouton Réglages */}
        <div className={styles.bannerTopControls}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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

            {currentEvent.source && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '3px 7px',
                  borderRadius: 12,
                  backgroundColor: 'rgba(0, 0, 0, 0.55)',
                  color: '#FFFFFF',
                  backdropFilter: 'blur(4px)',
                  letterSpacing: '0.02em',
                }}
              >
                {currentEvent.source}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => setIsPrefModalOpen(true)}
              className={styles.settingsBtn}
              title="Personnaliser les types d'événements et le rayon"
              aria-label="Filtres d'événements"
            >
              <SlidersHorizontal size={14} />
            </button>

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
          {currentEvent.url && (
            <a
              href={currentEvent.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                marginLeft: 'auto',
                color: '#FF5C00',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                cursor: 'pointer',
              }}
              title="Consulter l'événement sur Ticketmaster"
            >
              <span>Détails</span>
              <ExternalLink size={12} />
            </a>
          )}
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

      {/* Modale de réglages des préférences d'événements */}
      <EventPreferencesModal
        isOpen={isPrefModalOpen}
        onClose={() => setIsPrefModalOpen(false)}
        onPreferencesUpdated={() => onPreferencesUpdated && onPreferencesUpdated()}
        restaurantId={restaurantId}
      />
    </div>
  );
}
