'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  MapPin,
  Clock,
  Share2,
  Cpu,
  Sliders,
  ExternalLink,
  Edit2,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { MOCK_RESTAURANT } from '@/lib/mock-data';
import styles from './etablissement.module.css';

export default function EtablissementPage() {
  const [recommendationsToggle, setRecommendationsToggle] = useState(true);
  const [autoPublishToggle, setAutoPublishToggle] = useState(false);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <PageHeader
        title="Mon établissement"
        subtitle="Gérez les informations de votre restaurant et personnalisez vos recommandations."
        action={
          <Link href="#public-profile" className={styles.publicLink}>
            <span>Voir le profil public</span>
            <ExternalLink size={13} />
          </Link>
        }
      />

      <div className={styles.layout}>
        {/* Left Column: Cover, identity and details */}
        <div className={styles.leftCol}>
          {/* Restaurant Hero Card */}
          <div className={styles.restaurantHeroCard}>
            <div className={styles.coverContainer}>
              <img
                src={MOCK_RESTAURANT.coverImage}
                alt={MOCK_RESTAURANT.name}
                className={styles.coverImg}
              />
            </div>

            <div className={styles.heroContent}>
              <div className={styles.identityRow}>
                <div className={styles.logoBox}>{MOCK_RESTAURANT.logoText}</div>
                <div className={styles.nameGroup}>
                  <h2 className={styles.restaurantName}>{MOCK_RESTAURANT.name}</h2>
                  <span className={styles.category}>{MOCK_RESTAURANT.category}</span>
                  <div className={styles.statusRow}>
                    <span className={styles.openBadge}>
                      <span className={styles.openDot} />
                      {MOCK_RESTAURANT.status}
                    </span>
                  </div>
                </div>
              </div>

              <button type="button" className={styles.editBtn}>
                Modifier
              </button>
            </div>
          </div>

          {/* Details list Card */}
          <div className={styles.infoCard}>
            {/* Type */}
            <div className={styles.infoItem}>
              <div className={styles.infoLeft}>
                <Store size={18} className={styles.infoIcon} />
                <div className={styles.infoLabels}>
                  <span className={styles.infoTitle}>Type d&apos;établissement</span>
                  <span className={styles.infoValue}>{MOCK_RESTAURANT.typeEtablissement}</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className={styles.infoItem}>
              <div className={styles.infoLeft}>
                <MapPin size={18} className={styles.infoIcon} />
                <div className={styles.infoLabels}>
                  <span className={styles.infoTitle}>Adresse</span>
                  <span className={styles.infoValue}>{MOCK_RESTAURANT.address}</span>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className={styles.infoItem}>
              <div className={styles.infoLeft}>
                <Clock size={18} className={styles.infoIcon} />
                <div className={styles.infoLabels}>
                  <span className={styles.infoTitle}>Horaires</span>
                  <span className={styles.infoValue}>{MOCK_RESTAURANT.hours}</span>
                </div>
              </div>
            </div>

            {/* Social Accounts */}
            <div className={styles.infoItem}>
              <div className={styles.infoLeft}>
                <Share2 size={18} className={styles.infoIcon} />
                <div className={styles.infoLabels}>
                  <span className={styles.infoTitle}>Réseaux sociaux</span>
                  <div className={styles.socialIcons}>
                    <span className={styles.socialBadge}>📸 Instagram</span>
                    <span className={styles.socialBadge}>📘 Facebook</span>
                    <span className={styles.socialBadge}>🎵 TikTok</span>
                  </div>
                </div>
              </div>
            </div>

            {/* POS Connection */}
            <div className={styles.infoItem}>
              <div className={styles.infoLeft}>
                <Cpu size={18} className={styles.infoIcon} />
                <div className={styles.infoLabels}>
                  <span className={styles.infoTitle}>Connexion caisse</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={styles.infoValue}>Caisse (POS)</span>
                    <span style={{ fontSize: '0.72rem', color: '#22C55E', fontWeight: 600 }}>● Actif</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Communication params */}
            <div className={styles.infoItem}>
              <div className={styles.infoLeft}>
                <Sliders size={18} className={styles.infoIcon} />
                <div className={styles.infoLabels}>
                  <span className={styles.infoTitle}>Paramètres de communication</span>
                  <span className={styles.infoValue}>
                    Ton : {MOCK_RESTAURANT.communicationTone} • Cible : {MOCK_RESTAURANT.targetAudience}
                  </span>
                </div>
              </div>
              <button type="button" className={styles.editBtn}>
                Modifier
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Identity, Offers & Preferences */}
        <div className={styles.rightCol}>
          {/* Identity: Logo & Photos */}
          <div className={styles.panelCard}>
            <h3 className={styles.panelTitle}>Votre identité</h3>
            <div className={styles.photoGrid}>
              {MOCK_RESTAURANT.photos.map((photo, i) => (
                <div key={i} className={styles.photoThumb}>
                  <img src={photo} alt={`Photo ${i + 1}`} />
                </div>
              ))}
            </div>
            <div className={styles.btnRow}>
              <Button variant="secondary" size="sm">
                <Camera size={13} />
                <span>Changer le logo</span>
              </Button>
              <Button variant="secondary" size="sm">
                <ImageIcon size={13} />
                <span>Ajouter des photos</span>
              </Button>
            </div>
          </div>

          {/* Offers */}
          <div className={styles.panelCard}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 className={styles.panelTitle}>Vos offres</h3>
              <button type="button" className={styles.editBtn}>
                Modifier
              </button>
            </div>
            <div className={styles.offersRow}>
              {MOCK_RESTAURANT.offers.map((offer) => (
                <span key={offer} className={styles.offerPill}>
                  {offer}
                </span>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div className={styles.panelCard}>
            <h3 className={styles.panelTitle}>Préférences</h3>

            {/* Toggle 1 */}
            <div className={styles.toggleItem}>
              <span className={styles.toggleLabel}>Recevoir des recommandations personnalisées</span>
              <button
                type="button"
                onClick={() => setRecommendationsToggle(!recommendationsToggle)}
                className={`${styles.switch} ${recommendationsToggle ? styles.switchActive : ''}`}
                aria-label="Recommandations personnalisées"
              >
                <div className={styles.switchKnob} />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className={styles.toggleItem}>
              <span className={styles.toggleLabel}>Publier automatiquement</span>
              <button
                type="button"
                onClick={() => setAutoPublishToggle(!autoPublishToggle)}
                className={`${styles.switch} ${autoPublishToggle ? styles.switchActive : ''}`}
                aria-label="Publier automatiquement"
              >
                <div className={styles.switchKnob} />
              </button>
            </div>

            <Link href="#advanced-settings" className={styles.advancedLink}>
              Préférences avancées →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
