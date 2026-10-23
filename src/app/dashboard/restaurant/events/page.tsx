'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Tag,
  Calendar,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import EventCard from '@/components/ui/EventCard/EventCard';
import EventForm from '@/components/ui/EventForm/EventForm';
import { useLanguage } from '@/i18n';
import { RestaurantEvent } from '@/services/restaurant/restaurant-events.data';
import styles from '../restaurant.module.css';

interface NoticeState {
  text: string;
  type: 'success' | 'error';
}

/**
 * Mon Resto — Événements Personnalisés du Restaurant (/dashboard/restaurant/events)
 * Connecté intégralement à la table Signal (source='manual') via /api/events/manual.
 */
export default function RestaurantEventsPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<RestaurantEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RestaurantEvent | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4000);
  };

  /**
   * Synchronise le cache local utilisé par le calendrier Planning (gs_user_events)
   * à partir de la source de vérité serveur.
   */
  const syncPlanningCache = (updated: RestaurantEvent[]) => {
    setEvents(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('getspecial_restaurant_events', JSON.stringify(updated));
        const activePlanningEvents = updated
          .filter((e) => e.isActive)
          .map((e) => ({
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
        localStorage.setItem('gs_user_events', JSON.stringify(activePlanningEvents));
      } catch (err) {
        console.warn('[EVENTS_PLANNING_CACHE_WARN]', err);
      }
    }
  };

  // Chargement réel depuis la base de données
  useEffect(() => {
    let cancelled = false;
    const restaurantId =
      (typeof window !== 'undefined' ? localStorage.getItem('getspecial_restaurant_id') : null) ||
      'current';

    async function loadEvents() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/events/manual?restaurantId=${encodeURIComponent(restaurantId)}`);
        const json = await res.json().catch(() => null);
        if (cancelled) return;

        if (res.ok && json?.success && Array.isArray(json.data)) {
          syncPlanningCache(json.data);
        } else {
          console.error('[MANUAL_EVENTS_LOAD_ERROR]', res.status, json);
          showNotice('Impossible de charger vos événements enregistrés.', 'error');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[MANUAL_EVENTS_NETWORK_ERROR]', err);
          showNotice('Connexion au serveur indisponible.', 'error');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  // 1. Création ou Édition persistée en base
  const handleSaveEvent = async (savedEvent: RestaurantEvent) => {
    const restaurantId =
      (typeof window !== 'undefined' ? localStorage.getItem('getspecial_restaurant_id') : null) ||
      'current';

    try {
      if (editingEvent) {
        const res = await fetch('/api/events/manual', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: savedEvent.id,
            title: savedEvent.title,
            description: savedEvent.description || '',
            date: savedEvent.date,
            time: savedEvent.time || '20:00',
            category: savedEvent.category,
            imageUrl: savedEvent.imageUrl || null,
            isActive: savedEvent.isActive,
          }),
        });
        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.success || !json?.data) {
          if (res.status >= 400 && res.status < 500 && json?.error) {
            showNotice(json.error, 'error');
          } else {
            console.error('[EVENT_PATCH_ERROR]', res.status, json);
            showNotice('Impossible de modifier cet événement pour le moment.', 'error');
          }
          return;
        }

        const updated = events.map((e) => (e.id === savedEvent.id ? json.data : e));
        syncPlanningCache(updated);
        showNotice(`Événement « ${json.data.title} » mis à jour.`, 'success');
      } else {
        const res = await fetch('/api/events/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            title: savedEvent.title,
            description: savedEvent.description || '',
            date: savedEvent.date,
            time: savedEvent.time || '20:00',
            category: savedEvent.category,
            imageUrl: savedEvent.imageUrl,
            isActive: savedEvent.isActive,
            intensity: 1.0,
          }),
        });
        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.success || !json?.data) {
          if (res.status >= 400 && res.status < 500 && json?.error) {
            showNotice(json.error, 'error');
          } else {
            console.error('[EVENT_POST_ERROR]', res.status, json);
            showNotice('Impossible d’ajouter cet événement pour le moment.', 'error');
          }
          return;
        }

        syncPlanningCache([json.data, ...events]);
        showNotice(`Événement « ${json.data.title} » ajouté.`, 'success');
      }

      setIsModalOpen(false);
      setEditingEvent(null);
    } catch (err) {
      console.error('[EVENT_SAVE_NETWORK_ERROR]', err);
      showNotice('Connexion interrompue. Votre événement n’a pas pu être enregistré.', 'error');
    }
  };

  // 2. Ouvrir en mode édition
  const handleEdit = (event: RestaurantEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  // 3. Suppression réelle en base
  const handleDelete = async (id: string) => {
    const target = events.find((e) => e.id === id);
    try {
      const res = await fetch(`/api/events/manual?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        console.error('[EVENT_DELETE_ERROR]', res.status, json);
        showNotice('Impossible de supprimer cet événement pour le moment.', 'error');
        return;
      }

      syncPlanningCache(events.filter((e) => e.id !== id));
      showNotice(`Événement « ${target?.title || ''} » supprimé.`, 'success');
    } catch (err) {
      console.error('[EVENT_DELETE_NETWORK_ERROR]', err);
      showNotice('Impossible de joindre le serveur pour supprimer cet événement.', 'error');
    }
  };

  // 4. Toggle activation / mise en pause réelle en base
  const handleToggleActive = async (id: string) => {
    const target = events.find((e) => e.id === id);
    if (!target) return;
    const nextState = !target.isActive;

    try {
      const res = await fetch('/api/events/manual', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: nextState }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success || !json?.data) {
        console.error('[EVENT_TOGGLE_ERROR]', res.status, json);
        showNotice('Le changement de statut n’a pas pu être enregistré.', 'error');
        return;
      }

      const updated = events.map((e) => (e.id === id ? json.data : e));
      syncPlanningCache(updated);
      showNotice(
        nextState
          ? `Événement « ${target.title} » activé.`
          : `Événement « ${target.title} » mis en pause.`,
        'success'
      );
    } catch (err) {
      console.error('[EVENT_TOGGLE_NETWORK_ERROR]', err);
      showNotice('Connexion interrompue lors du changement de statut.', 'error');
    }
  };

  const activeCount = events.filter((e) => e.isActive).length;

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTexts}>
            <h1 className={styles.pageMainTitle}>Mon Resto</h1>
            <p className={styles.pageMainSubtitle}>
              Vos événements personnalisés créés pour animer le restaurant et booster vos réservations.
            </p>
          </div>
        </header>

        {/* Bannière de retour honnête */}
        {notice && (
          <div
            className={`${styles.savedNotice} ${
              notice.type === 'error' ? styles.errorNotice : ''
            }`}
            role="status"
          >
            {notice.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* ONGLETS INTERNES DE NAVIGATION */}
        <nav className={styles.tabsNav} aria-label={t('restaurant.tabs.label')}>
          <Link href="/dashboard/restaurant" className={styles.tabBtn}>
            <Store size={15} />
            <span>Profil de l’établissement</span>
          </Link>

          <Link href="/dashboard/restaurant/offers" className={styles.tabBtn}>
            <Tag size={15} />
            <span>Plats ou Offres</span>
          </Link>

          <Link
            href="/dashboard/restaurant/events"
            className={`${styles.tabBtn} ${styles.tabActive}`}
          >
            <Calendar size={15} />
            <span>Événements locaux</span>
          </Link>
        </nav>

        <main className={styles.mainContent}>
          <div className={styles.offersHeaderRow}>
            <div>
              <h2 className={styles.tabSectionTitle}>Mes événements personnalisés</h2>
              <p className={styles.tabSectionSubtitle}>
                {events.length === 0
                  ? 'Aucun événement défini pour l’instant.'
                  : `${activeCount} événement${activeCount > 1 ? 's' : ''} actif${
                      activeCount > 1 ? 's' : ''
                    } sur ${events.length} au total.`}
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
                <span>Nouvel événement</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className={styles.emptyOffersBox}>
              <p className={styles.emptyOffersText}>Chargement de vos événements...</p>
            </div>
          ) : events.length === 0 ? (
            <div className={styles.emptyOffersBox}>
              <div className={styles.emptyOffersIcon}>
                <CalendarDays size={24} />
              </div>
              <h3 className={styles.emptyOffersTitle}>Aucun événement programmé</h3>
              <p className={styles.emptyOffersText}>
                Ajoutez les événements propres à votre établissement (concert live, retransmission
                de match, soirée dégustation, brunch à thème). Ils s’afficheront aussi dans votre
                planning !
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

        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
