'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';

/** Élément de navigation mobile */
interface NavItem {
  label: string;
  href: string;
  icon: string;
}

/** Liens de navigation mobile — conformes aux maquettes */
const NAV_ITEMS: NavItem[] = [
  { label: "Aujourd'hui", href: '/dashboard', icon: '📅' },
  { label: 'Idées', href: '/ideas', icon: '💡' },
  { label: 'Créer', href: '/create', icon: '✍️' },
  { label: 'Publications', href: '/publications', icon: '📣' },
  { label: 'Plus', href: '/restaurant', icon: '⚙️' },
];

/**
 * BottomNav — Navigation mobile en bas d'écran.
 *
 * Visible uniquement sur mobile (< 768px).
 * Utilise le pathname pour mettre en surbrillance le lien actif.
 */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNav}>
      <ul className={styles.navList}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const classes = [
            styles.navLink,
            isActive ? styles.navLinkActive : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li key={item.href}>
              <Link href={item.href} className={classes}>
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
