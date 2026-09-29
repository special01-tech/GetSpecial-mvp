'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import FilterPills, { FilterOption } from '@/components/ui/FilterPills';
import IdeaCard from '@/components/ui/IdeaCard';
import { MOCK_IDEAS } from '@/lib/mock-data';
import styles from './idees.module.css';

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'Tout' },
  { id: 'today', label: "Aujourd'hui" },
  { id: 'week', label: 'Cette semaine' },
  { id: 'weather', label: 'Météo' },
  { id: 'events', label: 'Événements' },
  { id: 'trends', label: 'Tendances' },
  { id: 'performance', label: 'Performances' },
  { id: 'season', label: 'Saisonnalité' },
];

export default function IdeesPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredIdeas = MOCK_IDEAS.filter((idea) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'today') return idea.period.toLowerCase().includes("aujourd'hui");
    if (activeFilter === 'week') return idea.period.toLowerCase().includes('semaine') || idea.period.toLowerCase().includes('vendredi');
    return idea.filter === activeFilter;
  });

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <PageHeader
        title="Idées"
        subtitle="Découvrez des opportunités pour votre restaurant, basées sur la météo, les événements, les tendances et plus encore."
      />

      {/* Filter Pills */}
      <div className={styles.filtersContainer}>
        <FilterPills
          options={FILTER_OPTIONS}
          activeId={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      {/* Vertical list of Ideas */}
      <div className={styles.ideasList}>
        {filteredIdeas.length > 0 ? (
          filteredIdeas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
        ) : (
          <div className={styles.emptyState}>
            Aucune idée ne correspond à ce filtre pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
