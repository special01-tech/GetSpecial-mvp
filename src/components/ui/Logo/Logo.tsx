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
    <img
      src="/logo.png"
      alt="GetSpecial"
      className={className}
      style={{ objectFit: 'contain' }}
    />
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
