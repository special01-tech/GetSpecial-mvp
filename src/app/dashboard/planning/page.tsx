'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Plus,
  CalendarDays,
  CalendarPlus,
  Pencil,
  Trash2,
  Clock,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import styles from './planning.module.css';

// -----------------------------------------------------------------------------
// Interfaces
// -----------------------------------------------------------------------------
export interface UserEvent {
  id: string;
  title: string;
  dateStr: string; // "YYYY-MM-DD"
  timeStr?: string; // "19:30"
  category: 'tasting' | 'concert' | 'sport' | 'theme' | 'promo' | 'other';
  description?: string;
  createdAt: number;
}

export interface NationalEvent {
  id: string;
  title: string;
  dateStr: string; // "YYYY-MM-DD"
  category: string;
  dateBadge: string;
  description?: string;
}

export interface ScheduledPost {
  id: string;
  title: string;
  dateStr: string; // "YYYY-MM-DD"
  timeStr: string; // "18:30"
  imageUrl?: string;
  platform: string;
  status: 'scheduled' | 'published';
}

const CATEGORY_OPTIONS: { id: UserEvent['category']; label: string; icon: string }[] = [
  { id: 'tasting', label: 'Dégustation', icon: '🍷' },
  { id: 'concert', label: 'Concert & Live', icon: '🎵' },
  { id: 'sport', label: 'Soirée Match', icon: '⚽' },
  { id: 'theme', label: 'Soirée à thème', icon: '🎭' },
  { id: 'promo', label: 'Promotion', icon: '🏷️' },
  { id: 'other', label: 'Autre événement', icon: '📌' },
];

export default function PlanningPage() {
  const router = useRouter();
  const { t } = useLanguage();

  // Bannière d'installation PWA
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  // Date actuelle du calendrier (Initialisé sur octobre 2026 pour correspondre fidèlement à la maquette)
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 9, 9));
  const [selectedDay, setSelectedDay] = useState<number | null>(9);

  // Localisation du restaurant pour la carte d'événements à venir
  const [restaurantCity] = useState('Lomé, Togo');

  // ---------------------------------------------------------------------------
  // Événements Nationaux / Marketing fixes (Violet)
  // ---------------------------------------------------------------------------
  const nationalEvents: NationalEvent[] = useMemo(
    () => [
      {
        id: 'evt_grand_pere',
        title: 'Fête des Grands-Pères',
        category: 'ÉVÉNEMENT NATIONAL',
        dateBadge: '4 oct.',
        dateStr: '2026-10-04',
      },
      {
        id: 'evt_food_day',
        title: "Journée Mondiale de l'Alimentation",
        category: 'TEMPS FORT FOOD',
        dateBadge: '16 oct.',
        dateStr: '2026-10-16',
      },
      {
        id: 'evt_halloween',
        title: 'Halloween & Soirée Spéciale',
        category: 'ÉVÉNEMENT MARKETING',
        dateBadge: '31 oct.',
        dateStr: '2026-10-31',
      },
      {
        id: 'evt_all_saints',
        title: "All Saints' Day (Toussaint)",
        category: t('content.planning.upcomingEvents.holidayBadge') || 'JOUR FÉRIÉ',
        dateBadge: '1 nov.',
        dateStr: '2026-11-01',
      },
      {
        id: 'evt_armistice',
        title: 'Armistice',
        category: 'JOUR FÉRIÉ',
        dateBadge: '11 nov.',
        dateStr: '2026-11-11',
      },
    ],
    [t]
  );

  // ---------------------------------------------------------------------------
  // Événements Personnalisés du Restaurant (Orange - Persisté & CRUD)
  // ---------------------------------------------------------------------------
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gs_user_events');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setUserEvents(parsed);
          return;
        }
      }
      // Données initiales par défaut
      const initialUserEvents: UserEvent[] = [
        {
          id: 'uevt_tasting_9',
          title: 'Soirée Dégustation Vins & Tapas',
          dateStr: '2026-10-09',
          timeStr: '19:30',
          category: 'tasting',
          description: 'Menu 4 plats avec accords mets et vins bios du sommelier.',
          createdAt: Date.now(),
        },
        {
          id: 'uevt_concert_24',
          title: 'Concert Acoustique Live',
          dateStr: '2026-10-24',
          timeStr: '20:00',
          category: 'concert',
          description: 'Duo acoustique guitare et voix en terrasse lounge.',
          createdAt: Date.now() + 1000,
        },
      ];
      setUserEvents(initialUserEvents);
      localStorage.setItem('gs_user_events', JSON.stringify(initialUserEvents));
    } catch {
      // Ignorer
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Publications Programmées (Vert - Persisté)
  // ---------------------------------------------------------------------------
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gs_scheduled_posts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setScheduledPosts(parsed);
          return;
        }
      }
      const initialPosts: ScheduledPost[] = [
        {
          id: 'post_1',
          title: 'Cocktail Signature du Vendredi',
          dateStr: '2026-10-09',
          timeStr: '18:30',
          platform: 'Instagram',
          status: 'scheduled',
        },
        {
          id: 'post_2',
          title: 'Menu Découverte du Chef',
          dateStr: '2026-10-15',
          timeStr: '12:00',
          platform: 'Facebook',
          status: 'scheduled',
        },
        {
          id: 'post_3',
          title: "Menu d'Halloween Frissonnant",
          dateStr: '2026-10-31',
          timeStr: '17:00',
          platform: 'Instagram',
          status: 'scheduled',
        },
      ];
      setScheduledPosts(initialPosts);
      localStorage.setItem('gs_scheduled_posts', JSON.stringify(initialPosts));
    } catch {
      // Ignorer
    }
  }, []);

  const saveUserEventsToStorage = (events: UserEvent[]) => {
    setUserEvents(events);
    try {
      localStorage.setItem('gs_user_events', JSON.stringify(events));
    } catch {
      // Ignorer
    }
  };

  const saveScheduledPostsToStorage = (posts: ScheduledPost[]) => {
    setScheduledPosts(posts);
    try {
      localStorage.setItem('gs_scheduled_posts', JSON.stringify(posts));
    } catch {
      // Ignorer
    }
  };

  // ---------------------------------------------------------------------------
  // Navigation & Mois
  // ---------------------------------------------------------------------------
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthName = useMemo(() => {
    return currentDate.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
  }, [currentDate]);

  const weekDayLabels = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(null);
  };

  // Date sélectionnée sous forme "YYYY-MM-DD"
  const selectedDateStr = useMemo(() => {
    if (!selectedDay) return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-09`;
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  }, [currentYear, currentMonth, selectedDay]);

  const selectedDateFormatted = useMemo(() => {
    if (!selectedDay) return '';
    const dateObj = new Date(currentYear, currentMonth, selectedDay);
    return dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [currentYear, currentMonth, selectedDay]);

  // ---------------------------------------------------------------------------
  // Cellules du calendrier avec les 3 couleurs
  // ---------------------------------------------------------------------------
  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      key: string;
      dayNumber: number;
      cellDateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      hasNational: boolean;
      hasUserEvent: boolean;
      hasScheduledPost: boolean;
    }[] = [];

    // Jours du mois précédent
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      cells.push({
        key: `prev-${dayNum}`,
        dayNumber: dayNum,
        cellDateStr: '',
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        hasNational: false,
        hasUserEvent: false,
        hasScheduledPost: false,
      });
    }

    // Jours du mois courant
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const isToday = currentYear === 2026 && currentMonth === 9 && day === 9;
      const isSelected = selectedDay === day;
      const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const hasNational = nationalEvents.some((e) => e.dateStr === cellDateStr);
      const hasUserEvent = userEvents.some((e) => e.dateStr === cellDateStr);
      const hasScheduledPost = scheduledPosts.some((p) => p.dateStr === cellDateStr);

      cells.push({
        key: `curr-${day}`,
        dayNumber: day,
        cellDateStr,
        isCurrentMonth: true,
        isToday,
        isSelected,
        hasNational,
        hasUserEvent,
        hasScheduledPost,
      });
    }

    // Jours du mois suivant
    const remainingCells = 42 - cells.length;
    for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
      cells.push({
        key: `next-${nextDay}`,
        dayNumber: nextDay,
        cellDateStr: '',
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        hasNational: false,
        hasUserEvent: false,
        hasScheduledPost: false,
      });
    }

    return cells;
  }, [currentYear, currentMonth, selectedDay, nationalEvents, userEvents, scheduledPosts]);

  // Événements pour le jour sélectionné
  const dayEvents = useMemo(() => {
    if (!selectedDateStr) {
      return { nationalEvents: [], userEvents: [], scheduledPosts: [] };
    }
    return {
      nationalEvents: nationalEvents.filter((e) => e.dateStr === selectedDateStr),
      userEvents: userEvents.filter((e) => e.dateStr === selectedDateStr),
      scheduledPosts: scheduledPosts.filter((p) => p.dateStr === selectedDateStr),
    };
  }, [selectedDateStr, nationalEvents, userEvents, scheduledPosts]);

  const totalDayEventsCount =
    dayEvents.nationalEvents.length +
    dayEvents.userEvents.length +
    dayEvents.scheduledPosts.length;

  // ---------------------------------------------------------------------------
  // Gestion de la Modale : Liste des événements du jour & CRUD
  // ---------------------------------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'day_overview' | 'create_event' | 'edit_event'>('day_overview');

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDateStr, setFormDateStr] = useState('');
  const [formTimeStr, setFormTimeStr] = useState('19:30');
  const [formCategory, setFormCategory] = useState<UserEvent['category']>('tasting');
  const [formDescription, setFormDescription] = useState('');

  // 1. Clic sur une date du calendrier -> Ouvre la modal des événements du jour avec possibilité de CRUD
  const handleDayClick = (dayNumber: number, dateStr: string) => {
    setSelectedDay(dayNumber);
    setModalMode('day_overview');
    setIsModalOpen(true);
  };

  // 2. Clic sur le CTA "Ajouter un événement" -> Ouvre directement le formulaire de création
  const handleOpenCreateModal = (defaultDate?: string) => {
    setEditingEventId(null);
    setFormTitle('');
    setFormDateStr(defaultDate || selectedDateStr || '2026-10-09');
    setFormTimeStr('19:30');
    setFormCategory('tasting');
    setFormDescription('');
    setModalMode('create_event');
    setIsModalOpen(true);
  };

  // 3. Clic sur Modifier un événement perso (Update)
  const handleOpenEditModal = (event: UserEvent) => {
    setEditingEventId(event.id);
    setFormTitle(event.title);
    setFormDateStr(event.dateStr);
    setFormTimeStr(event.timeStr || '19:30');
    setFormCategory(event.category);
    setFormDescription(event.description || '');
    setModalMode('edit_event');
    setIsModalOpen(true);
  };

  // 4. Enregistrement (Création / Modification)
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingEventId) {
      // Modification (Update)
      const updated = userEvents.map((evt) =>
        evt.id === editingEventId
          ? {
              ...evt,
              title: formTitle.trim(),
              dateStr: formDateStr,
              timeStr: formTimeStr,
              category: formCategory,
              description: formDescription.trim(),
            }
          : evt
      );
      saveUserEventsToStorage(updated);
    } else {
      // Création (Create)
      const newEvent: UserEvent = {
        id: `uevt_${Date.now()}`,
        title: formTitle.trim(),
        dateStr: formDateStr,
        timeStr: formTimeStr,
        category: formCategory,
        description: formDescription.trim(),
        createdAt: Date.now(),
      };
      saveUserEventsToStorage([newEvent, ...userEvents]);
    }

    // Synchronisation de la date sélectionnée
    const [y, m, d] = formDateStr.split('-').map(Number);
    if (y === currentYear && m - 1 === currentMonth) {
      setSelectedDay(d);
    }

    // Retour à la liste du jour dans la modale
    setModalMode('day_overview');
  };

  // 5. Suppression d'un événement utilisateur (Delete)
  const handleDeleteUserEvent = (id: string) => {
    const updated = userEvents.filter((e) => e.id !== id);
    saveUserEventsToStorage(updated);
    if (editingEventId === id) {
      setModalMode('day_overview');
    }
  };

  // 6. Suppression d'une publication programmée
  const handleDeleteScheduledPost = (id: string) => {
    const updated = scheduledPosts.filter((p) => p.id !== id);
    saveScheduledPostsToStorage(updated);
  };

  const getCategoryLabel = (cat: UserEvent['category']) => {
    const found = CATEGORY_OPTIONS.find((c) => c.id === cat);
    return found ? `${found.icon} ${found.label}` : 'Événement';
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* ========================================================= */}
        {/* BANNIÈRE D'INSTALLATION PWA (EN HAUT)                    */}
        {/* ========================================================= */}
        {showInstallBanner && (
          <div className={styles.installBanner} role="banner">
            <div className={styles.bannerLeft}>
              <div className={styles.bannerIconBadge}>
                <Download size={18} strokeWidth={2.3} />
              </div>
              <div className={styles.bannerTexts}>
                <h4 className={styles.bannerTitle}>{t('content.planning.banner.title')}</h4>
                <p className={styles.bannerSubtitle}>{t('content.planning.banner.subtitle')}</p>
              </div>
            </div>
            <div className={styles.bannerRight}>
              <button
                type="button"
                className={styles.bannerInstallBtn}
                onClick={() => alert('GetSpecial est prêt pour votre écran d’accueil.')}
              >
                {t('content.planning.banner.installBtn')}
              </button>
              <button
                type="button"
                className={styles.bannerCloseBtn}
                onClick={() => setShowInstallBanner(false)}
                aria-label="Fermer la bannière"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* EN-TÊTE : Titre "Planifié" + Bouton "+ Ajouter un événement"*/}
        {/* ========================================================= */}
        <header className={styles.header}>
          <div className={styles.headerTexts}>
            <h1 className={styles.pageTitle}>{t('content.planning.title')}</h1>
            <p className={styles.pageSubtitle}>{t('content.planning.subtitle')}</p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className={styles.newBtn}
            title="Ajouter un événement"
          >
            <Plus size={18} strokeWidth={2.4} />
            <span>Ajouter un événement</span>
          </button>
        </header>

        {/* ========================================================= */}
        {/* GRILLE 2 COLONNES (CALENDRIER À GAUCHE, 2 CARTES À DROITE)*/}
        {/* ========================================================= */}
        <div className={styles.planningGrid}>
          {/* ------------------------------------------------------- */}
          {/* COLONNE GAUCHE : CARTE DU CALENDRIER                    */}
          {/* ------------------------------------------------------- */}
          <section className={styles.calendarCard} aria-label="Calendrier des événements">
            {/* Header du calendrier : Mois et flèches de navigation */}
            <div className={styles.calendarHeader}>
              <div className={styles.monthTitleGroup}>
                <CalendarIcon size={19} className={styles.calendarHeaderIcon} />
                <h2 className={styles.monthTitle}>{monthName}</h2>
              </div>

              <div className={styles.calendarNavBtns}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className={styles.navBtn}
                  aria-label="Mois précédent"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className={styles.navBtn}
                  aria-label="Mois suivant"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Jours de la semaine : DIM LUN MAR MER JEU VEN SAM */}
            <div className={styles.weekHeaderGrid} role="row">
              {weekDayLabels.map((dayLabel) => (
                <div key={dayLabel} className={styles.weekDayLabel} role="columnheader">
                  {dayLabel}
                </div>
              ))}
            </div>

            {/* Grille des 42 cellules du mois avec Code Couleur */}
            <div className={styles.daysGrid} role="grid">
              {calendarCells.map((cell) => {
                // Jours hors du mois (capsules grises douces)
                if (!cell.isCurrentMonth) {
                  return (
                    <div key={cell.key} className={styles.outsideDayCell} aria-disabled="true">
                      <span>{cell.dayNumber}</span>
                    </div>
                  );
                }

                // Jours du mois courant
                const cellClasses = [
                  styles.dayCell,
                  cell.isToday ? styles.todayCell : '',
                  cell.isSelected ? styles.selectedCell : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <div
                    key={cell.key}
                    className={cellClasses}
                    onClick={() => handleDayClick(cell.dayNumber, cell.cellDateStr)}
                    role="gridcell"
                    tabIndex={0}
                    title="Cliquer pour voir et gérer les événements du jour"
                  >
                    <div className={styles.dayNumberRow}>
                      <span className={styles.dayNumber}>{cell.dayNumber}</span>
                      {cell.isToday && (
                        <span className={styles.todayBadge}>
                          {t('content.planning.calendar.todayBadge')}
                        </span>
                      )}
                    </div>

                    {/* Pastilles de couleur pour chaque type d'événement */}
                    <div className={styles.eventIndicatorsRow}>
                      {cell.hasNational && (
                        <span
                          className={styles.dotNational}
                          title="Événement national / Férié (Violet)"
                        />
                      )}
                      {cell.hasUserEvent && (
                        <span
                          className={styles.dotUser}
                          title="Événement du restaurant (Orange)"
                        />
                      )}
                      {cell.hasScheduledPost && (
                        <span
                          className={styles.dotPost}
                          title="Publication programmée (Vert)"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* En bas du calendrier : Strictement le Code Couleur */}
            <div className={styles.calendarFooterBox}>
              <div className={styles.colorLegendBar}>
                <div className={styles.colorLegendItem}>
                  <span className={styles.legendDotNational} />
                  <span>Événements nationaux</span>
                </div>
                <div className={styles.colorLegendItem}>
                  <span className={styles.legendDotUser} />
                  <span>Événements du restaurant</span>
                </div>
                <div className={styles.colorLegendItem}>
                  <span className={styles.legendDotPost} />
                  <span>Publications programmées</span>
                </div>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------- */}
          {/* COLONNE DROITE : 2 CARTES                               */}
          {/* ------------------------------------------------------- */}
          <aside className={styles.sideCardsColumn}>
            {/* CARTE 1 : ÉVÉNEMENTS À VENIR (NATIONAUX & MARKETING) */}
            <div className={styles.eventsCard}>
              <h3 className={styles.cardHeaderTitle}>
                <CalendarDays size={14} />
                <span>{t('content.planning.upcomingEvents.title')}</span>
              </h3>
              <p className={styles.cardHeaderSub}>
                {t('content.planning.upcomingEvents.subtitle', { city: restaurantCity })}
              </p>

              {nationalEvents.slice(0, 3).map((evt) => (
                <div key={evt.id} className={styles.eventListItem}>
                  <div className={styles.eventItemInfo}>
                    <h4 className={styles.eventItemTitle}>{evt.title}</h4>
                    <span className={styles.eventItemCategory}>{evt.category}</span>
                  </div>
                  <span className={styles.eventItemBadge}>{evt.dateBadge}</span>
                </div>
              ))}
            </div>

            {/* CARTE 2 : STRICTEMENT LE CTA D'AJOUT D'ÉVÉNEMENT */}
            <div className={styles.eventsActionCard}>
              <div className={styles.actionCardHeaderRow}>
                <span className={styles.actionCardTag}>Événements du restaurant</span>
                <span className={styles.eventCountBadge}>{userEvents.length} perso(s)</span>
              </div>

              <h3 className={styles.actionCardTitle}>Planifier un événement</h3>
              <p className={styles.actionCardDesc}>
                Soirée match, concert, dégustation ou promotion : planifiez vos événements et synchronisez votre communication.
              </p>

              {/* Bouton CTA Principal */}
              <button
                type="button"
                className={styles.addEventMainBtn}
                onClick={() => handleOpenCreateModal(selectedDateStr)}
              >
                <CalendarPlus size={18} strokeWidth={2.2} />
                <span>Ajouter un événement</span>
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODALE D'ÉVÉNEMENTS DU JOUR & CRUD COMPLET                */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`${styles.modalCard} ${
              modalMode === 'day_overview' ? styles.modalCardLarge : ''
            }`}
          >
            {/* En-tête de la modale */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                {modalMode !== 'day_overview' && (
                  <button
                    type="button"
                    className={styles.modalBackBtn}
                    onClick={() => setModalMode('day_overview')}
                    aria-label="Retour aux événements du jour"
                    title="Retour"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div className={styles.modalTitleGroup}>
                  <h3 className={styles.modalTitle}>
                    {modalMode === 'day_overview' && `Événements du ${selectedDateFormatted || `${selectedDay} ${monthName}`}`}
                    {modalMode === 'create_event' && 'Ajouter un événement'}
                    {modalMode === 'edit_event' && 'Modifier l’événement'}
                  </h3>
                  <p className={styles.modalSubtitle}>
                    {modalMode === 'day_overview' &&
                      `${totalDayEventsCount} événement(s) programmé(s) pour cette date`}
                    {modalMode !== 'day_overview' &&
                      'Organisez vos animations et synchronisez vos réseaux sociaux.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsModalOpen(false)}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* CORPS DE LA MODALE — MODE 1 : VUE DU JOUR & LISTE CRUD */}
            {modalMode === 'day_overview' && (
              <div className={styles.modalBody}>
                {/* Bouton CTA pour créer un événement ce jour */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                  <button
                    type="button"
                    className={styles.quickAddDayBtn}
                    onClick={() => handleOpenCreateModal(selectedDateStr)}
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    <Plus size={14} strokeWidth={2.4} />
                    <span>Ajouter un événement pour ce jour</span>
                  </button>
                </div>

                {totalDayEventsCount === 0 ? (
                  <div className={styles.emptyDayBox}>
                    <p className={styles.emptyDayText}>
                      Aucun événement ni publication pour cette date.
                    </p>
                    <button
                      type="button"
                      className={styles.quickAddDayBtn}
                      onClick={() => handleOpenCreateModal(selectedDateStr)}
                    >
                      <Plus size={13} strokeWidth={2.4} />
                      <span>Ajouter un premier événement</span>
                    </button>
                  </div>
                ) : (
                  <div className={styles.dayEventsList}>
                    {/* 1. Événements personnalisés créés par le user (CRUD complet) */}
                    {dayEvents.userEvents.map((evt) => (
                      <div key={evt.id} className={`${styles.dayEventCard} ${styles.dayEventUser}`}>
                        <div className={styles.dayEventTopRow}>
                          <div className={styles.dayEventBadgeGroup}>
                            <span className={styles.badgeUser}>{getCategoryLabel(evt.category)}</span>
                            {evt.timeStr && (
                              <span className={styles.dayEventTime}>
                                <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                                {evt.timeStr}
                              </span>
                            )}
                          </div>

                          {/* Boutons d'action CRUD (Modifier / Supprimer) */}
                          <div className={styles.dayEventActions}>
                            <button
                              type="button"
                              className={styles.actionIconBtn}
                              title="Modifier l'événement"
                              onClick={() => handleOpenEditModal(evt)}
                              aria-label="Modifier l'événement"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.actionIconBtn} ${styles.actionIconBtnDelete}`}
                              title="Supprimer l'événement"
                              onClick={() => handleDeleteUserEvent(evt.id)}
                              aria-label="Supprimer l'événement"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <h5 className={styles.dayEventCardTitle}>{evt.title}</h5>
                        {evt.description && (
                          <p className={styles.dayEventCardDesc}>{evt.description}</p>
                        )}

                        <button
                          type="button"
                          className={styles.dayEventCreatePostBtn}
                          onClick={() => {
                            setIsModalOpen(false);
                            router.push(`/dashboard/create?theme=${encodeURIComponent(evt.title)}`);
                          }}
                          title="Générer une publication IA pour cet événement"
                        >
                          <Sparkles size={12} color="#FF5A00" />
                          <span>Créer un post pour cet event</span>
                        </button>
                      </div>
                    ))}

                    {/* 2. Événements nationaux */}
                    {dayEvents.nationalEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className={`${styles.dayEventCard} ${styles.dayEventNational}`}
                      >
                        <div className={styles.dayEventTopRow}>
                          <span className={styles.badgeNational}>Événement National</span>
                        </div>
                        <h5 className={styles.dayEventCardTitle}>{evt.title}</h5>

                        <button
                          type="button"
                          className={styles.dayEventCreatePostBtn}
                          onClick={() => {
                            setIsModalOpen(false);
                            router.push(`/dashboard/create?theme=${encodeURIComponent(evt.title)}`);
                          }}
                          title="Générer un post IA pour cette fête"
                        >
                          <Sparkles size={12} color="#8B5CF6" />
                          <span>Générer un post IA</span>
                        </button>
                      </div>
                    ))}

                    {/* 3. Publications programmées */}
                    {dayEvents.scheduledPosts.map((post) => (
                      <div key={post.id} className={`${styles.dayEventCard} ${styles.dayEventPost}`}>
                        <div className={styles.dayEventTopRow}>
                          <span className={styles.badgePost}>
                            Publication {post.platform}
                          </span>
                          <span className={styles.dayEventTime}>{post.timeStr}</span>
                          <div className={styles.dayEventActions}>
                            <button
                              type="button"
                              className={`${styles.actionIconBtn} ${styles.actionIconBtnDelete}`}
                              title="Annuler la publication"
                              onClick={() => handleDeleteScheduledPost(post.id)}
                              aria-label="Annuler la publication"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h5 className={styles.dayEventCardTitle}>{post.title}</h5>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CORPS DE LA MODALE — MODE 2 & 3 : FORMULAIRE CRUD (CRÉATION / MODIFICATION) */}
            {modalMode !== 'day_overview' && (
              <form onSubmit={handleSaveEvent}>
                <div className={styles.modalBody}>
                  {/* Titre */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Titre de l’événement *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Soirée Dégustation Vins & Tapas"
                      className={styles.formInput}
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {/* Date et Heure */}
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Date *</label>
                      <input
                        type="date"
                        required
                        className={styles.formInput}
                        value={formDateStr}
                        onChange={(e) => setFormDateStr(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Heure de début</label>
                      <input
                        type="time"
                        className={styles.formInput}
                        value={formTimeStr}
                        onChange={(e) => setFormTimeStr(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Catégorie */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Type d’animation</label>
                    <div className={styles.categoryPills}>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`${styles.categoryPill} ${
                            formCategory === cat.id ? styles.categoryPillActive : ''
                          }`}
                          onClick={() => setFormCategory(cat.id)}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Description / Notes (optionnel)</label>
                    <textarea
                      rows={3}
                      placeholder="Ex: Formule à 25€, concert acoustique à partir de 20h, réservation conseillée..."
                      className={styles.formTextarea}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  {editingEventId && (
                    <button
                      type="button"
                      className={styles.deleteModalBtn}
                      onClick={() => handleDeleteUserEvent(editingEventId)}
                    >
                      <Trash2 size={14} />
                      <span>Supprimer</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.cancelModalBtn}
                    onClick={() => setModalMode('day_overview')}
                  >
                    Annuler
                  </button>
                  <button type="submit" className={styles.submitModalBtn}>
                    {editingEventId ? 'Mettre à jour' : 'Enregistrer l’événement'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
