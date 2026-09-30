'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, X, Clock, Percent, Share2 } from 'lucide-react';
import { CampaignData } from '@/services/campaign/campaign.data';
import styles from './ChatCampaignCard.module.css';

interface ChatCampaignCardProps {
  campaign: CampaignData;
  status?: 'pending' | 'accepted' | 'rejected' | 'scheduled';
  onReject: () => void;
}

export default function ChatCampaignCard({
  campaign,
  status = 'pending',
  onReject,
}: ChatCampaignCardProps) {
  return (
    <div className={styles.card}>
      {/* Badge Top Header */}
      <div className={styles.header}>
        <div className={styles.badge}>
          <Sparkles size={13} className={styles.sparkleIcon} />
          <span>Opportunité détectée</span>
        </div>
        <span className={styles.discountPill}>
          <Percent size={11} strokeWidth={2.5} />
          {campaign.discount}
        </span>
      </div>

      {/* Image & Titre */}
      <div className={styles.contentRow}>
        <div className={styles.imageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className={styles.image}
          />
        </div>

        <div className={styles.details}>
          <h4 className={styles.title}>{campaign.title}</h4>
          <p className={styles.description}>{campaign.description}</p>
          <div className={styles.metaRow}>
            <span className={styles.period}>
              <Clock size={12} />
              {campaign.timeSlot}
            </span>
          </div>
        </div>
      </div>

      {/* Plateformes suggérées */}
      <div className={styles.platformsRow}>
        <span className={styles.platformLabel}>Diffusion :</span>
        <div className={styles.platformTags}>
          {campaign.platforms.map((plat) => {
            const labels: Record<string, string> = {
              instagram: 'Instagram',
              facebook: 'Facebook',
              google_business: 'Google Business',
            };
            return (
              <span key={plat} className={styles.platformBadge}>
                {labels[plat] || plat}
              </span>
            );
          })}
        </div>
      </div>

      {/* Statut si refusé ou accepté */}
      {status === 'rejected' && (
        <div className={styles.statusBannerRejected}>
          <span>Campagne refusée</span>
        </div>
      )}

      {status === 'scheduled' && (
        <div className={styles.statusBannerScheduled}>
          <span>Publication programmée pour ce soir à 18h</span>
        </div>
      )}

      {/* Actions (Voir le détail & Refuser) */}
      {status === 'pending' && (
        <div className={styles.actionsRow}>
          <Link
            href={`/dashboard/campaign/${campaign.id}`}
            className={styles.detailLink}
          >
            <span>Voir le détail</span>
            <ArrowRight size={14} />
          </Link>

          <button
            type="button"
            onClick={onReject}
            className={styles.rejectButton}
          >
            <X size={14} />
            <span>Refuser</span>
          </button>
        </div>
      )}
    </div>
  );
}
