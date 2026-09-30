'use client';

import React from 'react';
import { Sun, Moon, Power, Clock } from 'lucide-react';
import { DaySchedule } from '@/services/onboarding/schedule.types';
import styles from './OpeningHoursEditor.module.css';

interface OpeningHoursEditorProps {
  day: DaySchedule;
  onChange: (updated: DaySchedule) => void;
}

export default function OpeningHoursEditor({ day, onChange }: OpeningHoursEditorProps) {
  const toggleClosed = () => {
    onChange({
      ...day,
      isClosed: !day.isClosed,
    });
  };

  const updateField = (field: keyof DaySchedule, value: string | boolean) => {
    onChange({
      ...day,
      [field]: value,
    });
  };

  return (
    <div className={`${styles.dayRow} ${day.isClosed ? styles.dayClosed : ''}`}>
      {/* Colonne Jour & Bouton Fermé */}
      <div className={styles.dayInfo}>
        <div className={styles.dayBadge}>
          <span className={styles.dayLabel}>{day.label}</span>
        </div>

        <button
          type="button"
          onClick={toggleClosed}
          className={`${styles.toggleClosedBtn} ${day.isClosed ? styles.toggleClosedActive : ''}`}
          title={day.isClosed ? 'Rouvrir cette journée' : 'Marquer comme fermé'}
        >
          <Power size={13} strokeWidth={2.5} />
          <span>{day.isClosed ? 'Fermé' : 'Ouvert'}</span>
        </button>
      </div>

      {/* Colonne Plages Horaires Midi & Soir */}
      <div className={styles.slotsArea}>
        {day.isClosed ? (
          <div className={styles.closedNotice}>
            <span>Closed all day</span>
          </div>
        ) : (
          <div className={styles.servicesGrid}>
            {/* Lunch */}
            <div className={styles.serviceSlot}>
              <div className={styles.serviceHeader}>
                <Sun size={13} className={styles.sunIcon} />
                <span>Lunch</span>
              </div>
              <div className={styles.timeInputs}>
                <input
                  type="time"
                  value={day.lunchOpen}
                  onChange={(e) => updateField('lunchOpen', e.target.value)}
                  className={styles.timeInput}
                  aria-label={`Opening hour lunch ${day.label}`}
                />
                <span className={styles.timeDash}>–</span>
                <input
                  type="time"
                  value={day.lunchClose}
                  onChange={(e) => updateField('lunchClose', e.target.value)}
                  className={styles.timeInput}
                  aria-label={`Closing hour lunch ${day.label}`}
                />
              </div>
            </div>

            {/* Dinner */}
            <div className={styles.serviceSlot}>
              <div className={styles.serviceHeader}>
                <Moon size={13} className={styles.moonIcon} />
                <span>Dinner</span>
              </div>
              <div className={styles.timeInputs}>
                <input
                  type="time"
                  value={day.dinnerOpen}
                  onChange={(e) => updateField('dinnerOpen', e.target.value)}
                  className={styles.timeInput}
                  aria-label={`Opening hour dinner ${day.label}`}
                />
                <span className={styles.timeDash}>–</span>
                <input
                  type="time"
                  value={day.dinnerClose}
                  onChange={(e) => updateField('dinnerClose', e.target.value)}
                  className={styles.timeInput}
                  aria-label={`Closing hour dinner ${day.label}`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
