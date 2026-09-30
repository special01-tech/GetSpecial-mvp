'use client';

import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import styles from './SettingsSection.module.css';

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
}

export default function SettingsSection({
  title,
  description,
  icon: Icon,
  action,
  children,
}: SettingsSectionProps) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          {Icon && (
            <div className={styles.iconBox}>
              <Icon size={16} />
            </div>
          )}
          <div>
            <h2 className={styles.title}>{title}</h2>
            {description && <p className={styles.description}>{description}</p>}
          </div>
        </div>
        {action && <div className={styles.actionSlot}>{action}</div>}
      </div>

      <div className={styles.body}>{children}</div>
    </section>
  );
}
