'use client';

import React from 'react';
import styles from './DonutChart.module.css';

interface Slice {
  name: string;
  percent: number;
  color: string;
}

interface DonutChartProps {
  slices: Slice[];
}

export default function DonutChart({ slices }: DonutChartProps) {
  // Calcul SVG pour anneau Donut
  const size = 150;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.chartContainer}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.svg}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {slices.map((slice) => {
            const strokeDasharray = `${(slice.percent / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += slice.percent;

            return (
              <circle
                key={slice.name}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={styles.sliceCircle}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className={styles.centerLabel}>
          <span className={styles.totalValue}>100%</span>
          <span className={styles.totalSub}>Partages</span>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {slices.map((slice) => (
          <div key={slice.name} className={styles.legendItem}>
            <span className={styles.bullet} style={{ backgroundColor: slice.color }} />
            <span className={styles.sliceName}>{slice.name}</span>
            <span className={styles.slicePercent}>{slice.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
