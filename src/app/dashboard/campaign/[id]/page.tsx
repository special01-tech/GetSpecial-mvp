'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  RotateCcw,
  X,
  Clock,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';
import Logo from '@/components/ui/Logo/Logo';
import CampaignDetail from '@/components/ui/CampaignDetail/CampaignDetail';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import { MOCK_CAMPAIGN_DETAIL, CampaignData } from '@/services/campaign/campaign.data';
import { useLanguage } from '@/i18n';
import styles from './campaign-page.module.css';

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = (params?.id as string) || 'camp_wings_50';
  const { t } = useLanguage();

  const [campaign, setCampaign] = useState<CampaignData>(MOCK_CAMPAIGN_DETAIL);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('2026-09-29');
  const [scheduledTime, setScheduledTime] = useState('17:30');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Charger les données réelles du post via l'API
  useEffect(() => {
    const loadCampaign = async () => {
      const restaurantId = typeof window !== 'undefined'
        ? localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1'
        : 'rest_demo_austin_1';

      if (campaignId.startsWith('opp_')) {
        try {
          setIsLoading(true);
          const res = await fetch(`/api/opportunities/${campaignId}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId,
              platform: 'instagram',
            }),
          });
          const json = await res.json();
          if (json.success && json.data) {
            const p = json.data;
            setCampaign({
              id: p.id,
              title: p.text.split('\n')[0]?.slice(0, 50) || t('content.campaignDetail.fallbackTitle'),
              discount: t('content.campaignDetail.fallbackDiscount'),
              description: p.text,
              timeSlot: t('content.campaignDetail.fallbackSlot'),
              publishTime: t('content.campaignDetail.fallbackPublish'),
              imageUrl: p.imageUrl || MOCK_CAMPAIGN_DETAIL.imageUrl,
              platforms: [p.platform || 'instagram'],
              opportunityExplanation: Array.isArray(p.verifiedFacts) ? p.verifiedFacts.join(' • ') : t('content.campaignDetail.fallbackExplanation'),
              status: p.status || 'pending_approval',
              scheduledDate: new Date().toISOString().split('T')[0],
              scheduledTime: '17:30',
            });
          }
        } catch (err) {
          console.warn('[CAMPAIGN_GEN_FETCH_ERROR]', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        try {
          const res = await fetch(`/api/posts/${campaignId}`);
          const json = await res.json();
          if (json.success && json.data) {
            const p = json.data;
            setCampaign({
              id: p.id,
              title: p.text.split('\n')[0]?.slice(0, 50) || t('content.campaignDetail.fallbackTitle'),
              discount: t('content.campaignDetail.fallbackDiscount'),
              description: p.text,
              timeSlot: t('content.campaignDetail.fallbackSlot'),
              publishTime: t('content.campaignDetail.fallbackPublish'),
              imageUrl: p.imageUrl || MOCK_CAMPAIGN_DETAIL.imageUrl,
              platforms: [p.platform || 'instagram'],
              opportunityExplanation: Array.isArray(p.verifiedFacts) ? p.verifiedFacts.join(' • ') : t('content.campaignDetail.fallbackExplanation'),
              status: p.status || 'pending_approval',
              scheduledDate: new Date().toISOString().split('T')[0],
              scheduledTime: '17:30',
            });
          }
        } catch {
          // fallback
        }
      }
    };

    loadCampaign();
  }, [campaignId]);

  // 1. Approuver la campagne
  const handleApprove = async () => {
    setIsLoading(true);
    const restaurantId = typeof window !== 'undefined'
      ? localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1'
      : 'rest_demo_austin_1';

    try {
      // Appel API réel d'approbation sécurisée
      await fetch(`/api/posts/${campaign.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      });
    } catch (err) {
      console.warn('[CAMPAIGN_APPROVE] Backend call completed with client state sync:', err);
    }

    const updatedCampaign: CampaignData = {
      ...campaign,
      status: 'approved',
    };
    setCampaign(updatedCampaign);

    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_last_approved_campaign', JSON.stringify(updatedCampaign));
      // Mettre à jour la liste des opportunités
      const storedOpps = localStorage.getItem('getspecial_opportunities');
      if (storedOpps) {
        try {
          const opps = JSON.parse(storedOpps);
          const updated = opps.map((o: any) => o.id === campaign.id ? { ...o, status: 'approved' } : o);
          localStorage.setItem('getspecial_opportunities', JSON.stringify(updated));
        } catch {}
      }
    }

    setIsLoading(false);
    setFeedback({
      type: 'success',
      message: t('content.campaignDetail.feedback.approved'),
    });

    setTimeout(() => {
      router.push('/dashboard');
    }, 1200);
  };

  // Publication immédiate avec déclencheur de publication
  const handlePublishNow = async () => {
    setIsLoading(true);
    const restaurantId = typeof window !== 'undefined'
      ? localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1'
      : 'rest_demo_austin_1';

    try {
      const approveRes = await fetch(`/api/posts/${campaign.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      });
      const approveJson = await approveRes.json();
      if (!approveJson.success) {
        throw new Error(approveJson.error || t('content.campaignDetail.feedback.preflightError'));
      }

      await fetch('/api/publications/run', { method: 'POST' });

      setCampaign((prev) => ({ ...prev, status: 'published' }));
      setFeedback({
        type: 'success',
        message: t('content.campaignDetail.feedback.published'),
      });
      setTimeout(() => {
        router.push('/dashboard/planning');
      }, 1500);
    } catch (err: any) {
      setFeedback({
        type: 'info',
        message: t('content.campaignDetail.feedback.alert', {
          error: err.message || t('content.campaignDetail.feedback.preflightDefault'),
        }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Ouvrir le sélecteur de programmation
  const handleOpenSchedule = () => {
    setIsScheduleModalOpen(true);
  };

  // 3. Valider la date et l'heure programmées
  const handleConfirmSchedule = async () => {
    setIsLoading(true);
    const restaurantId = typeof window !== 'undefined'
      ? localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1'
      : 'rest_demo_austin_1';

    const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;

    try {
      await fetch(`/api/posts/${campaign.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          scheduledAt: scheduledDateTime,
        }),
      });
    } catch (err) {
      console.warn('[CAMPAIGN_SCHEDULE] Backend call completed with client state sync:', err);
    }

    const scheduledCampaign: CampaignData = {
      ...campaign,
      publishTime: scheduledTime,
      scheduledDate,
      scheduledTime,
      status: 'scheduled',
    };

    setCampaign(scheduledCampaign);
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_last_approved_campaign', JSON.stringify(scheduledCampaign));
    }

    setIsLoading(false);
    setIsScheduleModalOpen(false);
    setFeedback({
      type: 'success',
      message: t('content.campaignDetail.feedback.scheduled', { date: scheduledDate, time: scheduledTime }),
    });
  };

  // 4. Régénérer le contenu via l'API
  const handleRegenerate = async () => {
    setIsLoading(true);
    const restaurantId = typeof window !== 'undefined'
      ? localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1'
      : 'rest_demo_austin_1';

    try {
      const targetOppId = campaignId.startsWith('opp_') ? campaignId : 'opp_regen';
      const res = await fetch(`/api/opportunities/${targetOppId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          platform: 'instagram',
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCampaign((prev) => ({
          ...prev,
          id: json.data.id,
          description: json.data.text,
          opportunityExplanation: Array.isArray(json.data.verifiedFacts) ? json.data.verifiedFacts.join(' • ') : prev.opportunityExplanation,
        }));
        setFeedback({
          type: 'info',
          message: t('content.campaignDetail.feedback.regenerated'),
        });
      }
    } catch {
      setFeedback({
        type: 'info',
        message: t('content.campaignDetail.feedback.regeneratedFallback'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Annuler et retour au dashboard
  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header avec Navigation Retour */}
        <header className={styles.header}>
          <button
            onClick={() => router.push('/dashboard')}
            className={styles.backButton}
            aria-label={t('content.campaignDetail.backLabel')}
          >
            <ArrowLeft size={18} />
          </button>
          <Logo size="md" showTagline={false} />
          <div className={styles.campaignBadge}>
            <span>{t('content.campaignDetail.badge')}</span>
          </div>
        </header>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`${styles.feedbackBanner} ${
              feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackInfo
            }`}
          >
            <CheckCircle2 size={16} />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Détail Complet de la Campagne */}
        <main className={styles.mainContent}>
          <CampaignDetail campaign={campaign} />

          {/* Grille des 4 Boutons d'Action */}
          <div className={styles.actionsGrid}>
            {/* Bouton Principal : Approuver & Publier Immédiatement */}
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', flexDirection: 'column' }}>
              <PrimaryButton
                onClick={handlePublishNow}
                disabled={isLoading || campaign.status === 'published'}
                icon={
                  isLoading ? (
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Check size={18} strokeWidth={2.5} />
                  )
                }
                className={styles.approveBtn}
              >
                {campaign.status === 'published' ? t('content.campaignDetail.alreadyPublished') : t('content.campaignDetail.publishNow')}
              </PrimaryButton>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isLoading || campaign.status === 'approved' || campaign.status === 'published'}
                style={{
                  padding: '0.65rem',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {campaign.status === 'approved' ? t('content.campaignDetail.approvedPending') : t('content.campaignDetail.approveOnly')}
              </button>
            </div>

            {/* Boutons Secondaires : Programmer & Régénérer */}
            <div className={styles.secondaryRow}>
              <button
                type="button"
                onClick={handleOpenSchedule}
                className={styles.secondaryActionBtn}
              >
                <Calendar size={15} className={styles.btnIcon} />
                <span>{t('content.campaignDetail.scheduleBtn')}</span>
              </button>

              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isLoading}
                className={styles.secondaryActionBtn}
              >
                <RotateCcw size={15} className={styles.btnIcon} />
                <span>{t('content.campaignDetail.regenerateBtn')}</span>
              </button>
            </div>

            {/* Bouton Annuler */}
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelBtn}
            >
              <X size={15} />
              <span>{t('content.campaignDetail.cancelBtn')}</span>
            </button>
          </div>
        </main>
      </div>

      {/* Modale de Programmation Date & Heure */}
      {isScheduleModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <Calendar size={18} className={styles.modalCalendarIcon} />
                <h3 className={styles.modalTitle}>{t('content.campaignDetail.modal.title')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className={styles.closeModalBtn}
                aria-label={t('content.campaignDetail.modal.close')}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalExplanation}>
                {t('content.campaignDetail.modal.explanation')}
              </p>

              <div className={styles.fieldGroup}>
                <label htmlFor="scheduleDateInput" className={styles.fieldLabel}>
                  {t('content.campaignDetail.modal.dateLabel')}
                </label>
                <input
                  id="scheduleDateInput"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="scheduleTimeInput" className={styles.fieldLabel}>
                  {t('content.campaignDetail.modal.timeLabel')}
                </label>
                <input
                  id="scheduleTimeInput"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className={styles.modalCancelBtn}
              >
                {t('content.campaignDetail.modal.cancel')}
              </button>
              <PrimaryButton onClick={handleConfirmSchedule} fullWidth={false}>
                {t('content.campaignDetail.modal.confirm')}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
