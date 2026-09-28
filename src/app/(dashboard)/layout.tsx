import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import styles from './layout.module.css';

/* =============================================================================
 * Dashboard Layout
 *
 * Shell de l'application authentifiée.
 * Desktop : Sidebar à gauche + contenu principal.
 * Mobile  : Header en haut + contenu + BottomNav en bas.
 * ============================================================================= */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <Header />
      <main className={styles.main}>{children}</main>
      <BottomNav />
    </div>
  );
}
