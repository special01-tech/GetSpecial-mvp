'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/ui/Logo/Logo';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useLanguage } from '@/i18n';
import {
  Sparkles,
  MessageSquare,
  Calendar,
  Store,
  Settings,
  BarChart3,
  PenTool,
  LucideIcon,
} from 'lucide-react';
import styles from './Sidebar.module.css';

/** Élément de navigation dans la sidebar */
interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

/** Liens de navigation principaux */
const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.today', href: '/dashboard', icon: Sparkles },
  { labelKey: 'nav.studio', href: '/dashboard/create', icon: PenTool },
  { labelKey: 'nav.chat', href: '/dashboard/chat', icon: MessageSquare },
  { labelKey: 'nav.planning', href: '/dashboard/planning', icon: Calendar },
  { labelKey: 'nav.restaurant', href: '/dashboard/restaurant', icon: Store },
  { labelKey: 'nav.settings', href: '/dashboard/settings', icon: Settings },
];

/** Lien secondaire (bas de sidebar) */
const BOTTOM_ITEMS: NavItem[] = [
  { labelKey: 'nav.analytics', href: '/dashboard/insights', icon: BarChart3 },
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
  const { t } = useLanguage();

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
        <Logo size="sm" />
      </div>

      {/* Navigation principale */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={linkClasses(item.href)}>
              <span className={styles.navIcon}>
                <Icon size={18} strokeWidth={2} />
              </span>
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Navigation secondaire (Aide) */}
      <div className={styles.navBottom}>
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={linkClasses(item.href)}>
              <span className={styles.navIcon}>
                <Icon size={18} strokeWidth={2} />
              </span>
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
        <div className={styles.localeRow}>
          <LanguageToggle />
        </div>
      </div>
    </aside>
  );
}
