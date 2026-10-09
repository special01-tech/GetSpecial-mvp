'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Tag,
  Calendar,
  Plus,
  CheckCircle2,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import EventCard from '@/components/ui/EventCard/EventCard';
import EventForm from '@/components/ui/EventForm/EventForm';
import { useLanguage } from '@/i18n';
import { RestaurantEvent } from '@/services/restaurant/restaurant-events.data';
import styles from '../restaurant.module.css';

/**
 * Mon Resto — Événements Personnalisés du Restaurant (/dashboard/restaurant/events)
 *
 * Règles :
 * - Affiche STRICTEMENT et UNIQUEMENT les événements créés / définis par le restaurateur lui-même.
 * - Aucun signal externe ni événement national injecté automatiquement ici.
 * - Gestion CRUD complète (Création, Consultation, Modification, Suppression, Activation/Pause).
 * - Synchronisation avec le planning (gs_user_events).
 */

const DEFAULT_USER_EVENTS: RestaurantEvent[] = [
  {
    id: 'uevt_tasting_9',
    title: 'Soirée Dégustation Vins & Tapas',
    date: '2026-10-09',
    time: '19:30',
    category: 'culture',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    description: 'Menu 4 plats avec accords mets et vins bios du sommelier.',
  },
  {
    id: 'uevt_match_17',
    title: 'Diffusion Match sur Écran Géant',
    date: '2026-10-17',
    time: '20:45',
    category: 'sport',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    description: 'Soirée supporters en terrasse avec formules bières pression et wings.',
  },
];

export default function RestaurantEventsPage() {
  const { t } = useLanguage();
  const [restaurantName, setRestaurantName] = useState('Mon Restaurant');
  const [events, setEvents] = useState<RestaurantEvent[]>(DEFAULT_USER_EVENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RestaurantEvent | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('getspecial_selected_restaurant');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setRestaurantName(parsed.name);
      }

      // Priorité 1 : Événements stockés dans getspecial_restaurant_events
      const storedEvents = localStorage.getItem('getspecial_restaurant_events');
      if (storedEvents) {
        const parsed = JSON.parse(storedEvents);
        if (Array.isArray(parsed)) {
          setEvents(parsed);
          return;
        }
      }

      // Priorité 2 : Synchronisation depuis gs_user_events (Planning)
      const storedPlanningEvents = localStorage.getItem('gs_user_events');
      if (storedPlanningEvents) {
        const parsedPlanning = JSON.parse(storedPlanningEvents);
        if (Array.isArray(parsedPlanning) && parsedPlanning.length > 0) {
          const converted: RestaurantEvent[] = parsedPlanning.map((pe: any) => ({
            id: pe.id,
            title: pe.title,
            date: pe.dateStr || '2026-10-15',
            time: pe.timeStr || '19:30',
            category:
              pe.category === 'sport'
                ? 'sport'
                : pe.category === 'concert'
                ? 'concert'
                : pe.category === 'festival'
                ? 'festival'
                : 'culture',
            imageUrl:
              pe.category === 'sport'
                ? 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'
                : 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
            isActive: true,
            description: pe.description || '',
          }));
          setEvents(converted);
          return;
        }
      }
    } catch {
      // Ignorer
    }
  }, []);

  const saveEventsList = (updated: RestaurantEvent[], message: string) => {
    setEvents(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_restaurant_events', JSON.stringify(updated));

      // Synchronisation bi-directionnelle avec le planning (gs_user_events)
      try {
        const planningFormat = updated.map((e) => ({
          id: e.id,
          title: e.title,
          dateStr: e.date,
          timeStr: e.time,
          category:
            e.category === 'sport'
              ? 'sport'
              : e.category === 'concert'
              ? 'concert'
              : 'theme',
          description: e.description,
          createdAt: Date.now(),
        }));
        localStorage.setItem('gs_user_events', JSON.stringify(planningFormat));
      } catch (err) {
        console.warn('Erreur sync planning storage:', err);
      }
    }
    setNotice(message);
    setTimeout(() => setNotice(null), 3500);
  };

  // 1. Création ou Édition (CRUD)
  const handleSaveEvent = async (savedEvent: RestaurantEvent) => {
    if (editingEvent) {
      const updated = events.map((e) => (e.id === savedEvent.id ? savedEvent : e));
      saveEventsList(updated, `Événement « ${savedEvent.title} » mis à jour.`);
    } else {
      const updated = [savedEvent, ...events];
      saveEventsList(updated, `Événement « ${savedEvent.title} » ajouté.`);

      // Synchronisation API backend
      try {
        const restaurantId =
          localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1';
        await fetch('/api/events/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            title: savedEvent.title,
            description:
              savedEvent.description && savedEvent.description.length >= 5
                ? savedEvent.description
                : `Événement spécial : ${savedEvent.title}`,
            dateTime: `${savedEvent.date} ${savedEvent.time || '20:00'}`,
            intensity: 1.0,
          }),
        });
      } catch (err) {
        console.warn('[MANUAL_EVENT_API_ERROR]', err);
      }
    }
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  // 2. Ouvrir en mode édition
  const handleEdit = (event: RestaurantEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  // 3. Suppression
  const handleDelete = (id: string) => {
    const target = events.find((e) => e.id === id);
    const updated = events.filter((e) => e.id !== id);
    saveEventsList(updated, `Événement « ${target?.title || ''} » supprimé.`);
  };

  // 4. Toggle activation / désactivation
  const handleToggleActive = (id: string) => {
    const updated = events.map((e) =>
      e.id === id ? { ...e, isActive: !e.isActive } : e
    );
    const target = updated.find((e) => e.id === id);
    saveEventsList(
      updated,
      target?.isActive
        ? `Événement « ${target.title} » activé.`
        : `Événement « ${target?.title || ''} » mis en pause.`
    );
  };

  const activeCount = events.filter((e) => e.isActive).length;

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* ========================================================= */}
        {/* EN-TÊTE DE LA PAGE                                        */}
        {/* ========================================================= */}
        <header className={styles.header}>
          <div className={styles.headerTexts}>
            <h1 className={styles.pageMainTitle}>Mon Resto</h1>
            <p className={styles.pageMainSubtitle}>
              Vos événements personnalisés créés pour animer le restaurant et booster vos réservations.
            </p>
          </div>
        </header>

        {/* Notice temporaire de confirmation */}
        {notice && (
          <div className={styles.savedNotice}>
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLETS INTERNES DE NAVIGATION                           */}
        {/* ========================================================= */}
        <nav className={styles.tabsNav} aria-label={t('restaurant.tabs.label')}>
          <Link href="/dashboard/restaurant" className={styles.tabBtn}>
            <Store size={15} />
            <span>Profil de l’établissement</span>
          </Link>

          <Link href="/dashboard/restaurant/offers" className={styles.tabBtn}>
            <Tag size={15} />
            <span>Offres & Formules</span>
          </Link>

          <Link
            href="/dashboard/restaurant/events"
            className={`${styles.tabBtn} ${styles.tabActive}`}
          >
            <Calendar size={15} />
            <span>Événements locaux</span>
          </Link>
        </nav>

        {/* ========================================================= */}
        {/* CONTENU ONGLET ÉVÉNEMENTS                                 */}
        {/* ========================================================= */}
        <main className={styles.mainContent}>
          {/* Header d'actions des événements */}
          <div className={styles.offersHeaderRow}>
            <div>
              <h2 className={styles.tabSectionTitle}>Mes événements personnalisés</h2>
              <p className={styles.tabSectionSubtitle}>
                {events.length === 0
                  ? 'Aucun événement défini pour l’instant.'
                  : `${activeCount} événement${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''} sur ${events.length} au total.`}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/dashboard/create?type=event"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: '#FFF3EC',
                  border: '1px solid #FFE0CC',
                  color: '#E04F00',
                  textDecoration: 'none',
                }}
              >
                <Sparkles size={14} strokeWidth={1.75} />
                <span>Créer un post au Studio</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setEditingEvent(null);
                  setIsModalOpen(true);
                }}
                className={styles.addOfferBtn}
              >
                <Plus size={15} />
                <span>+ Nouvel événement</span>
              </button>
            </div>
          </div>

          {/* Liste des événements ou État vide */}
          {events.length === 0 ? (
            <div className={styles.emptyOffersBox}>
              <div className={styles.emptyOffersIcon}>
                <CalendarDays size={24} />
              </div>
              <h3 className={styles.emptyOffersTitle}>Aucun événement programmé</h3>
              <p className={styles.emptyOffersText}>
                Ajoutez les événements propres à votre établissement (concert live, retransmission de match, soirée dégustation, brunch à thème). Ils s’afficheront aussi dans votre planning !
              </p>
              <div className={styles.emptyOffersActions}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setIsModalOpen(true);
                  }}
                  className={styles.addOfferBtn}
                >
                  <Plus size={14} />
                  <span>Créer mon premier événement</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.offersList}>
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          )}
        </main>

        {/* Modale de Création / Édition (EventForm) */}
        {isModalOpen && (
          <EventForm
            initialEvent={editingEvent}
            onSave={handleSaveEvent}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingEvent(null);
            }}
          />
        )}

        {/* Spacer pour Bottom Navigation mobile */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
