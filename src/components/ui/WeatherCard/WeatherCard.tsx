'use client';

import React from 'react';
import { Sun, CloudSun, CloudRain, Cloud } from 'lucide-react';
import { WeatherData } from '@/services/today/today.data';
import styles from './WeatherCard.module.css';

interface WeatherCardProps {
  weather?: WeatherData | null;
  loading?: boolean;
}

export default function WeatherCard({ weather, loading }: WeatherCardProps) {
  if (!weather || loading) {
    return (
      <div className={styles.card} style={{ minHeight: 110, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F1F5F9', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: 60, height: 24, borderRadius: 6, background: '#F1F5F9', animation: 'pulse 1.5s infinite' }} />
        </div>
        <div style={{ width: '80%', height: 14, borderRadius: 4, background: '#F1F5F9', marginBottom: 6, animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '50%', height: 10, borderRadius: 4, background: '#F8FAFC', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  const unit = (weather.tempUnit || 'F').replace('°', '');
  const iconType = weather.iconType || 'sun';

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <div
          className={styles.iconCircle}
          style={{
            backgroundColor:
              iconType === 'rain'
                ? '#E0F2FE'
                : iconType === 'cloud'
                ? '#F1F5F9'
                : '#FEF3C7',
          }}
        >
          {iconType === 'rain' ? (
            <CloudRain size={22} color="#0284C7" />
          ) : iconType === 'cloud' ? (
            <Cloud size={22} color="#64748B" />
          ) : iconType === 'cloud-sun' ? (
            <CloudSun size={22} color="#D97706" />
          ) : (
            <Sun size={22} className={styles.sunIcon} />
          )}
        </div>
        <div className={styles.tempBadge}>
          <span className={styles.tempValue}>{weather.temperature ?? weather.tempFahrenheit}°</span>
          <span className={styles.tempUnit}>{unit}</span>
        </div>
      </div>

      <div className={styles.infoArea}>
        <span className={styles.conditionTitle}>{weather.condition}</span>
        <p className={styles.advice}>{weather.terraceAdvice}</p>
      </div>
    </div>
  );
}
