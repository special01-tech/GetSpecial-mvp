'use client';

import React from 'react';
import { Sun, Moon, Power, Clock } from 'lucide-react';
import { DaySchedule } from '@/services/onboarding/schedule.types';
import { useLanguage } from '@/i18n';
import styles from './OpeningHoursEditor.module.css';

interface OpeningHoursEditorProps {
  day: DaySchedule;
  onChange: (updated: DaySchedule) => void;
}

export default function OpeningHoursEditor({ day, onChange }: OpeningHoursEditorProps) {
  const { t } = useLanguage();
  const dayName = t(`common.components.openingHoursEditor.days.${day.dayKey}`);
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
          <span className={styles.dayLabel}>{dayName}</span>
        </div>

        <button
          type="button"
          onClick={toggleClosed}
          className={`${styles.toggleClosedBtn} ${day.isClosed ? styles.toggleClosedActive : ''}`}
          title={
            day.isClosed
              ? t('common.components.openingHoursEditor.reopenTitle')
              : t('common.components.openingHoursEditor.markClosedTitle')
          }
        >
          <Power size={13} strokeWidth={2.5} />
          <span>
            {day.isClosed
              ? t('common.components.openingHoursEditor.closedLabel')
              : t('common.components.openingHoursEditor.openLabel')}
          </span>
        </button>
      </div>

      {/* Colonne Plages Horaires Midi & Soir */}
      <div className={styles.slotsArea}>
        {day.isClosed ? (
          <div className={styles.closedNotice}>
            <span>{t('common.components.openingHoursEditor.closedAllDay')}</span>
          </div>
        ) : (
          <div className={styles.servicesGrid}>
            {/* Lunch */}
            <div className={styles.serviceSlot}>
              <div className={styles.serviceHeader}>
                <Sun size={13} className={styles.sunIcon} />
                <span>{t('common.components.openingHoursEditor.lunch')}</span>
              </div>
              <div className={styles.timeInputs}>
                <input
                  type="time"
                  value={day.lunchOpen}
                  onChange={(e) => updateField('lunchOpen', e.target.value)}
                  className={styles.timeInput}
                  aria-label={t('common.components.openingHoursEditor.openLunchAria', {
                    day: dayName,
                  })}
                />
                <span className={styles.timeDash}>–</span>
                <input
                  type="time"
                  value={day.lunchClose}
                  onChange={(e) => updateField('lunchClose', e.target.value)}
                  className={styles.timeInput}
                  aria-label={t('common.components.openingHoursEditor.closeLunchAria', {
                    day: dayName,
                  })}
                />
              </div>
            </div>

            {/* Dinner */}
            <div className={styles.serviceSlot}>
              <div className={styles.serviceHeader}>
                <Moon size={13} className={styles.moonIcon} />
                <span>{t('common.components.openingHoursEditor.dinner')}</span>
              </div>
              <div className={styles.timeInputs}>
                <input
                  type="time"
                  value={day.dinnerOpen}
                  onChange={(e) => updateField('dinnerOpen', e.target.value)}
                  className={styles.timeInput}
                  aria-label={t('common.components.openingHoursEditor.openDinnerAria', {
                    day: dayName,
                  })}
                />
                <span className={styles.timeDash}>–</span>
                <input
                  type="time"
                  value={day.dinnerClose}
                  onChange={(e) => updateField('dinnerClose', e.target.value)}
                  className={styles.timeInput}
                  aria-label={t('common.components.openingHoursEditor.closeDinnerAria', {
                    day: dayName,
                  })}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
