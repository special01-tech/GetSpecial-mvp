'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Trophy,
  PartyPopper,
  Calendar,
  Sparkles,
  MoreVertical,
  Edit2,
  Trash2,
  Power,
  Clock,
} from 'lucide-react';
import { RestaurantEvent, EventCategory } from '@/services/restaurant/restaurant-events.data';
import styles from './EventCard.module.css';

interface EventCardProps {
  event: RestaurantEvent;
  onEdit: (event: RestaurantEvent) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export default function EventCard({
  event,
  onEdit,
  onDelete,
  onToggleActive,
}: EventCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryIcon = (cat: EventCategory) => {
    switch (cat) {
      case 'concert':
        return <Music size={18} className={styles.iconConcert} />;
      case 'sport':
        return <Trophy size={18} className={styles.iconSport} />;
      case 'festival':
        return <PartyPopper size={18} className={styles.iconFestival} />;
      case 'special_day':
        return <Calendar size={18} className={styles.iconSpecialDay} />;
      default:
        return <Sparkles size={18} className={styles.iconDefault} />;
    }
  };

  const getCategoryLabel = (cat: EventCategory) => {
    switch (cat) {
      case 'concert':
        return 'Concert';
      case 'sport':
        return 'Sport / Match';
      case 'festival':
        return 'Fête / Festival';
      case 'special_day':
        return 'Jour Férié';
      default:
        return 'Culture';
    }
  };

  return (
    <article
      className={`${styles.card} ${!event.isActive ? styles.cardInactive : ''}`}
    >
      {/* Colonne visuelle / icône */}
      <div className={styles.visualCol}>
        {event.imageUrl ? (
          <div className={styles.imageBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.imageUrl}
              alt={event.title}
              className={styles.eventImage}
            />
            <div className={styles.iconFloatingBadge}>
              {getCategoryIcon(event.category)}
            </div>
          </div>
        ) : (
          <div className={styles.iconBoxOnly}>
            {getCategoryIcon(event.category)}
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className={styles.detailsCol}>
        <div className={styles.topRow}>
          <span className={styles.categoryBadge}>
            {getCategoryLabel(event.category)}
          </span>

          {/* Toggle statut actif / inactif */}
          <button
            type="button"
            onClick={() => onToggleActive(event.id)}
            className={`${styles.activeTogglePill} ${
              event.isActive ? styles.pillActive : styles.pillInactive
            }`}
            title={event.isActive ? 'Désactiver cet événement' : 'Activer cet événement'}
          >
            <span className={styles.statusDot} />
            <span>{event.isActive ? 'Actif' : 'Désactivé'}</span>
          </button>
        </div>

        <h3 className={styles.title}>{event.title}</h3>

        <div className={styles.dateRow}>
          <Calendar size={12} className={styles.calendarIcon} />
          <span className={styles.dateText}>{event.date}</span>
          {event.time && (
            <>
              <span className={styles.dotSeparator}>•</span>
              <Clock size={12} className={styles.clockIcon} />
              <span className={styles.timeText}>{event.time}</span>
            </>
          )}
        </div>

        {event.description && (
          <p className={styles.description}>{event.description}</p>
        )}
      </div>

      {/* Menu Actions (3 points) */}
      <div className={styles.actionMenuCol} ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={styles.menuTriggerBtn}
          aria-label="Actions de l'événement"
        >
          <MoreVertical size={16} />
        </button>

        {isMenuOpen && (
          <div className={styles.dropdownMenu}>
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onEdit(event);
              }}
              className={styles.dropdownItem}
            >
              <Edit2 size={13} />
              <span>Modifier</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onToggleActive(event.id);
              }}
              className={styles.dropdownItem}
            >
              <Power size={13} />
              <span>{event.isActive ? 'Désactiver' : 'Activer'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onDelete(event.id);
              }}
              className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
            >
              <Trash2 size={13} />
              <span>Supprimer</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
