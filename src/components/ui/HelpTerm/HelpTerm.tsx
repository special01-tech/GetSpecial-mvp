import React, { useState } from 'react';
import { GLOSSARY, HelpTermKey } from '@/content/glossary.fr';
import styles from './HelpTerm.module.css';

interface HelpTermProps {
  term: HelpTermKey;
  children?: React.ReactNode;
}

export const HelpTerm: React.FC<HelpTermProps> = ({ term, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const def = GLOSSARY[term];

  if (!def) {
    return <span>{children || term}</span>;
  }

  return (
    <span className={styles.wrapper}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Définition de ${def.term}`}
      >
        {children || def.term}
        <span className={styles.icon}>?</span>
      </button>

      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.header}>
            <strong>{def.term}</strong>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>
          <p className={styles.definition}>{def.definition}</p>
          {def.formula && (
            <div className={styles.formula}>
              <code>{def.formula}</code>
            </div>
          )}
          {def.example && (
            <p className={styles.example}>
              <em>Exemple :</em> {def.example}
            </p>
          )}
        </div>
      )}
    </span>
  );
};
