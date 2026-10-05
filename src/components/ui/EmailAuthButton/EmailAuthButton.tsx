'use client';

import React from 'react';
import { Mail } from 'lucide-react';
import { useLanguage } from '@/i18n';
import styles from './EmailAuthButton.module.css';

interface EmailAuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function EmailAuthButton({
  children,
  className = '',
  ...props
}: EmailAuthButtonProps) {
  const { t } = useLanguage();
  const resolvedChildren =
    children ?? t('common.components.emailAuthButton.defaultLabel');
  return (
    <button className={`${styles.emailBtn} ${className}`} {...props}>
      <Mail size={18} strokeWidth={2.2} className={styles.icon} />
      <span className={styles.btnText}>{resolvedChildren}</span>
    </button>
  );
}
