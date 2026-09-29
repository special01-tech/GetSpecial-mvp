'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Lightbulb, 
  PlusCircle, 
  Send, 
  BarChart2, 
  Store, 
  HelpCircle 
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const PRIMARY_NAV: NavItem[] = [
  { label: "Aujourd'hui", href: '/dashboard', icon: Home },
  { label: 'Idées', href: '/idees', icon: Lightbulb },
  { label: 'Créer', href: '/creer', icon: PlusCircle },
  { label: 'Publications', href: '/publications', icon: Send },
  { label: 'Performances', href: '/performances', icon: BarChart2 },
];

const SECONDARY_NAV: NavItem[] = [
  { label: 'Mon restaurant', href: '/etablissement', icon: Store },
  { label: 'Aide', href: '#aide', icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={styles.sidebar}>
      {/* Brand Header */}
      <div className={styles.brand}>
        <div className={styles.logoBadge}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#FF5C00" strokeWidth="2.5" strokeDasharray="50 15" />
            <circle cx="12" cy="12" r="4" fill="#FF5C00" />
          </svg>
        </div>
        <span className={styles.brandName}>GetSpecial</span>
      </div>

      {/* Main Navigation */}
      <nav className={styles.navGroup} aria-label="Navigation principale">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const active = isLinkActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
            >
              <Icon size={17} className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className={styles.spacer} />

      {/* Secondary Navigation */}
      <div className={styles.secondaryGroup}>
        {SECONDARY_NAV.map((item) => {
          const Icon = item.icon;
          const active = isLinkActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
            >
              <Icon size={17} className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
