'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Sparkles,
  ArrowRight,
  List,
  LayoutGrid,
  Flame,
  Tag,
  Share2,
  Layers,
  CheckCircle2,
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

  // Bannière d'installation PWA (dismissible et mémorisée)
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('gs_pwa_banner_dismissed');
      if (!dismissed) setShowInstallBanner(true);
    } catch {}
  }, []);

  const handleDismissInstallBanner = () => {
    setShowInstallBanner(false);
    try {
      localStorage.setItem('gs_pwa_banner_dismissed', 'true');
    } catch {}
  };

  // Mode d'affichage : 'agenda' (semaine + jour, mobile-first), 'month' (grille 42 jours), 'timeline' (flux continu)
  const [viewMode, setViewMode] = useState<'agenda' | 'month' | 'timeline'>('agenda');

  // Date de référence (initialisée sur octobre 2026 selon la maquette)
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 9, 9));
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-10-09');

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
    } catch {}
  }, []);

  // ---------------------------------------------------------------------------
  // Publications Programmées (Vert - Persisté & Synchronisé API)
  // ---------------------------------------------------------------------------
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);

  useEffect(() => {
    let initialPosts: ScheduledPost[] = [];
    try {
      const stored = localStorage.getItem('gs_scheduled_posts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialPosts = parsed;
          setScheduledPosts(parsed);
        }
      }
      if (initialPosts.length === 0) {
        initialPosts = [
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
      }
    } catch {}

    // Synchronisation API
    const syncFromApi = async () => {
      try {
        const storedRestId =
          localStorage.getItem('getspecial_restaurant_id') ||
          (() => {
            const r = localStorage.getItem('getspecial_selected_restaurant');
            try {
              return r ? JSON.parse(r)?.id : null;
            } catch {
              return null;
            }
          })();

        if (!storedRestId) return;

        const res = await fetch(`/api/posts?restaurantId=${storedRestId}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const apiPosts: ScheduledPost[] = json.data
            .filter((p: any) => ['scheduled', 'approved', 'published'].includes(p.status))
            .map((p: any) => {
              const dateObj = p.scheduledAt ? new Date(p.scheduledAt) : new Date(p.createdAt);
              const dateStr = dateObj.toISOString().split('T')[0];
              const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              const title =
                (Array.isArray(p.verifiedFacts) && p.verifiedFacts[0]) ||
                (p.text ? p.text.slice(0, 35) + '...' : 'Publication');
              return {
                id: p.id,
                title,
                dateStr,
                timeStr,
                imageUrl: p.imageUrl || undefined,
                platform: p.platform ? p.platform.charAt(0).toUpperCase() + p.platform.slice(1) : 'Instagram',
                status: p.status === 'published' ? 'published' : 'scheduled',
              };
            });

          setScheduledPosts((prev) => {
            const map = new Map<string, ScheduledPost>();
            apiPosts.forEach((p) => map.set(p.id, p));
            prev.forEach((p) => {
              if (!map.has(p.id)) map.set(p.id, p);
            });
            const merged = Array.from(map.values());
            try {
              localStorage.setItem('gs_scheduled_posts', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch (e) {
        console.warn('[PLANNING_API_SYNC_ERROR]', e);
      }
    };

    syncFromApi();
  }, []);

  const saveUserEventsToStorage = (events: UserEvent[]) => {
    setUserEvents(events);
    try {
      localStorage.setItem('gs_user_events', JSON.stringify(events));
    } catch {}
  };

  const saveScheduledPostsToStorage = (posts: ScheduledPost[]) => {
    setScheduledPosts(posts);
    try {
      localStorage.setItem('gs_scheduled_posts', JSON.stringify(posts));
    } catch {}
  };

  // ---------------------------------------------------------------------------
  // Date Helpers & Navigation
  // ---------------------------------------------------------------------------
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthName = useMemo(() => {
    return currentDate.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
  }, [currentDate]);

  // Jours de la semaine de référence (pour le ruban hebdomadaire tactile)
  const weekDays = useMemo(() => {
    const selectedDate = new Date(selectedDateStr + 'T12:00:00');
    const day = selectedDate.getDay(); // 0 Dimanche, 1 Lundi...
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() + diffToMonday);

    const days: {
      dateStr: string;
      dayNum: number;
      dayShort: string;
      isToday: boolean;
      isSelected: boolean;
      hasNational: boolean;
      hasUserEvent: boolean;
      hasScheduledPost: boolean;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      const isToday = y === 2026 && cur.getMonth() === 9 && cur.getDate() === 9;
      const isSelected = dateStr === selectedDateStr;

      days.push({
        dateStr,
        dayNum: cur.getDate(),
        dayShort: cur.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').toUpperCase(),
        isToday,
        isSelected,
        hasNational: nationalEvents.some((e) => e.dateStr === dateStr),
        hasUserEvent: userEvents.some((e) => e.dateStr === dateStr),
        hasScheduledPost: scheduledPosts.some((p) => p.dateStr === dateStr),
      });
    }

    return days;
  }, [selectedDateStr, nationalEvents, userEvents, scheduledPosts]);

  // Formatage texte du jour sélectionné
  const selectedDateFormatted = useMemo(() => {
    const dateObj = new Date(selectedDateStr + 'T12:00:00');
    return dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDateStr]);

  // Navigation dans le ruban de la semaine
  const handlePrevWeek = () => {
    const cur = new Date(selectedDateStr + 'T12:00:00');
    cur.setDate(cur.getDate() - 7);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const newDateStr = `${y}-${m}-${d}`;
    setSelectedDateStr(newDateStr);
    setCurrentDate(cur);
  };

  const handleNextWeek = () => {
    const cur = new Date(selectedDateStr + 'T12:00:00');
    cur.setDate(cur.getDate() + 7);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const newDateStr = `${y}-${m}-${d}`;
    setSelectedDateStr(newDateStr);
    setCurrentDate(cur);
  };

  const handleJumpToToday = () => {
    setSelectedDateStr('2026-10-09');
    setCurrentDate(new Date(2026, 9, 9));
  };

  // Navigation mois (pour vue mois)
  const handlePrevMonth = () => {
    const prev = new Date(currentYear, currentMonth - 1, 1);
    setCurrentDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentYear, currentMonth + 1, 1);
    setCurrentDate(next);
  };

  // ---------------------------------------------------------------------------
  // Grille Mensuelle (42 cases)
  // ---------------------------------------------------------------------------
  const weekDayLabels = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    // En JS 0 = Dimanche, 1 = Lundi. Pour aligner LUN en première colonne :
    const firstDayIndex = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);
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
    for (let i = firstDayIndex - 1; i >= 0; i--) {
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
      const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = selectedDateStr === cellDateStr;

      cells.push({
        key: `curr-${day}`,
        dayNumber: day,
        cellDateStr,
        isCurrentMonth: true,
        isToday,
        isSelected,
        hasNational: nationalEvents.some((e) => e.dateStr === cellDateStr),
        hasUserEvent: userEvents.some((e) => e.dateStr === cellDateStr),
        hasScheduledPost: scheduledPosts.some((p) => p.dateStr === cellDateStr),
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
  }, [currentYear, currentMonth, selectedDateStr, nationalEvents, userEvents, scheduledPosts]);

  // ---------------------------------------------------------------------------
  // Événements pour le jour sélectionné
  // ---------------------------------------------------------------------------
  const dayEvents = useMemo(() => {
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
  // Événements pour la vue Timeline (Tous les événements triés chronologiquement)
  // ---------------------------------------------------------------------------
  const timelineDays = useMemo(() => {
    const datesSet = new Set<string>();
    nationalEvents.forEach((e) => datesSet.add(e.dateStr));
    userEvents.forEach((e) => datesSet.add(e.dateStr));
    scheduledPosts.forEach((p) => datesSet.add(p.dateStr));

    const sortedDates = Array.from(datesSet).sort();

    return sortedDates.map((dateStr) => {
      const dateObj = new Date(dateStr + 'T12:00:00');
      const formatted = dateObj.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      return {
        dateStr,
        formatted,
        isToday: dateStr === '2026-10-09',
        national: nationalEvents.filter((e) => e.dateStr === dateStr),
        user: userEvents.filter((e) => e.dateStr === dateStr),
        posts: scheduledPosts.filter((p) => p.dateStr === dateStr),
      };
    });
  }, [nationalEvents, userEvents, scheduledPosts]);

  // ---------------------------------------------------------------------------
  // Modale / Drawer d'Ajout & Modification (CRUD)
  // ---------------------------------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDateStr, setFormDateStr] = useState('');
  const [formTimeStr, setFormTimeStr] = useState('19:30');
  const [formCategory, setFormCategory] = useState<UserEvent['category']>('tasting');
  const [formDescription, setFormDescription] = useState('');

  const handleOpenCreateModal = (defaultDate?: string) => {
    setEditingEventId(null);
    setFormTitle('');
    setFormDateStr(defaultDate || selectedDateStr || '2026-10-09');
    setFormTimeStr('19:30');
    setFormCategory('tasting');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: UserEvent) => {
    setEditingEventId(event.id);
    setFormTitle(event.title);
    setFormDateStr(event.dateStr);
    setFormTimeStr(event.timeStr || '19:30');
    setFormCategory(event.category);
    setFormDescription(event.description || '');
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingEventId) {
      // Modification
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
      // Création
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

    setSelectedDateStr(formDateStr);
    setIsModalOpen(false);
  };

  const handleDeleteUserEvent = (id: string) => {
    const updated = userEvents.filter((e) => e.id !== id);
    saveUserEventsToStorage(updated);
    if (editingEventId === id) {
      setIsModalOpen(false);
    }
  };

  const handleDeleteScheduledPost = (id: string) => {
    const updated = scheduledPosts.filter((p) => p.id !== id);
    saveScheduledPostsToStorage(updated);
  };

  const handleCreatePostInStudio = (title: string, desc?: string) => {
    const params = new URLSearchParams();
    params.set('type', 'custom');
    params.set('title', title);
    if (desc) params.set('desc', desc);
    params.set('theme', title);
    router.push(`/dashboard/create?${params.toString()}`);
  };

  const getCategoryLabel = (cat: UserEvent['category']) => {
    const found = CATEGORY_OPTIONS.find((c) => c.id === cat);
    return found ? `${found.icon} ${found.label}` : 'Événement';
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* ========================================================= */}
        {/* BANNIÈRE D'INSTALLATION PWA (Dismissible et fine)        */}
        {/* ========================================================= */}
        {showInstallBanner && (
          <div className={styles.installBanner} role="banner">
            <div className={styles.bannerLeft}>
              <div className={styles.bannerIconBadge}>
                <Download size={16} strokeWidth={2.4} />
              </div>
              <div className={styles.bannerTexts}>
                <h4 className={styles.bannerTitle}>Installer GetSpecial</h4>
                <p className={styles.bannerSubtitle}>Accès instantané à votre planning en plein écran sur smartphone.</p>
              </div>
            </div>
            <div className={styles.bannerRight}>
              <button
                type="button"
                className={styles.bannerInstallBtn}
                onClick={() => alert('Appuyez sur "Partager" puis "Sur l\'écran d\'accueil" sur Safari ou le menu Chrome.')}
              >
                Installer
              </button>
              <button
                type="button"
                className={styles.bannerCloseBtn}
                onClick={handleDismissInstallBanner}
                aria-label="Fermer la bannière"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* EN-TÊTE DE LA PAGE PLANNING                              */}
        {/* ========================================================= */}
        <header className={styles.header}>
          <div className={styles.headerTitleRow}>
            <div className={styles.iconCircle} aria-hidden="true">
              <CalendarDays size={22} color="#ff5a00" strokeWidth={2.2} />
            </div>
            <div className={styles.headerTitleGroup}>
              <h1 className={styles.pageTitle}>Planning & Événements</h1>
              <p className={styles.pageSubtitle}>
                Synchronisez vos animations en salle et vos publications réseaux.
              </p>
            </div>
          </div>

          <div className={styles.headerActionsRow}>
            {/* Segmented Control : Choix de la Vue (Agenda / Mois / Timeline) */}
            <nav className={styles.viewSegmentedControl} aria-label="Mode de vue planning">
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`${styles.viewTabBtn} ${viewMode === 'agenda' ? styles.viewTabActive : ''}`}
                title="Vue Semaine & Journée tactile"
              >
                <Clock size={15} />
                <span>Agenda</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`${styles.viewTabBtn} ${viewMode === 'month' ? styles.viewTabActive : ''}`}
                title="Vue Calendrier Mensuel"
              >
                <LayoutGrid size={15} />
                <span>Mois</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`${styles.viewTabBtn} ${viewMode === 'timeline' ? styles.viewTabActive : ''}`}
                title="Flux continu des prochains événements"
              >
                <Layers size={15} />
                <span>Flux</span>
              </button>
            </nav>

            {/* Bouton CTA Principal d'Ajout */}
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className={styles.newBtn}
              title="Ajouter un événement au restaurant"
            >
              <Plus size={18} strokeWidth={2.4} />
              <span>Ajouter un événement</span>
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* CORPS PRINCIPAL : GAUCHE (VUE ACTIVE) / DROITE (DESKTOP)   */}
        {/* ========================================================= */}
        <div className={styles.planningGrid}>
          {/* ------------------------------------------------------- */}
          {/* COLONNE GAUCHE (CONTENU PRINCIPAL)                      */}
          {/* ------------------------------------------------------- */}
          <main className={styles.mainColumn}>
            {/* ----------------------------------------------------- */}
            {/* 1. MODE AGENDA MOBILE-FIRST (SEMAINE + DÉTAIL DU JOUR) */}
            {/* ----------------------------------------------------- */}
            {viewMode === 'agenda' && (
              <section className={styles.agendaSection}>
                {/* Ruban de la Semaine Tactile */}
                <div className={styles.weekRibbonCard}>
                  <div className={styles.weekNavRow}>
                    <button
                      type="button"
                      onClick={handlePrevWeek}
                      className={styles.weekArrowBtn}
                      aria-label="Semaine précédente"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div className={styles.weekNavTitleWrap}>
                      <span className={styles.weekRangeText}>
                        Semaine du {weekDays[0]?.dayNum} au {weekDays[6]?.dayNum} {monthName}
                      </span>
                      <button
                        type="button"
                        onClick={handleJumpToToday}
                        className={styles.todayPillBtn}
                        title="Revenir à aujourd'hui"
                      >
                        Aujourd&apos;hui
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleNextWeek}
                      className={styles.weekArrowBtn}
                      aria-label="Semaine suivante"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {/* 7 Capsules de Jours de la Semaine */}
                  <div className={styles.weekDaysStrip}>
                    {weekDays.map((d) => (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => setSelectedDateStr(d.dateStr)}
                        className={`${styles.dayPill} ${d.isSelected ? styles.dayPillSelected : ''} ${
                          d.isToday ? styles.dayPillToday : ''
                        }`}
                      >
                        <span className={styles.dayPillShort}>{d.dayShort}</span>
                        <span className={styles.dayPillNum}>{d.dayNum}</span>

                        {/* Puces de couleur sous le jour */}
                        <div className={styles.dayPillDots}>
                          {d.hasNational && <span className={styles.dotNational} title="Fête / Événement national" />}
                          {d.hasUserEvent && <span className={styles.dotUser} title="Événement restaurant" />}
                          {d.hasScheduledPost && <span className={styles.dotPost} title="Post programmé" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section Agenda de la Journée Sélectionnée */}
                <div className={styles.dayAgendaCard}>
                  <div className={styles.dayAgendaHeader}>
                    <div>
                      <h2 className={styles.dayAgendaTitle}>
                        {selectedDateFormatted}
                      </h2>
                      <p className={styles.dayAgendaSub}>
                        {totalDayEventsCount === 0
                          ? 'Aucun événement programmé pour cette journée'
                          : `${totalDayEventsCount} événement${totalDayEventsCount > 1 ? 's' : ''} et publication${totalDayEventsCount > 1 ? 's' : ''}`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal(selectedDateStr)}
                      className={styles.quickAddBtn}
                      title="Ajouter un événement pour ce jour"
                    >
                      <Plus size={15} strokeWidth={2.4} />
                      <span>Ajouter</span>
                    </button>
                  </div>

                  {/* Liste des cartes du jour */}
                  {totalDayEventsCount === 0 ? (
                    <div className={styles.emptyDayBox}>
                      <div className={styles.emptyDayIcon}>
                        <Clock size={28} color="#94a3b8" />
                      </div>
                      <h3 className={styles.emptyDayHeading}>Journée libre</h3>
                      <p className={styles.emptyDayText}>
                        Profitez de cette journée pour annoncer un plat du jour ou programmer une promotion sur vos réseaux sociaux.
                      </p>
                      <div className={styles.emptyDayActions}>
                        <button
                          type="button"
                          onClick={() => handleOpenCreateModal(selectedDateStr)}
                          className={styles.emptyAddEventBtn}
                        >
                          <CalendarPlus size={15} />
                          <span>Ajouter une animation</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreatePostInStudio(`Spécial du ${selectedDateFormatted}`)}
                          className={styles.emptyCreatePostBtn}
                        >
                          <Sparkles size={15} />
                          <span>Créer un post dans le Studio</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.dayCardsList}>
                      {/* 1. Publications Programmées (Vert) */}
                      {dayEvents.scheduledPosts.map((post) => (
                        <div key={post.id} className={`${styles.itemCard} ${styles.itemPost}`}>
                          <div className={styles.itemTopRow}>
                            <div className={styles.itemBadgeGroup}>
                              <span className={styles.badgePost}>
                                <Share2 size={12} />
                                <span>{post.platform}</span>
                              </span>
                              <span className={styles.itemTime}>
                                <Clock size={12} />
                                <span>{post.timeStr}</span>
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteScheduledPost(post.id)}
                              className={styles.deleteMiniBtn}
                              title="Annuler cette publication"
                              aria-label="Annuler la publication"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <h3 className={styles.itemTitle}>{post.title}</h3>

                          <div className={styles.itemFooter}>
                            <span className={styles.statusScheduledPill}>
                              <CheckCircle2 size={12} />
                              <span>Prêt pour diffusion</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => handleCreatePostInStudio(post.title)}
                              className={styles.openInStudioBtn}
                            >
                              <span>Modifier dans le Studio</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* 2. Événements Personnalisés du Restaurant (Orange) */}
                      {dayEvents.userEvents.map((evt) => (
                        <div key={evt.id} className={`${styles.itemCard} ${styles.itemUser}`}>
                          <div className={styles.itemTopRow}>
                            <div className={styles.itemBadgeGroup}>
                              <span className={styles.badgeUser}>
                                {getCategoryLabel(evt.category)}
                              </span>
                              {evt.timeStr && (
                                <span className={styles.itemTime}>
                                  <Clock size={12} />
                                  <span>{evt.timeStr}</span>
                                </span>
                              )}
                            </div>

                            <div className={styles.itemActionIcons}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(evt)}
                                className={styles.editMiniBtn}
                                title="Modifier l'événement"
                                aria-label="Modifier"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUserEvent(evt.id)}
                                className={styles.deleteMiniBtn}
                                title="Supprimer l'événement"
                                aria-label="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <h3 className={styles.itemTitle}>{evt.title}</h3>
                          {evt.description && (
                            <p className={styles.itemDesc}>{evt.description}</p>
                          )}

                          <div className={styles.itemFooter}>
                            <button
                              type="button"
                              onClick={() => handleCreatePostInStudio(evt.title, evt.description)}
                              className={styles.createPostBtnOrange}
                            >
                              <Sparkles size={14} />
                              <span>Créer un post pour cet événement</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* 3. Événements Nationaux / Marketing (Violet) */}
                      {dayEvents.nationalEvents.map((evt) => (
                        <div key={evt.id} className={`${styles.itemCard} ${styles.itemNational}`}>
                          <div className={styles.itemTopRow}>
                            <span className={styles.badgeNational}>{evt.category}</span>
                            <span className={styles.nationalBadgeDate}>{evt.dateBadge}</span>
                          </div>

                          <h3 className={styles.itemTitle}>{evt.title}</h3>

                          <div className={styles.itemFooter}>
                            <button
                              type="button"
                              onClick={() => handleCreatePostInStudio(evt.title)}
                              className={styles.createPostBtnPurple}
                            >
                              <Sparkles size={14} />
                              <span>Générer un post IA pour cette fête</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ----------------------------------------------------- */}
            {/* 2. MODE CALENDRIER MENSUEL (GRILLE COMPLÈTE)           */}
            {/* ----------------------------------------------------- */}
            {viewMode === 'month' && (
              <section className={styles.monthSection}>
                <div className={styles.calendarCard}>
                  {/* Header du mois */}
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

                  {/* Noms des jours LUN MAR MER JEU VEN SAM DIM */}
                  <div className={styles.weekHeaderGrid} role="row">
                    {weekDayLabels.map((dayLabel) => (
                      <div key={dayLabel} className={styles.weekDayLabel} role="columnheader">
                        {dayLabel}
                      </div>
                    ))}
                  </div>

                  {/* Grille des 42 cellules */}
                  <div className={styles.daysGrid} role="grid">
                    {calendarCells.map((cell) => {
                      if (!cell.isCurrentMonth) {
                        return (
                          <div key={cell.key} className={styles.outsideDayCell} aria-disabled="true">
                            <span>{cell.dayNumber}</span>
                          </div>
                        );
                      }

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
                          onClick={() => setSelectedDateStr(cell.cellDateStr)}
                          role="gridcell"
                          tabIndex={0}
                          title="Cliquer pour afficher l'agenda du jour"
                        >
                          <div className={styles.dayNumberRow}>
                            <span className={styles.dayNumber}>{cell.dayNumber}</span>
                            {cell.isToday && <span className={styles.todayBadge}>Auj.</span>}
                          </div>

                          <div className={styles.eventIndicatorsRow}>
                            {cell.hasNational && <span className={styles.dotNational} title="Fête" />}
                            {cell.hasUserEvent && <span className={styles.dotUser} title="Événement restaurant" />}
                            {cell.hasScheduledPost && <span className={styles.dotPost} title="Post programmé" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Légende du Code Couleur */}
                  <div className={styles.calendarFooterBox}>
                    <div className={styles.colorLegendBar}>
                      <div className={styles.colorLegendItem}>
                        <span className={styles.legendDotNational} />
                        <span>Fêtes & National</span>
                      </div>
                      <div className={styles.colorLegendItem}>
                        <span className={styles.legendDotUser} />
                        <span>Animations restaurant</span>
                      </div>
                      <div className={styles.colorLegendItem}>
                        <span className={styles.legendDotPost} />
                        <span>Publications programmées</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agenda du jour sous la grille mensuelle (sans popup) */}
                <div className={styles.monthDayPreview}>
                  <div className={styles.dayAgendaHeader}>
                    <div>
                      <h3 className={styles.dayAgendaTitle}>{selectedDateFormatted}</h3>
                      <p className={styles.dayAgendaSub}>
                        {totalDayEventsCount === 0
                          ? 'Aucun événement ce jour-là'
                          : `${totalDayEventsCount} événement(s) programmé(s)`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal(selectedDateStr)}
                      className={styles.quickAddBtn}
                    >
                      <Plus size={15} />
                      <span>Ajouter</span>
                    </button>
                  </div>

                  {totalDayEventsCount === 0 ? (
                    <p className={styles.monthEmptyText}>
                      Sélectionnez une date avec des pastilles de couleur pour voir ses détails ou planifiez une nouvelle animation.
                    </p>
                  ) : (
                    <div className={styles.dayCardsList}>
                      {dayEvents.scheduledPosts.map((post) => (
                        <div key={post.id} className={`${styles.itemCard} ${styles.itemPost}`}>
                          <div className={styles.itemTopRow}>
                            <span className={styles.badgePost}>{post.platform} • {post.timeStr}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteScheduledPost(post.id)}
                              className={styles.deleteMiniBtn}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <h4 className={styles.itemTitle}>{post.title}</h4>
                        </div>
                      ))}

                      {dayEvents.userEvents.map((evt) => (
                        <div key={evt.id} className={`${styles.itemCard} ${styles.itemUser}`}>
                          <div className={styles.itemTopRow}>
                            <span className={styles.badgeUser}>{getCategoryLabel(evt.category)} • {evt.timeStr}</span>
                            <div className={styles.itemActionIcons}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(evt)}
                                className={styles.editMiniBtn}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUserEvent(evt.id)}
                                className={styles.deleteMiniBtn}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <h4 className={styles.itemTitle}>{evt.title}</h4>
                          {evt.description && <p className={styles.itemDesc}>{evt.description}</p>}
                        </div>
                      ))}

                      {dayEvents.nationalEvents.map((evt) => (
                        <div key={evt.id} className={`${styles.itemCard} ${styles.itemNational}`}>
                          <span className={styles.badgeNational}>{evt.category}</span>
                          <h4 className={styles.itemTitle}>{evt.title}</h4>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ----------------------------------------------------- */}
            {/* 3. MODE FLUX CONTINU / TIMELINE (30 PROCHAINS JOURS)   */}
            {/* ----------------------------------------------------- */}
            {viewMode === 'timeline' && (
              <section className={styles.timelineSection}>
                <div className={styles.timelineHeader}>
                  <h2 className={styles.timelineTitle}>Prochains Temps Forts & Publications</h2>
                  <p className={styles.timelineSub}>
                    Vue d&apos;ensemble de toutes les animations et diffusions prévues.
                  </p>
                </div>

                <div className={styles.timelineList}>
                  {timelineDays.map((td) => (
                    <div key={td.dateStr} className={styles.timelineDayGroup}>
                      <div className={styles.timelineDateBadge}>
                        <span className={styles.timelineDateDay}>{td.formatted}</span>
                        {td.isToday && <span className={styles.todaySmallBadge}>Aujourd&apos;hui</span>}
                      </div>

                      <div className={styles.timelineCardsStack}>
                        {td.posts.map((p) => (
                          <div key={p.id} className={`${styles.itemCard} ${styles.itemPost}`}>
                            <div className={styles.itemTopRow}>
                              <span className={styles.badgePost}>{p.platform} • {p.timeStr}</span>
                              <span className={styles.statusScheduledPill}>Programmé</span>
                            </div>
                            <h4 className={styles.itemTitle}>{p.title}</h4>
                            <div className={styles.itemFooter}>
                              <button
                                type="button"
                                onClick={() => handleCreatePostInStudio(p.title)}
                                className={styles.openInStudioBtn}
                              >
                                <span>Ouvrir dans le Studio</span>
                                <ArrowRight size={13} />
                              </button>
                            </div>
                          </div>
                        ))}

                        {td.user.map((u) => (
                          <div key={u.id} className={`${styles.itemCard} ${styles.itemUser}`}>
                            <div className={styles.itemTopRow}>
                              <span className={styles.badgeUser}>{getCategoryLabel(u.category)} • {u.timeStr}</span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(u)}
                                className={styles.editMiniBtn}
                              >
                                <Pencil size={13} />
                              </button>
                            </div>
                            <h4 className={styles.itemTitle}>{u.title}</h4>
                            {u.description && <p className={styles.itemDesc}>{u.description}</p>}
                            <div className={styles.itemFooter}>
                              <button
                                type="button"
                                onClick={() => handleCreatePostInStudio(u.title, u.description)}
                                className={styles.createPostBtnOrange}
                              >
                                <Sparkles size={13} />
                                <span>Créer un post pour cet event</span>
                              </button>
                            </div>
                          </div>
                        ))}

                        {td.national.map((n) => (
                          <div key={n.id} className={`${styles.itemCard} ${styles.itemNational}`}>
                            <div className={styles.itemTopRow}>
                              <span className={styles.badgeNational}>{n.category}</span>
                            </div>
                            <h4 className={styles.itemTitle}>{n.title}</h4>
                            <div className={styles.itemFooter}>
                              <button
                                type="button"
                                onClick={() => handleCreatePostInStudio(n.title)}
                                className={styles.createPostBtnPurple}
                              >
                                <Sparkles size={13} />
                                <span>Générer un post IA</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* ------------------------------------------------------- */}
          {/* COLONNE DROITE : 2 CARTES DE SYNTHÈSE (DESKTOP)         */}
          {/* ------------------------------------------------------- */}
          <aside className={styles.sideCardsColumn}>
            {/* CARTE 1 : ÉVÉNEMENTS NATIONAUX & MARKETING À VENIR */}
            <div className={styles.eventsCard}>
              <h3 className={styles.cardHeaderTitle}>
                <CalendarDays size={14} />
                <span>Événements à venir</span>
              </h3>
              <p className={styles.cardHeaderSub}>
                Événements marketing et jours fériés à {restaurantCity}.
              </p>

              <div className={styles.eventsListStack}>
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
            </div>

            {/* CARTE 2 : STATISTIQUES & AJOUT RAPIDE */}
            <div className={styles.eventsActionCard}>
              <div className={styles.actionCardHeaderRow}>
                <span className={styles.actionCardTag}>Animations Restaurant</span>
                <span className={styles.eventCountBadge}>{userEvents.length} enregistrée(s)</span>
              </div>

              <h3 className={styles.actionCardTitle}>Planifier une animation</h3>
              <p className={styles.actionCardDesc}>
                Soirée match, concert live, dégustation ou offre flash : synchronisez votre communication restaurant.
              </p>

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
      {/* MODALE / BOTTOM SHEET TACTILE (CRÉATION & MODIFICATION)   */}
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
          <div className={styles.modalCard}>
            {/* Poignée tactile pour smartphone */}
            <div className={styles.modalDragHandle} />

            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <h3 className={styles.modalTitle}>
                  {editingEventId ? 'Modifier l’événement' : 'Nouvel événement au restaurant'}
                </h3>
                <p className={styles.modalSubtitle}>
                  Programmez vos soirées, dégustations ou promotions.
                </p>
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

                {/* Catégories tactiles */}
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
                  <label className={styles.formLabel}>Description / Menu spécial (optionnel)</label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Formule 4 plats à 25€, concert acoustique dès 20h..."
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
                    <Trash2 size={15} />
                    <span>Supprimer</span>
                  </button>
                )}
                <button
                  type="button"
                  className={styles.cancelModalBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Annuler
                </button>
                <button type="submit" className={styles.submitModalBtn}>
                  {editingEventId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
