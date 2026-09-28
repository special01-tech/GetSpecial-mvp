import styles from './Badge.module.css';

/** Variantes sémantiques du badge */
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  /** Variante visuelle (défaut: 'default') */
  variant?: BadgeVariant;
  /** Texte du badge */
  children: React.ReactNode;
}

/**
 * Badge de statut.
 *
 * Petit indicateur coloré pour catégoriser ou signaler un état.
 */
export default function Badge({
  variant = 'default',
  children,
}: BadgeProps) {
  const classes = [styles.badge, styles[variant]].join(' ');

  return <span className={classes}>{children}</span>;
}
