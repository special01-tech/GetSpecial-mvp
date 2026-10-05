'use client';

import React from 'react';
import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  Users,
  Calendar,
} from 'lucide-react';
import { DetailedPostStats } from '@/services/insights/post-insights.data';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import { useLanguage } from '@/i18n';
import styles from './PostInsights.module.css';

interface PostInsightsProps {
  post: DetailedPostStats;
  onViewPost?: () => void;
}

export default function PostInsights({ post, onViewPost }: PostInsightsProps) {
  const { t } = useLanguage();
  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'Instagram';
      case 'facebook':
        return 'Facebook';
      case 'google_business':
        return 'Google Business';
      default:
        return platform;
    }
  };

  const handleOpenOriginalPost = () => {
    if (onViewPost) {
      onViewPost();
    } else {
      window.open(post.postUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Carte En-tête : Image, Titre, Date, Plateforme */}
      <div className={styles.heroCard}>
        <div className={styles.imageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt={post.title} className={styles.image} />
          <span className={styles.platformBadge}>
            {getPlatformLabel(post.platform)}
          </span>
        </div>

        <div className={styles.heroContent}>
          <div className={styles.dateRow}>
            <Calendar size={13} className={styles.calendarIcon} />
            <span>{post.date}</span>
          </div>

          <h2 className={styles.title}>{post.title}</h2>

          <div className={styles.viewPostBtnWrapper}>
            <button
              type="button"
              onClick={handleOpenOriginalPost}
              className={styles.viewPostBtn}
            >
              <span>{t('common.components.postInsights.viewPost')}</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Statistiques Principales (4 métriques) */}
      <section className={styles.sectionBlock}>
        <h3 className={styles.sectionHeading}>{t('common.components.postInsights.statsHeading')}</h3>

        <div className={styles.statsGrid}>
          {/* 2 421 vues */}
          <div className={styles.statBox}>
            <div className={`${styles.iconCircle} ${styles.iconViews}`}>
              <Eye size={18} />
            </div>
            <div className={styles.statNumbers}>
              <span className={styles.statValue}>
                {post.views.toLocaleString('fr-FR')}
              </span>
              <span className={styles.statLabel}>{t('common.components.postInsights.viewsLabel')}</span>
            </div>
          </div>

          {/* 180 likes */}
          <div className={styles.statBox}>
            <div className={`${styles.iconCircle} ${styles.iconLikes}`}>
              <Heart size={18} />
            </div>
            <div className={styles.statNumbers}>
              <span className={styles.statValue}>
                {post.likes.toLocaleString('fr-FR')}
              </span>
              <span className={styles.statLabel}>{t('common.components.postInsights.likesLabel')}</span>
            </div>
          </div>

          {/* 24 commentaires */}
          <div className={styles.statBox}>
            <div className={`${styles.iconCircle} ${styles.iconComments}`}>
              <MessageCircle size={18} />
            </div>
            <div className={styles.statNumbers}>
              <span className={styles.statValue}>{post.comments}</span>
              <span className={styles.statLabel}>{t('common.components.postInsights.commentsLabel')}</span>
            </div>
          </div>

          {/* 12 partages */}
          <div className={styles.statBox}>
            <div className={`${styles.iconCircle} ${styles.iconShares}`}>
              <Share2 size={18} />
            </div>
            <div className={styles.statNumbers}>
              <span className={styles.statValue}>{post.shares}</span>
              <span className={styles.statLabel}>{t('common.components.postInsights.sharesLabel')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section Démographie (Hommes/Femmes & Tranches d'âge) */}
      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.titleWithIcon}>
            <Users size={17} className={styles.usersIcon} />
            <h3 className={styles.sectionHeading}>{t('common.components.postInsights.demographicsHeading')}</h3>
          </div>
          <span className={styles.badgeAudience}>{t('common.components.postInsights.audienceBadge')}</span>
        </div>

        <div className={styles.demographicsCard}>
          {/* Répartition Hommes / Femmes */}
          <div className={styles.genderBlock}>
            <div className={styles.genderHeader}>
              <span className={styles.subHeading}>{t('common.components.postInsights.genderHeading')}</span>
              <span className={styles.genderRatioText}>
                {t('common.components.postInsights.genderRatio', {
                  women: post.demographics.gender.women,
                  men: post.demographics.gender.men,
                })}
              </span>
            </div>

            {/* Barre visuelle Hommes / Femmes */}
            <div className={styles.genderBarTrack}>
              <div
                className={styles.womenSegment}
                style={{ width: `${post.demographics.gender.women}%` }}
                title={t('common.components.postInsights.womenTitle', {
                  pct: post.demographics.gender.women,
                })}
              />
              <div
                className={styles.menSegment}
                style={{ width: `${post.demographics.gender.men}%` }}
                title={t('common.components.postInsights.menTitle', {
                  pct: post.demographics.gender.men,
                })}
              />
            </div>

            <div className={styles.genderLegend}>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotWomen}`} />
                <span>
                  {t('common.components.postInsights.womenLegend', {
                    pct: post.demographics.gender.women,
                  })}
                </span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotMen}`} />
                <span>
                  {t('common.components.postInsights.menLegend', {
                    pct: post.demographics.gender.men,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Tranches d'âge */}
          <div className={styles.ageBlock}>
            <span className={styles.subHeading}>{t('common.components.postInsights.ageRangesHeading')}</span>

            <div className={styles.ageBarsList}>
              {post.demographics.ageRanges.map((age) => (
                <div key={age.range} className={styles.ageRow}>
                  <span className={styles.ageRangeLabel}>{age.range}</span>

                  <div className={styles.ageBarTrack}>
                    <div
                      className={styles.ageBarFill}
                      style={{ width: `${age.percentage}%` }}
                    />
                  </div>

                  <span className={styles.agePercentLabel}>{age.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
