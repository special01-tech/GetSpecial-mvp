import Link from 'next/link';
import { Eye, Heart, TrendingUp, Sparkles } from 'lucide-react';
import { TopContentItem } from '@/services/insights/insights.data';
import styles from './TopContentCard.module.css';

interface TopContentCardProps {
  item: TopContentItem;
}

export default function TopContentCard({ item }: TopContentCardProps) {
  const getPlatformLabel = (p: string) => {
    switch (p) {
      case 'instagram':
        return 'Instagram';
      case 'facebook':
        return 'Facebook';
      case 'google_business':
        return 'Google Business';
      default:
        return p;
    }
  };

  return (
    <Link href={`/dashboard/post/${item.id}`} style={{ textDecoration: 'none' }}>
      <article className={styles.card}>
      {/* Vignette */}
      <div className={styles.imageBox}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt={item.title} className={styles.image} />
        <span className={styles.badgeTop}>Top #1</span>
      </div>

      {/* Contenu */}
      <div className={styles.content}>
        <div className={styles.metaRow}>
          <span className={styles.platformBadge}>
            {getPlatformLabel(item.platform)}
          </span>
          <span className={styles.dateText}>{item.date}</span>
        </div>

        <h3 className={styles.title}>{item.title}</h3>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <Eye size={13} className={styles.statIcon} />
            <span className={styles.statValue}>{item.views}</span>
          </div>

          <div className={styles.statItem}>
            <Heart size={13} className={styles.statIcon} />
            <span className={styles.statValue}>{item.interactions}</span>
          </div>

          <div className={styles.engagementTag}>
            <TrendingUp size={11} />
            <span>{item.engagement}</span>
          </div>
        </div>
      </div>
    </article>
  </Link>
);
}
