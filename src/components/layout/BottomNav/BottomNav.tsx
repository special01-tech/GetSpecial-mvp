'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  MessageSquare,
  Calendar,
  Store,
  PenTool,
  MoreHorizontal,
  LucideIcon,
} from 'lucide-react';
import styles from './BottomNav.module.css';

/** Élément de navigation mobile */
interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Liens de navigation mobile conformes à la maquette */
const NAV_ITEMS: NavItem[] = [
  { label: 'Today', href: '/dashboard', icon: Home },
  { label: 'Studio', href: '/dashboard/create', icon: PenTool },
  { label: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { label: 'Planning', href: '/dashboard/planning', icon: Calendar },
  { label: 'Restaurant', href: '/dashboard/restaurant', icon: Store },
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
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          const classes = [
            styles.navLink,
            isActive ? styles.navLinkActive : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li key={item.label}>
              <Link href={item.href} className={classes}>
                <span className={styles.navIcon}>
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
