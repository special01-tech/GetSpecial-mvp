'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, Calendar, Store, MoreHorizontal, LucideIcon } from 'lucide-react';
import styles from './BottomNavigation.module.css';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Dashboard', href: '/dashboard', icon: Home },
  { id: 'chat', label: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { id: 'planning', label: 'Planning', href: '/dashboard/planning', icon: Calendar },
  { id: 'restaurant', label: 'Restaurant', href: '/dashboard/restaurant', icon: Store },
  { id: 'more', label: 'More', href: '/dashboard/more', icon: MoreHorizontal },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className={styles.navBar} aria-label="Navigation principale mobile">
      <div className={styles.navContainer}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : item.href === '/dashboard/more'
              ? pathname.startsWith('/dashboard/more') || pathname.startsWith('/dashboard/rules')
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <div className={styles.iconWrapper}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
