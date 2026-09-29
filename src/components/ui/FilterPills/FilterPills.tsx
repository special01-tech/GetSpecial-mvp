'use client';

import React from 'react';
import styles from './FilterPills.module.css';

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterPillsProps {
  options: FilterOption[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function FilterPills({ options, activeId, onChange }: FilterPillsProps) {
  return (
    <div className={styles.scrollWrapper}>
      <div className={styles.container}>
        {options.map((opt) => {
          const isActive = opt.id === activeId;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`${styles.pill} ${isActive ? styles.pillActive : ''}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
