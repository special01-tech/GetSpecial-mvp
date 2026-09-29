'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Lightbulb, PlusCircle, Send, BarChart2, Store } from 'lucide-react';
import styles from './BottomNav.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Aujourd'hui", href: '/dashboard', icon: Home },
  { label: 'Idées', href: '/idees', icon: Lightbulb },
  { label: 'Créer', href: '/creer', icon: PlusCircle },
  { label: 'Posts', href: '/publications', icon: Send },
  { label: 'Stats', href: '/performances', icon: BarChart2 },
  { label: 'Resto', href: '/etablissement', icon: Store },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className={styles.bottomNav} aria-label="Navigation mobile">
      <ul className={styles.navList}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isLinkActive(item.href);
          return (
            <li key={item.href} className={styles.navItemWrapper}>
              <Link
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                <Icon size={18} />
                <span className={styles.label}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
