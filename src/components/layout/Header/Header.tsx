'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LanguageToggle from '@/components/ui/LanguageToggle';
import styles from './Header.module.css';

/**
 * Header — En-tête mobile moderne et élégant.
 *
 * Affiche le logo GetSpecial, le restaurant actif et la bascule de langue.
 * Visible uniquement sur mobile (< 768px).
 */
export default function Header() {
  const [restaurantName, setRestaurantName] = useState("L'Atelier Culinaire");

  useEffect(() => {
    try {
      const stored = localStorage.getItem('getspecial_selected_restaurant');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setRestaurantName(parsed.name);
      }
    } catch {}
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/dashboard" className={styles.brandLink}>
          <div className={styles.logoBadge}>GS</div>
          <div className={styles.brandInfo}>
            <span className={styles.logo}>GetSpecial</span>
            <span className={styles.restaurantSubtext}>{restaurantName}</span>
          </div>
        </Link>
        <div className={styles.headerRight}>
          <LanguageToggle compact />
        </div>
      </div>
    </header>
  );
}
