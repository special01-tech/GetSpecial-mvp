import React from 'react';
import styles from './Logo.module.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showTagline = false, className = '' }: LogoProps) {
  return (
    <div className={`${styles.logoContainer} ${styles[size]} ${className}`}>
      <div className={styles.iconWrapper}>
        <span className={styles.lettermark}>G</span>
      </div>
      <div className={styles.textWrapper}>
        <span className={styles.brandName}>
          Get<span className={styles.brandAccent}>Special</span>
        </span>
        {showTagline && (
          <span className={styles.tagline}>Hospitality Marketing AI</span>
        )}
      </div>
    </div>
  );
}
