import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label affiché au-dessus du champ */
  label?: string;
  /** Message d'erreur affiché sous le champ */
  error?: string;
}

/**
 * Champ de saisie texte.
 *
 * Supporte label, placeholder, état d'erreur.
 * Toutes les props HTML <input> sont supportées via le spread.
 */
export default function Input({
  label,
  error,
  id,
  className,
  ...props
}: InputProps) {
  const inputClasses = [
    styles.input,
    error ? styles.inputError : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input id={id} className={inputClasses} {...props} />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
