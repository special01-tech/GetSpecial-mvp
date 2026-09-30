'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { Calendar, Sparkles, LucideIcon } from 'lucide-react';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  onButtonClick?: () => void;
  icon?: LucideIcon;
  customIllustration?: ReactNode;
}

export default function EmptyState({
  title = "Rien d'urgent aujourd'hui",
  description = "On reste à l'affût des meilleures opportunités pour votre restaurant.",
  buttonText = 'Voir le planning',
  buttonHref = '/dashboard/planning',
  onButtonClick,
  customIllustration,
}: EmptyStateProps) {
  return (
    <div className={styles.emptyContainer}>
      {/* Illustration Restaurant / Table */}
      <div className={styles.illustrationWrapper}>
        {customIllustration || (
          <div className={styles.restaurantTableVisual}>
            <svg
              width="140"
              height="110"
              viewBox="0 0 140 110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.svgGraphic}
              aria-hidden="true"
            >
              {/* Ombre douce au sol */}
              <ellipse cx="70" cy="98" rx="55" ry="8" fill="#E8ECE9" />

              {/* Table de restaurant */}
              <ellipse cx="70" cy="55" rx="46" ry="14" fill="#2D6A4F" />
              <ellipse cx="70" cy="52" rx="44" ry="12" fill="#1B4332" />
              <path
                d="M66 58 L66 94 Q66 96 70 96 Q74 96 74 94 L74 58 Z"
                fill="#2D6A4F"
              />
              <path
                d="M50 96 L90 96 Q92 98 90 100 L50 100 Q48 98 50 96 Z"
                fill="#1B4332"
              />

              {/* Fauteuil / Chaise gauche */}
              <path
                d="M26 40 Q26 30 32 30 Q38 30 38 40 L38 68 L26 68 Z"
                fill="#B7E4C7"
              />
              <line x1="30" y1="68" x2="26" y2="92" stroke="#52B788" strokeWidth="3" strokeLinecap="round" />
              <line x1="34" y1="68" x2="38" y2="92" stroke="#52B788" strokeWidth="3" strokeLinecap="round" />

              {/* Fauteuil / Chaise droite */}
              <path
                d="M102 40 Q102 30 108 30 Q114 30 114 40 L114 68 L102 68 Z"
                fill="#B7E4C7"
              />
              <line x1="106" y1="68" x2="102" y2="92" stroke="#52B788" strokeWidth="3" strokeLinecap="round" />
              <line x1="110" y1="68" x2="114" y2="92" stroke="#52B788" strokeWidth="3" strokeLinecap="round" />

              {/* Petit vase et fleur au centre de la table */}
              <path
                d="M67 48 L68 40 L72 40 L73 48 Z"
                fill="#FAFAF7"
                stroke="#D8F3DC"
                strokeWidth="1"
              />
              <circle cx="70" cy="36" r="3" fill="#D8F3DC" />
              <circle cx="70" cy="33" r="2.5" fill="#FAFAF7" />

              {/* Étincelle IA bienveillante */}
              <circle cx="95" cy="22" r="1.5" fill="#52B788" />
              <path
                d="M95 16 L96 20 L100 21 L96 22 L95 26 L94 22 L90 21 L94 20 Z"
                fill="#52B788"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Titre & Description */}
      <div className={styles.textGroup}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>

      {/* Bouton d'action principal */}
      <div className={styles.actionWrapper}>
        {buttonHref ? (
          <Link href={buttonHref} className={styles.buttonLink}>
            <Calendar size={16} />
            <span>{buttonText}</span>
          </Link>
        ) : (
          <PrimaryButton onClick={onButtonClick} icon={<Calendar size={16} />}>
            {buttonText}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
