import styles from './layout.module.css'

/**
 * Layout des pages d'authentification (login, register).
 * Design centré, sans sidebar ni header.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.authLayout}>
      <div className={styles.authCard}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>G</span>
          <span className={styles.logoText}>GetSpecial</span>
        </div>
        {children}
      </div>
    </div>
  )
}
