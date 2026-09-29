import React from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Clock } from 'lucide-react';
import styles from './SocialPostPreview.module.css';

interface SocialPostPreviewProps {
  ideaTitle?: string;
  promoText?: string;
  description?: string;
  hours?: string;
  imageUrl?: string;
}

export default function SocialPostPreview({
  ideaTitle = 'HAPPY HOUR',
  promoText = '-30% sur tous les cocktails',
  description = 'Une bonne raison de passer nous voir ce soir ! Venez déguster nos créations signatures à prix doux.',
  hours = '17h → 20h',
  imageUrl = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=700&q=80',
}: SocialPostPreviewProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>Aperçu de la publication</h3>

      <div className={styles.phoneFrame}>
        {/* Post Header */}
        <div className={styles.postHeader}>
          <div className={styles.authorGroup}>
            <div className={styles.avatar}>LC</div>
            <div className={styles.authorMeta}>
              <span className={styles.authorName}>Le Comptoir</span>
              <span className={styles.authorSub}>Restaurant</span>
            </div>
          </div>
          <button type="button" className={styles.moreBtn} aria-label="Options">
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Media with Graphic Overlay */}
        <div className={styles.mediaContainer}>
          <img src={imageUrl} alt={ideaTitle} className={styles.mediaImg} />

          {/* Overlay text graphic */}
          <div className={styles.graphicOverlay}>
            <span className={styles.badgePromo}>{ideaTitle.toUpperCase()}</span>
            <div className={styles.promoBigText}>
              {promoText.startsWith('-') ? (
                <>
                  <span className={styles.percentText}>{promoText.split(' ')[0]}</span>
                  <span className={styles.subPromoText}>{promoText.split(' ').slice(1).join(' ')}</span>
                </>
              ) : (
                promoText
              )}
            </div>
            {hours && (
              <div className={styles.hoursBadge}>
                <Clock size={12} />
                <span>{hours}</span>
              </div>
            )}
          </div>
        </div>

        {/* Social actions bar */}
        <div className={styles.actionsBar}>
          <div className={styles.leftActions}>
            <Heart size={18} className={styles.actionIcon} />
            <MessageCircle size={18} className={styles.actionIcon} />
            <Send size={18} className={styles.actionIcon} />
          </div>
          <Bookmark size={18} className={styles.actionIcon} />
        </div>

        {/* Caption text */}
        <div className={styles.captionBox}>
          <p className={styles.captionText}>{description}</p>
          <div className={styles.hashtags}>
            <span>#HappyHour</span> <span>#LeComptoir</span> <span>#Cocktails</span>
          </div>
        </div>
      </div>
    </div>
  );
}
