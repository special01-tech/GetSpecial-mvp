import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rend la carte visuellement interactive au survol */
  clickable?: boolean;
  /** Contenu de la carte */
  children: React.ReactNode;
}

/**
 * Conteneur Card.
 *
 * Fond blanc, bordure fine, coins arrondis.
 * Optionnellement `clickable` pour un effet hover.
 */
export default function Card({
  clickable = false,
  children,
  className,
  ...props
}: CardProps) {
  const classes = [
    styles.card,
    clickable ? styles.clickable : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
