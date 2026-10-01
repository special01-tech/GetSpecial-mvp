'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import PublicationCard from '@/components/ui/PublicationCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { MOCK_PUBLICATIONS } from '@/lib/mock-data';
import type { PublicationDTO } from '@/types/dto';
import styles from './publications.module.css';

const DAYS_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function PublicationsPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'gallery'>('calendar');
  const [selectedDay, setSelectedDay] = useState<number>(16);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPublications() {
      try {
        const restRes = await fetch('/api/restaurants');
        if (restRes.ok) {
          const restJson = await restRes.json();
          if (restJson.success && restJson.data && restJson.data.length > 0) {
            const restId = restJson.data[0].id;
            const res = await fetch(`/api/publications?restaurantId=${restId}`);
            if (res.ok) {
              const json = await res.json();
              if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                setPublications(json.data);
              }
            }
          }
        }
      } catch (err) {
        console.error('Erreur chargement publications:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPublications();
  }, []);

  const allPosts = publications.length > 0 ? publications : MOCK_PUBLICATIONS;

  // Calendrier dynamique basé sur le mois courant
  const now = new Date();
  const currentMonthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  // Décalage ISO : Lundi=0..Dimanche=6
  const offsetDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const emptyDays = Array.from({ length: offsetDays }, (_, i) => null);
  const daysOfMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarCells = [...emptyDays, ...daysOfMonth];

  // Jours avec publications (basés sur les données réelles ou mock)
  const eventDays = allPosts
    .map((p) => {
      const d = p.date ? new Date(p.date) : null;
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        ? d.getDate()
        : null;
    })
    .filter(Boolean) as number[];

  const upcomingPosts = allPosts.slice(0, 3);

  return (
    <div className={styles.container}>
      {/* Header */}
      <PageHeader
        title="Publications"
        subtitle="Gérez toutes vos publications : créez, planifiez et suivez leurs performances."
        action={
          <Link href="/creer" style={{ textDecoration: 'none' }}>
            <Button variant="primary">
              <Plus size={16} />
              <span>Nouvelle publication</span>
            </Button>
          </Link>
        }
      />

      {/* View Switcher bar */}
      <div className={styles.topBarRow}>
        <div className={styles.viewSwitcher}>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`${styles.viewBtn} ${viewMode === 'calendar' ? styles.viewBtnActive : ''}`}
          >
            <CalendarIcon size={14} />
            <span>Calendrier</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('gallery')}
            className={`${styles.viewBtn} ${viewMode === 'gallery' ? styles.viewBtnActive : ''}`}
          >
            <Grid size={14} />
            <span>Galerie</span>
          </button>
        </div>
      </div>

      {/* Calendar & Upcoming split view (visible when in calendar mode) */}
      {viewMode === 'calendar' && (
        <div className={styles.calendarSplit}>
          {/* Calendar Card */}
          <div className={styles.cardPanel}>
            <div className={styles.calendarHeader}>
              <span className={styles.calendarMonth}>{currentMonthLabel.charAt(0).toUpperCase() + currentMonthLabel.slice(1)}</span>
              <div className={styles.calendarNavBtns}>
                <button type="button" className={styles.navArrowBtn} aria-label="Mois précédent">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" className={styles.navArrowBtn} aria-label="Mois suivant">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className={styles.daysOfWeek}>
              {DAYS_NAMES.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className={styles.daysGrid}>
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} />;
                }
                const isSelected = day === selectedDay;
                const hasEvent = eventDays.includes(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`${styles.dayCell} ${isSelected ? styles.dayCellActive : ''}`}
                  >
                    <span>{day}</span>
                    {hasEvent && <span className={styles.dayDot} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upcoming Posts Card */}
          <div className={styles.cardPanel}>
            <h3 className={styles.panelTitle}>Publications à venir</h3>
            <div className={styles.upcomingList}>
              {upcomingPosts.map((post) => {
                const badgeVariant =
                  post.status === 'to_publish'
                    ? 'to_publish'
                    : post.status === 'scheduled'
                    ? 'scheduled'
                    : 'published';

                return (
                  <div key={post.id} className={styles.upcomingItem}>
                    <div className={styles.upcomingLeft}>
                      <img src={post.image} alt={post.title} className={styles.upcomingThumb} />
                      <div className={styles.upcomingInfo}>
                        <span className={styles.upcomingTitle}>{post.title}</span>
                        <span className={styles.upcomingDate}>
                          Le {post.date} • {post.time}
                        </span>
                      </div>
                    </div>
                    <StatusBadge label={post.statusLabel} variant={badgeVariant} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Grid of All Publications */}
      <section>
        <h3 className={styles.panelTitle} style={{ marginBottom: '16px' }}>
          Toutes vos publications
        </h3>
        <div className={styles.publicationsGrid}>
          {allPosts.map((pub) => (
            <PublicationCard key={pub.id} publication={pub} />
          ))}
        </div>
      </section>
    </div>
  );
}
