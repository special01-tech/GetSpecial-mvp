'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Tag,
  Calendar,
  Share2,
  Plus,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import EventCard from '@/components/ui/EventCard/EventCard';
import EventForm from '@/components/ui/EventForm/EventForm';
import {
  RestaurantEvent,
  INITIAL_RESTAURANT_EVENTS,
} from '@/services/restaurant/restaurant-events.data';
import styles from '../restaurant.module.css';

/**
 * Écran 16 Dédié : Mon restaurant - Événements (/dashboard/restaurant/events)
 *
 * Mêmes en-tête et navigation interne :
 * - Profil (/dashboard/restaurant)
 * - Offres (/dashboard/restaurant/offers)
 * - Événements (/dashboard/restaurant/events)
 * - Comptes (/dashboard/restaurant/accounts)
 *
 * Liste des événements :
 * - Concert live acoustique
 * - Match PSG
 * - Fête de la musique
 * - etc.
 *
 * Pour chaque événement :
 * - image / icône
 * - titre
 * - date / heure
 * - catégorie (Concert, Sport, Festival, Jour Férié)
 * - menu actions (Modifier, Activer/Désactiver, Supprimer)
 *
 * Bouton :
 * "+ Ajouter"
 *
 * Gestion complète :
 * - création (EventForm)
 * - édition (EventForm avec valeurs pré-remplies)
 * - suppression
 * - activation / désactivation
 */
export default function RestaurantEventsPage() {
  const [restaurantName, setRestaurantName] = useState('Le Petit Bistrot');
  const [events, setEvents] = useState<RestaurantEvent[]>(INITIAL_RESTAURANT_EVENTS);
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

      const storedEvents = localStorage.getItem('getspecial_restaurant_events');
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      }

      // Synchronisation en direct avec les événements réels détectés par Ticketmaster
      const restaurantId = localStorage.getItem('getspecial_restaurant_id');
      const url = restaurantId ? `/api/signals/today?restaurantId=${restaurantId}` : '/api/signals/today';
      fetch(url)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.event) {
            const live = json.data.event;
            const liveEventItem: RestaurantEvent = {
              id: 'evt_live_ticketmaster_signal',
              title: live.title || 'Concert / Événement en direct',
              date: "Aujourd'hui / Ce soir",
              time: live.time || '20:00',
              category: 'concert',
              imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
              isActive: true,
              description: `Détecté en direct par Ticketmaster à proximité : ${live.venue || ''} (${live.distance || 'Zone locale'}). Utilisé pour les opportunités IA.`,
            };
            setEvents((prev) => [liveEventItem, ...prev.filter((e) => e.id !== 'evt_live_ticketmaster_signal')]);
          }
        })
        .catch(() => {});
    } catch {
      // Ignorer
    }
  }, []);

  const saveEventsList = (updated: RestaurantEvent[], message: string) => {
    setEvents(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_restaurant_events', JSON.stringify(updated));
    }
    setNotice(message);
    setTimeout(() => setNotice(null), 3500);
  };

  // 1. Création ou Édition
  const handleSaveEvent = async (savedEvent: RestaurantEvent) => {
    if (editingEvent) {
      const updated = events.map((e) => (e.id === savedEvent.id ? savedEvent : e));
      saveEventsList(updated, `Événement "${savedEvent.title}" mis à jour.`);
    } else {
      const updated = [savedEvent, ...events];
      saveEventsList(updated, `Événement "${savedEvent.title}" ajouté avec succès.`);

      // Synchronisation immédiate avec le moteur de signaux & opportunités IA
      try {
        const restaurantId = localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1';
        await fetch('/api/events/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            title: savedEvent.title,
            description:
              savedEvent.description && savedEvent.description.length >= 5
                ? savedEvent.description
                : `Événement ${savedEvent.title} organisé à l'établissement.`,
            dateTime: savedEvent.date + ' ' + (savedEvent.time || '20:00'),
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
    saveEventsList(updated, `Événement "${target?.title || ''}" supprimé.`);
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
        ? `Événement "${target.title}" activé pour l’IA.`
        : `Événement "${target?.title}" mis en veille.`
    );
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header Restaurant */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.storeAvatar}>
              <Store size={22} className={styles.storeIcon} />
            </div>
            <div>
              <h1 className={styles.headerTitle}>{restaurantName}</h1>
              <p className={styles.headerSubtitle}>Gestion de l&apos;établissement & IA</p>
            </div>
          </div>
        </header>

        {/* Notice temporaire de confirmation */}
        {notice && (
          <div className={styles.savedNotice}>
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
        )}

        {/* Navigation Interne (Tabs) */}
        <nav className={styles.tabsNav} aria-label="Sections du restaurant">
          <Link href="/dashboard/restaurant" className={styles.tabBtn}>
            <Store size={14} />
            <span>Profil</span>
          </Link>

          <Link href="/dashboard/restaurant/offers" className={styles.tabBtn}>
            <Tag size={14} />
            <span>Offres</span>
          </Link>

          <Link
            href="/dashboard/restaurant/events"
            className={`${styles.tabBtn} ${styles.tabActive}`}
          >
            <Calendar size={14} />
            <span>Événements</span>
          </Link>

          <Link href="/dashboard/restaurant/accounts" className={styles.tabBtn}>
            <Share2 size={14} />
            <span>Comptes</span>
          </Link>
        </nav>

        {/* CONTENU ONGLET ÉVÉNEMENTS (ÉCRAN 16) */}
        <main className={styles.mainContent}>
          {/* Header d'actions des événements */}
          <div className={styles.offersHeaderRow}>
            <div>
              <h2 className={styles.tabSectionTitle}>Événements du quartier</h2>
              <p className={styles.tabSectionSubtitle}>
                {events.filter((e) => e.isActive).length} actif{events.filter((e) => e.isActive).length > 1 ? 's' : ''} sur {events.length} configuré{events.length > 1 ? 's' : ''}
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
                  backgroundColor: '#FFF7ED',
                  border: '1px solid #FFEDD5',
                  color: '#EA580C',
                  textDecoration: 'none',
                }}
              >
                <Sparkles size={14} strokeWidth={1.75} />
                <span>Studio Affiche & Légende</span>
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
                <span>+ Ajouter</span>
              </button>
            </div>
          </div>

          {/* Liste des événements */}
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

        {/* Spacer pour Bottom Navigation */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
