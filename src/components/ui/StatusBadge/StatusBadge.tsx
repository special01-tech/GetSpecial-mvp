'use client';

import React from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { PlanningStatus, PLANNING_STATUS_LABELS } from '@/services/planning/planning.data';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: PlanningStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getIcon = () => {
    switch (status) {
      case 'programmed':
        return <Clock size={size === 'sm' ? 11 : 13} />;
      case 'approved':
        return <CheckCircle2 size={size === 'sm' ? 11 : 13} />;
      case 'to_validate':
        return <AlertCircle size={size === 'sm' ? 11 : 13} />;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'programmed':
        return styles.statusProgrammed;
      case 'approved':
        return styles.statusApproved;
      case 'to_validate':
        return styles.statusToValidate;
    }
  };

  return (
    <span
      className={`${styles.badge} ${getStatusClass()} ${
        size === 'sm' ? styles.badgeSm : styles.badgeMd
      }`}
    >
      {getIcon()}
      <span>{PLANNING_STATUS_LABELS[status]}</span>
    </span>
  );
}
