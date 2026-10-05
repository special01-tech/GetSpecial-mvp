'use client';

import React from 'react';
import {
  Tag,
  Clock,
  Send,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  MapPin,
  Share2,
} from 'lucide-react';
import { CampaignData, CampaignPlatform } from '@/services/campaign/campaign.data';
import { useLanguage } from '@/i18n';
import styles from './CampaignDetail.module.css';

interface CampaignDetailProps {
  campaign: CampaignData;
}

export default function CampaignDetail({ campaign }: CampaignDetailProps) {
  const { t } = useLanguage();
  const getPlatformLabel = (p: CampaignPlatform) => {
    switch (p) {
      case 'instagram':
        return 'Instagram';
      case 'facebook':
        return 'Facebook';
      case 'google_business':
        return 'Google Business';
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Image principale de la campagne */}
      <div className={styles.imageCard}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={campaign.imageUrl}
          alt={campaign.title}
          className={styles.mainImage}
        />
        <div className={styles.imageGradient} />

        {/* Badges sur l'image */}
        <div className={styles.imageBadges}>
          <span className={styles.discountBadge}>{campaign.discount}</span>
          <span className={styles.timeSlotBadge}>{campaign.timeSlot}</span>
        </div>
      </div>

      {/* 2. Titre & Description de l'offre */}
      <div className={styles.contentBlock}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{campaign.title}</h2>
        </div>

        <p className={styles.description}>{campaign.description}</p>
      </div>

      {/* 3. Plateformes proposées */}
      <div className={styles.platformsSection}>
        <span className={styles.subHeading}>{t('common.components.campaignDetail.platformsHeading')}</span>
        <div className={styles.pillsList}>
          {campaign.platforms.map((platform) => (
            <div key={platform} className={styles.platformPill}>
              {platform === 'instagram' && (
                <span className={styles.dotInstagram} />
              )}
              {platform === 'facebook' && (
                <span className={styles.dotFacebook} />
              )}
              {platform === 'google_business' && (
                <MapPin size={12} className={styles.pinGoogle} />
              )}
              <span>{getPlatformLabel(platform)}</span>
              <CheckCircle2 size={13} className={styles.checkIcon} />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Explication de l'opportunité */}
      <div className={styles.explanationBlock}>
        <div className={styles.explanationHeader}>
          <Sparkles size={14} className={styles.sparkleIcon} />
          <span>{t('common.components.campaignDetail.whyOpportunity')}</span>
        </div>
        <p className={styles.explanationText}>
          {campaign.opportunityExplanation}
        </p>
      </div>

      {/* 5. Section Heure de publication */}
      <div className={styles.publishTimeCard}>
        <div className={styles.publishHeader}>
          <Clock size={16} className={styles.clockIcon} />
          <span className={styles.publishLabel}>{t('common.components.campaignDetail.publishTimeLabel')}</span>
        </div>
        <div className={styles.timeDisplay}>
          <span className={styles.timeValue}>{campaign.publishTime}</span>
          <span className={styles.timeContext}>{t('common.components.campaignDetail.optimizedContext')}</span>
        </div>
      </div>
    </div>
  );
}
