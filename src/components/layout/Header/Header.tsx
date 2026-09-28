import styles from './Header.module.css';

/**
 * Header — En-tête mobile.
 *
 * Affiche le logo GetSpecial. Visible uniquement sur mobile (< 768px).
 * Sur desktop, la sidebar assure ce rôle.
 */
export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <span className={styles.logo}>GetSpecial</span>
      </div>
    </header>
  );
}
