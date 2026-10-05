'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Filter,
  Sparkles,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import PlanningEventCard from '@/components/ui/PlanningEventCard/PlanningEventCard';
import { useLanguage } from '@/i18n';
import {
  PlanningItem,
  PlanningStatus,
  MOCK_PLANNING_ITEMS,
} from '@/services/planning/planning.data';
import styles from './planning.module.css';

type FilterOption = 'all' | PlanningStatus;

export default function PlanningPage() {
  const router = useRouter();
  const { t, formatDate } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');
  const [events, setEvents] = useState<PlanningItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restaurantId = typeof window !== 'undefined'
      ? localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1'
      : 'rest_demo_austin_1';

    fetch(`/api/posts?restaurantId=${restaurantId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const liveItems: PlanningItem[] = json.data.map((p: any) => {
            const text = p.text || p.content || t('content.planning.fallbackPost');
            return {
              id: p.id,
              campaignId: p.id,
              title: text.slice(0, 48) + (text.length > 48 ? '...' : ''),
              description: text,
              date: p.publishedAt
                ? t('content.planning.publishedToday')
                : p.scheduledAt
                ? formatDate(p.scheduledAt, { day: 'numeric', month: 'short' })
                : t('content.planning.today'),
              time: p.scheduledAt
                ? formatDate(p.scheduledAt, { hour: '2-digit', minute: '2-digit' })
                : '18:00',
              type: 'special_offer',
              status: p.status === 'published' ? 'published' : p.status === 'scheduled' ? 'programmed' : p.status === 'approved' ? 'approved' : 'to_validate',
              platforms: [p.platform ? p.platform.toLowerCase() : 'instagram'],
              isHighImpact: true,
            };
          });
          setEvents(liveItems);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filtrage dynamique
  const filteredEvents = useMemo(() => {
    if (selectedFilter === 'all') return events;
    return events.filter((ev) => ev.status === selectedFilter);
  }, [events, selectedFilter]);

  // Compteurs par statut
  const counts = useMemo(() => {
    return {
      all: events.length,
      published: events.filter((e) => e.status === 'published').length,
      programmed: events.filter((e) => e.status === 'programmed').length,
      approved: events.filter((e) => e.status === 'approved').length,
      to_validate: events.filter((e) => e.status === 'to_validate').length,
    };
  }, [events]);

  const handleCardClick = (event: PlanningItem) => {
    // Redirection vers le détail de la campagne
    router.push(`/dashboard/campaign/${event.campaignId || 'camp_wings_50'}`);
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header de la page Planning */}
        <header className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconCircle}>
              <CalendarIcon size={20} className={styles.calendarIcon} />
            </div>
            <div>
              <h1 className={styles.pageTitle}>{t('content.planning.title')}</h1>
              <p className={styles.pageSubtitle}>{t('content.planning.subtitle')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/dashboard/chat')}
            className={styles.aiActionBtn}
            title={t('content.planning.newActionTitle')}
          >
            <Sparkles size={16} />
            <span>{t('content.planning.newButton')}</span>
          </button>
        </header>

        {/* Barre de filtres par statut */}
        <section className={styles.filtersSection} aria-label={t('content.planning.filtersLabel')}>
          <div className={styles.filtersRow}>
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`${styles.filterButton} ${
                selectedFilter === 'all' ? styles.filterActive : ''
              }`}
            >
              <span>{t('content.planning.filters.all')}</span>
              <span className={styles.filterBadge}>{counts.all}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter('to_validate')}
              className={`${styles.filterButton} ${styles.filterToValidate} ${
                selectedFilter === 'to_validate' ? styles.filterActive : ''
              }`}
            >
              <AlertCircle size={12} />
              <span>{t('content.planning.filters.toValidate')}</span>
              <span className={styles.filterBadge}>{counts.to_validate}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter('approved')}
              className={`${styles.filterButton} ${styles.filterApproved} ${
                selectedFilter === 'approved' ? styles.filterActive : ''
              }`}
            >
              <CheckCircle2 size={12} />
              <span>{t('content.planning.filters.approved')}</span>
              <span className={styles.filterBadge}>{counts.approved}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter('programmed')}
              className={`${styles.filterButton} ${styles.filterProgrammed} ${
                selectedFilter === 'programmed' ? styles.filterActive : ''
              }`}
            >
              <Clock size={12} />
              <span>{t('content.planning.filters.programmed')}</span>
              <span className={styles.filterBadge}>{counts.programmed}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter('published')}
              className={`${styles.filterButton} ${styles.filterApproved} ${
                selectedFilter === 'published' ? styles.filterActive : ''
              }`}
            >
              <CheckCircle2 size={12} />
              <span>{t('content.planning.filters.published')}</span>
              <span className={styles.filterBadge}>{counts.published}</span>
            </button>
          </div>
        </section>

        {/* Listing des actions marketing */}
        <main className={styles.mainContent}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
              <div style={{ height: 80, borderRadius: 12, background: '#F7F7F7', border: '1px solid #E5E5E5', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 80, borderRadius: 12, background: '#F7F7F7', border: '1px solid #E5E5E5', animation: 'pulse 1.5s infinite' }} />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconBox}>
                <CalendarIcon size={24} />
              </div>
              <h3 className={styles.emptyTitle}>
                {events.length === 0 ? t('content.planning.emptyNoPosts') : t('content.planning.emptyNoFilter')}
              </h3>
              <p className={styles.emptyText}>
                {events.length === 0
                  ? t('content.planning.emptyNoPostsText')
                  : t('content.planning.emptyNoFilterText')}
              </p>
              {events.length === 0 ? (
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className={styles.resetFilterBtn}
                >
                  {t('content.planning.discoverButton')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedFilter('all')}
                  className={styles.resetFilterBtn}
                >
                  {t('content.planning.showAllButton')}
                </button>
              )}
            </div>
          ) : (
            <div className={styles.eventsList}>
              {filteredEvents.map((item) => (
                <PlanningEventCard
                  key={item.id}
                  event={item}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </main>

        {/* Spacer pour Bottom Navigation */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
