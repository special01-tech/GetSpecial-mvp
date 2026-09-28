import styles from './Button.module.css';

/** Variantes visuelles du bouton */
type ButtonVariant = 'primary' | 'secondary' | 'ghost';

/** Tailles disponibles */
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visuelle (défaut: 'primary') */
  variant?: ButtonVariant;
  /** Taille du bouton (défaut: 'md') */
  size?: ButtonSize;
  /** Prend toute la largeur du parent */
  fullWidth?: boolean;
  /** Contenu du bouton */
  children: React.ReactNode;
}

/**
 * Bouton réutilisable.
 *
 * Supporte 3 variantes (primary, secondary, ghost) et 3 tailles (sm, md, lg).
 * Toutes les props HTML <button> sont supportées via le spread.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className,
  ...props
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
