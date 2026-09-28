'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

/** Élément de navigation dans la sidebar */
interface NavItem {
  /** Label affiché */
  label: string;
  /** Route Next.js */
  href: string;
  /** Emoji (sera remplacé par de vraies icônes SVG plus tard) */
  icon: string;
}

/** Liens de navigation principaux — conformes aux maquettes */
const NAV_ITEMS: NavItem[] = [
  { label: "Aujourd'hui", href: '/dashboard', icon: '📅' },
  { label: 'Idées', href: '/ideas', icon: '💡' },
  { label: 'Créer', href: '/create', icon: '✍️' },
  { label: 'Publications', href: '/publications', icon: '📣' },
  { label: 'Performances', href: '/performance', icon: '📊' },
  { label: 'Mon restaurant', href: '/restaurant', icon: '🏪' },
];

/** Lien secondaire (bas de sidebar) */
const BOTTOM_ITEMS: NavItem[] = [
  { label: 'Aide', href: '/help', icon: '❓' },
];

/**
 * Sidebar — Navigation latérale desktop.
 *
 * Affiche le logo GetSpecial, les liens de navigation principaux,
 * et un lien "Aide" en bas. Le lien actif est mis en surbrillance orange.
 * Masquée sur mobile (< 768px).
 */
export default function Sidebar() {
  const pathname = usePathname();

  /** Construit les classes CSS d'un lien selon son état actif */
  const linkClasses = (href: string) =>
    [styles.navLink, pathname.startsWith(href) ? styles.navLinkActive : '']
      .filter(Boolean)
      .join(' ');

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>G</span>
        <span>GetSpecial</span>
      </div>

      {/* Navigation principale */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={linkClasses(item.href)}>
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Navigation secondaire (Aide) */}
      <div className={styles.navBottom}>
        {BOTTOM_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={linkClasses(item.href)}>
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
