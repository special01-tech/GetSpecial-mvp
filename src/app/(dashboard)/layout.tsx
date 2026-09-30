import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { getAuthUser, getCurrentRestaurant } from '@/server/lib/auth';
import styles from './layout.module.css';

/* =============================================================================
 * Dashboard Layout — Dark SaaS Shell
 * ============================================================================= */

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthUser();

  const user = auth?.dbUser
    ? {
        name: auth.dbUser.name,
        email: auth.dbUser.email,
      }
    : auth?.supabaseUser
    ? {
        name: (auth.supabaseUser.user_metadata?.name as string) || null,
        email: auth.supabaseUser.email,
      }
    : null;

  let currentRestaurant = null;
  if (auth?.dbUser) {
    try {
      const rest = await getCurrentRestaurant();
      if (rest) {
        currentRestaurant = {
          name: rest.name,
          subtitle: `${rest.type || 'Restaurant'} • 1 min`,
        };
      }
    } catch {
      // Fallback silencieux sur mock
    }
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.contentWrapper}>
        <Header user={user} restaurant={currentRestaurant} />
        <main className={styles.main}>{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
