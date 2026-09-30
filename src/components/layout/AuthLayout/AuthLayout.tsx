import React from 'react';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.screenWrapper}>
      <div className={styles.cardContainer}>
        {children}
      </div>
    </div>
  );
}
