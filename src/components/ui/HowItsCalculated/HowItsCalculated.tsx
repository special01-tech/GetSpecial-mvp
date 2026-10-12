import React, { useState } from 'react';
import styles from './HowItsCalculated.module.css';

interface HowItsCalculatedProps {
  title: string;
  formula: string;
  explanation: string;
  example?: string;
}

export const HowItsCalculated: React.FC<HowItsCalculatedProps> = ({
  title,
  formula,
  explanation,
  example,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.toggleBtn}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>Comment est calculé : <strong>{title}</strong> ?</span>
        <span className={styles.chevron}>{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className={styles.content}>
          <div className={styles.formulaBox}>
            <span className={styles.formulaLabel}>Formule :</span>
            <code>{formula}</code>
          </div>
          <p className={styles.explanationText}>{explanation}</p>
          {example && (
            <div className={styles.exampleBox}>
              <strong>Exemple concret :</strong> {example}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
