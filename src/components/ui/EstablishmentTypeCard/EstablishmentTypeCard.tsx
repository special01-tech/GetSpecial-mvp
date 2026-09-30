'use client';

import React from 'react';
import {
  UtensilsCrossed,
  Wine,
  Trophy,
  Beer,
  Coffee,
  Sandwich,
  Pizza,
  Store,
  Check,
  LucideIcon,
} from 'lucide-react';
import { EstablishmentTypeOption } from '@/services/onboarding/establishment-types.data';
import styles from './EstablishmentTypeCard.module.css';

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Wine,
  Trophy,
  Beer,
  Coffee,
  Sandwich,
  Pizza,
  Store,
};

interface EstablishmentTypeCardProps {
  option: EstablishmentTypeOption;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export default function EstablishmentTypeCard({
  option,
  isSelected,
  onToggle,
}: EstablishmentTypeCardProps) {
  const IconComponent = ICON_MAP[option.iconName] || Store;

  return (
    <button
      type="button"
      onClick={() => onToggle(option.id)}
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      aria-pressed={isSelected}
    >
      <div className={styles.topRow}>
        <div className={styles.iconWrapper}>
          <IconComponent size={22} strokeWidth={2.2} />
        </div>
        <div className={`${styles.checkCircle} ${isSelected ? styles.checkCircleActive : ''}`}>
          {isSelected && <Check size={12} strokeWidth={3} />}
        </div>
      </div>

      <div className={styles.textWrapper}>
        <span className={styles.name}>{option.name}</span>
        {option.description && (
          <span className={styles.description}>{option.description}</span>
        )}
      </div>
    </button>
  );
}
