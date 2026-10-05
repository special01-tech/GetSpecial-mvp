import React from 'react';
import styles from './Logo.module.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

/**
 * Pictogramme GetSpecial : un « C » ouvert, un point central et deux ondes
 * (signal / diffusion). Dessiné en SVG pour rester net à toutes les tailles.
 * La couleur d'icône est toujours l'Orange GetSpecial ; le texte suit le thème
 * (noir sur fond clair, blanc sur fond sombre).
 */
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 56 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="GetSpecial"
    >
      <path
        d="M44.7 15.65A22 22 0 1 0 44.7 48.35"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <rect x="23" y="27" width="14" height="10" rx="5" fill="currentColor" />
      <path
        d="M43.3 27.1A8 8 0 0 1 43.3 36.9"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M47.6 23.7A13.5 13.5 0 0 1 47.6 40.3"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({ size = 'md', showTagline = false, className = '' }: LogoProps) {
  return (
    <div className={`${styles.logoContainer} ${styles[size]} ${className}`}>
      <LogoMark className={styles.mark} />
      <div className={styles.textWrapper}>
        <span className={styles.brandName}>GetSpecial</span>
        {showTagline && (
          <span className={styles.tagline}>Hospitality Marketing AI</span>
        )}
      </div>
    </div>
  );
}
