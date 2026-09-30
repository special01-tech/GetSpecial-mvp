'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { MOCK_RESTAURANT } from '@/lib/mock-data';
import styles from './Header.module.css';

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string;
  } | null;
  restaurant?: {
    name: string;
    subtitle: string;
  } | null;
}

export default function Header({ user, restaurant }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const restaurantName = restaurant?.name || MOCK_RESTAURANT.name;
  const restaurantSubtitle = restaurant?.subtitle || MOCK_RESTAURANT.subtitle;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Erreur déconnexion:', err);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className={styles.header}>
      {/* Mobile brand (hidden on desktop) */}
      <div className={styles.mobileBrand}>
        <div className={styles.mobileLogoBadge}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#FF5C00" strokeWidth="2.5" strokeDasharray="50 15" />
            <circle cx="12" cy="12" r="4" fill="#FF5C00" />
          </svg>
        </div>
        <span className={styles.brandTitle}>GetSpecial</span>
      </div>

      {/* Right section with notifications & restaurant profile */}
      <div className={styles.rightSection}>
        {/* Notification Bell */}
        <div className={styles.relativeBox}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setMenuOpen(false);
            }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className={styles.notifBadge} />
          </button>

          {notificationsOpen && (
            <div className={styles.dropdownPanel}>
              <div className={styles.panelHeader}>
                <span>Notifications</span>
                <span className={styles.unreadCount}>1 nouvelle</span>
              </div>
              <div className={styles.notifItem}>
                <CheckCircle2 size={16} color="#22C55E" />
                <div>
                  <p className={styles.notifTitle}>Publication Happy Hour programmée</p>
                  <span className={styles.notifTime}>Il y a 10 min</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Restaurant profile selector */}
        <div className={styles.relativeBox}>
          <button
            type="button"
            className={styles.profileBtn}
            onClick={() => {
              setMenuOpen(!menuOpen);
              setNotificationsOpen(false);
            }}
          >
            <div className={styles.avatar}>
              <img
                src={MOCK_RESTAURANT.avatar}
                alt={restaurantName}
                className={styles.avatarImg}
              />
            </div>
            <div className={styles.restaurantInfo}>
              <span className={styles.restaurantName}>{restaurantName}</span>
              <span className={styles.restaurantMeta}>{restaurantSubtitle}</span>
            </div>
            <ChevronDown size={14} className={styles.chevron} />
          </button>

          {menuOpen && (
            <div className={`${styles.dropdownPanel} ${styles.profileDropdown}`}>
              <div className={styles.profileSummary}>
                <p className={styles.summaryName}>{user?.name || restaurantName}</p>
                <p className={styles.summaryEmail}>{user?.email || 'contact@lecomptoir.fr'}</p>
              </div>
              <div className={styles.divider} />
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={styles.dropdownAction}
              >
                <LogOut size={15} color="#EF4444" />
                <span>{isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
