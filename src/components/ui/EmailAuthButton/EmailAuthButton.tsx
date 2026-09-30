'use client';

import React from 'react';
import { Mail } from 'lucide-react';
import styles from './EmailAuthButton.module.css';

interface EmailAuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function EmailAuthButton({
  children = 'Continuer avec email',
  className = '',
  ...props
}: EmailAuthButtonProps) {
  return (
    <button className={`${styles.emailBtn} ${className}`} {...props}>
      <Mail size={18} strokeWidth={2.2} className={styles.icon} />
      <span className={styles.btnText}>{children}</span>
    </button>
  );
}
