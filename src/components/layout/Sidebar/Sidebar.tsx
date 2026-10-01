'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  MessageSquare,
  Calendar,
  Store,
  Settings,
  BarChart3,
  LucideIcon,
} from 'lucide-react';
import styles from './Sidebar.module.css';

/** Élément de navigation dans la sidebar */
interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Liens de navigation principaux */
const NAV_ITEMS: NavItem[] = [
  { label: 'Today', href: '/dashboard', icon: Sparkles },
  { label: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { label: 'Planning', href: '/dashboard/planning', icon: Calendar },
  { label: 'Restaurant', href: '/dashboard/restaurant', icon: Store },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

/** Lien secondaire (bas de sidebar) */
const BOTTOM_ITEMS: NavItem[] = [
  { label: 'Analytics', href: '/dashboard/insights', icon: BarChart3 },
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
  const linkClasses = (href: string) => {
    const isActive =
      href === '/dashboard'
        ? pathname === '/dashboard'
        : pathname.startsWith(href);
    return [styles.navLink, isActive ? styles.navLinkActive : '']
      .filter(Boolean)
      .join(' ');
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>G</span>
        <span>GetSpecial</span>
      </div>

      {/* Navigation principale */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href} className={linkClasses(item.href)}>
              <span className={styles.navIcon}>
                <Icon size={18} strokeWidth={2} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Navigation secondaire (Aide) */}
      <div className={styles.navBottom}>
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href} className={linkClasses(item.href)}>
              <span className={styles.navIcon}>
                <Icon size={18} strokeWidth={2} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
