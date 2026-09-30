'use client';

import React, { useState, useEffect } from 'react';
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
  Loader2,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { MOCK_RESTAURANT } from '@/lib/mock-data';
import type { RestaurantDTO } from '@/types/dto';
import styles from './etablissement.module.css';

export default function EtablissementPage() {
  const [restaurant, setRestaurant] = useState<RestaurantDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendationsToggle, setRecommendationsToggle] = useState(true);
  const [autoPublishToggle, setAutoPublishToggle] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const res = await fetch('/api/restaurants');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && json.data.length > 0) {
            setRestaurant(json.data[0]);
          }
        }
      } catch (err) {
        console.error('Erreur chargement restaurant:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRestaurant();
  }, []);

  const handleTogglePause = async () => {
    if (!restaurant) return;
    try {
      setIsPausing(true);
      const nextPaused = !restaurant.isPaused;
      const res = await fetch('/api/restaurants/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          isPaused: nextPaused,
        }),
      });

      if (res.ok) {
        setRestaurant((prev) =>
          prev
            ? {
                ...prev,
                isPaused: nextPaused,
                status: nextPaused ? 'En pause' : 'Ouvert',
              }
            : null
        );
      }
    } catch (err) {
      console.error('Erreur pause restaurant:', err);
    } finally {
      setIsPausing(false);
    }
  };

  const current = restaurant || MOCK_RESTAURANT;

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
                src={current.coverImage}
                alt={current.name}
                className={styles.coverImg}
              />
            </div>

            <div className={styles.heroContent}>
              <div className={styles.identityRow}>
                <div className={styles.logoBox}>{current.logoText}</div>
                <div className={styles.nameGroup}>
                  <h2 className={styles.restaurantName}>{current.name}</h2>
                  <span className={styles.category}>{current.category}</span>
                  <div className={styles.statusRow}>
                    <span className={restaurant?.isPaused ? styles.pausedBadge : styles.openBadge}>
                      <span className={styles.openDot} />
                      {current.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {restaurant && (
                  <Button
                    variant={restaurant.isPaused ? 'primary' : 'outline'}
                    size="sm"
                    onClick={handleTogglePause}
                    disabled={isPausing}
                  >
                    {isPausing ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : restaurant.isPaused ? (
                      <PlayCircle size={13} />
                    ) : (
                      <PauseCircle size={13} />
                    )}
                    <span>{restaurant.isPaused ? 'Reprendre l’activité' : 'Mettre en pause'}</span>
                  </Button>
                )}
                <button type="button" className={styles.editBtn}>
                  Modifier
                </button>
              </div>
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
                  <span className={styles.infoValue}>{current.typeEtablissement}</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className={styles.infoItem}>
              <div className={styles.infoLeft}>
                <MapPin size={18} className={styles.infoIcon} />
                <div className={styles.infoLabels}>
                  <span className={styles.infoTitle}>Adresse</span>
                  <span className={styles.infoValue}>{current.address}</span>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className={styles.infoItem}>
              <div className={styles.infoLeft}>
                <Clock size={18} className={styles.infoIcon} />
                <div className={styles.infoLabels}>
                  <span className={styles.infoTitle}>Horaires</span>
                  <span className={styles.infoValue}>{current.hours}</span>
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
                    {current.socialAccounts && current.socialAccounts.length > 0 ? (
                      current.socialAccounts.map((acc: any) => (
                        <span key={acc.id || acc.platform} className={styles.socialBadge}>
                          {acc.platform === 'instagram' ? '📸 Instagram' : acc.platform === 'facebook' ? '📘 Facebook' : '🎵 TikTok'}
                          {acc.username ? ` (${acc.username})` : ''}
                        </span>
                      ))
                    ) : (
                      <>
                        <span className={styles.socialBadge}>📸 Instagram</span>
                        <span className={styles.socialBadge}>📘 Facebook</span>
                      </>
                    )}
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
                    Ton : {current.communicationTone} • Cible : {current.targetAudience}
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
              {(current.photos || []).map((photo: string, i: number) => (
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
              {(current.offers || []).map((offer: any, i: number) => {
                const title = typeof offer === 'string' ? offer : offer.title;
                return (
                  <span key={offer.id || i} className={styles.offerPill}>
                    {title}
                  </span>
                );
              })}
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
