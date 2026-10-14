'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PenLine,
  Tag,
  Calendar,
  PenTool,
  Share2,
  RefreshCw,
  Send,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  Loader2,
  Layers,
  ArrowRight,
  UtensilsCrossed,
  PartyPopper,
  Zap,
  Maximize2,
  Sparkles,
  Store,
} from 'lucide-react';
import { INITIAL_RESTAURANT_OFFERS, RestaurantOffer } from '@/services/restaurant/restaurant-offers.data';
import { INITIAL_RESTAURANT_EVENTS, RestaurantEvent } from '@/services/restaurant/restaurant-events.data';
import { useLanguage } from '@/i18n';
import styles from './create.module.css';

type SourceType = 'custom' | 'event';
type Platform = 'instagram' | 'facebook' | 'google_business';
type VisualStyle = 'gourmet' | 'festive' | 'chic' | 'deal';

function StudioCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [restaurantName, setRestaurantName] = useState("L'Atelier Culinaire");
  const [restaurantId, setRestaurantId] = useState('rest_paris_atelier_1');
  const [availableRestaurants, setAvailableRestaurants] = useState<any[]>([]);

  // Données disponibles
  const [availableOffers, setAvailableOffers] = useState<RestaurantOffer[]>(INITIAL_RESTAURANT_OFFERS);
  const [availableEvents, setAvailableEvents] = useState<RestaurantEvent[]>(INITIAL_RESTAURANT_EVENTS);

  // Formulaire de configuration : 2 modes (Saisie Libre ou Mon Événement)
  const [sourceType, setSourceType] = useState<SourceType>('custom');
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [customDescription, setCustomDescription] = useState('');
  const [customDiscount, setCustomDiscount] = useState('');

  const [platform, setPlatform] = useState<Platform>('instagram');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('gourmet');

  // État de génération
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Résultat généré (Affiche + Légende)
  const [generatedPost, setGeneratedPost] = useState<{
    id?: string;
    title: string;
    caption: string;
    imageUrl: string;
    alternativeImages: string[];
    discountValue?: string;
  } | null>(null);

  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Pop-ups d'agrandissement (image & légende)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isCaptionModalOpen, setIsCaptionModalOpen] = useState(false);
  const [activeCaptionPlatform, setActiveCaptionPlatform] = useState<Platform>('instagram');
  const [platformCaptions, setPlatformCaptions] = useState<Record<Platform, string>>({
    instagram: '',
    facebook: '',
    google_business: '',
  });

  // Modal de programmation
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('2026-10-02');
  const [scheduledTime, setScheduledTime] = useState('18:30');

  const buildPlatformCaption = (
    plat: Platform,
    title: string,
    rawCaption: string,
    restName: string,
    deal?: string
  ): string => {
    switch (plat) {
      case 'instagram':
        return `${rawCaption}\n\n📍 ${restName}\n👉 Mentionnez l'offre au serveur pour en profiter !\n\n#restaurant #foodie #bonneadresse #bistrot #paris #foodlover`;
      case 'facebook':
        return `Envie de vous régaler ? 🍽️\n\n${rawCaption}\n\nRetrouvez-nous chez ${restName} pour en profiter ! Taguez un ami avec qui venir partager ce moment. 👇`;
      case 'google_business':
        return `[Offre Spéciale] ${title}${deal ? ` - ${deal}` : ''}\n${rawCaption}\n\nDisponible aujourd'hui chez ${restName}. Venez nous rendre visite pendant nos heures de service !`;
    }
  };

  const handleSelectRestaurant = (newId: string) => {
    const target = availableRestaurants.find((r) => r.id === newId);
    if (!target) return;
    setRestaurantId(target.id);
    setRestaurantName(target.name);
    try {
      localStorage.setItem(
        'getspecial_selected_restaurant',
        JSON.stringify({
          id: target.id,
          name: target.name,
          address: target.address,
          photoUrl: target.profile?.photos?.[0] || target.photos?.[0],
        })
      );
      localStorage.setItem('getspecial_restaurant_id', target.id);
    } catch {}
  };

  // Chargement initial
  useEffect(() => {
    try {
      const restNameStored = localStorage.getItem('getspecial_selected_restaurant');
      if (restNameStored) {
        const parsed = JSON.parse(restNameStored);
        if (parsed.name) setRestaurantName(parsed.name);
      }
      const storedId = localStorage.getItem('getspecial_restaurant_id');
      if (storedId) setRestaurantId(storedId);

      // Charger les restaurants dynamiques de l'utilisateur
      fetch('/api/restaurants')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setAvailableRestaurants(json.data);
            const found = json.data.find(
              (r: any) =>
                r.id === storedId ||
                (restNameStored && r.name === JSON.parse(restNameStored)?.name)
            );
            if (found) {
              setRestaurantId(found.id);
              setRestaurantName(found.name);
            }
          }
        })
        .catch(() => {});

      // Charger événements
      const storedEvents = localStorage.getItem('getspecial_restaurant_events');
      if (storedEvents) {
        const parsedE = JSON.parse(storedEvents);
        if (Array.isArray(parsedE) && parsedE.length > 0) {
          setAvailableEvents(parsedE);
          setSelectedEventId(parsedE[0].id);
        }
      } else {
        setSelectedEventId(INITIAL_RESTAURANT_EVENTS[0].id);
      }

      // Query params éventuels (?type=event&id=...)
      const pType = searchParams.get('type');
      const pId = searchParams.get('id');
      if (pType === 'event') {
        setSourceType('event');
        if (pId) setSelectedEventId(pId);
      } else {
        setSourceType('custom');
      }
    } catch {
      // Ignorer
    }
  }, [searchParams]);

  // Synchronisation des variantes par plateforme et écoute Escape
  useEffect(() => {
    if (generatedPost) {
      setPlatformCaptions({
        instagram: buildPlatformCaption('instagram', generatedPost.title, generatedPost.caption, restaurantName, generatedPost.discountValue),
        facebook: buildPlatformCaption('facebook', generatedPost.title, generatedPost.caption, restaurantName, generatedPost.discountValue),
        google_business: buildPlatformCaption('google_business', generatedPost.title, generatedPost.caption, restaurantName, generatedPost.discountValue),
      });
    }
  }, [generatedPost?.title, generatedPost?.caption, restaurantName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageModalOpen(false);
        setIsCaptionModalOpen(false);
        setIsScheduleOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Action : Générer l'Affiche & la Légende
  const handleGenerate = async () => {
    setIsGenerating(true);

    let titleToUse = '';
    let descToUse = '';
    let discountToUse: string | undefined = undefined;

    if (sourceType === 'event') {
      const targetEvent = availableEvents.find((e) => e.id === selectedEventId) || availableEvents[0];
      titleToUse = targetEvent?.title || t('content.studio.fallbacks.eventTitle');
      descToUse =
        targetEvent?.description ||
        t('content.studio.fallbacks.eventDesc', {
          date: targetEvent?.date || t('content.studio.fallbacks.eventDateFallback'),
        });
      discountToUse = targetEvent?.time
        ? t('content.studio.fallbacks.eventTimeBadge', { time: targetEvent.time })
        : t('content.studio.fallbacks.eventBadge');
    } else {
      const text = customDescription.trim();
      descToUse = text || 'Plat du jour préparé avec des produits frais de saison';
      const firstLine = text.split('\n')[0].replace(/^[-*•\s]+/, '').slice(0, 50);
      titleToUse = firstLine.length > 3 ? firstLine : (restaurantName ? `Spécialité chez ${restaurantName}` : 'Création du Chef');
      discountToUse = customDiscount.trim() || undefined;
    }

    try {
      const res = await fetch('/api/posts/create-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          sourceType,
          title: titleToUse,
          description: descToUse,
          discountValue: discountToUse,
          platform,
          style: visualStyle,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data.generatedData;
        setGeneratedPost({
          id: json.data.post?.id,
          title: d.title,
          caption: d.caption,
          imageUrl: d.imageUrl,
          alternativeImages: d.alternativeImages || [d.imageUrl],
          discountValue: d.discountValue || discountToUse,
        });
        setActiveImgIndex(0);
        setNotice(t('content.studio.notices.generated'));
        setTimeout(() => setNotice(null), 3500);
      }
    } catch (err) {
      console.warn('[STUDIO_GENERATE_ERROR]', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Alterner l'image de l'affiche
  const handleSwitchPoster = () => {
    if (!generatedPost?.alternativeImages || generatedPost.alternativeImages.length === 0) return;

    const imagesToCycle = generatedPost.alternativeImages;
    const nextIdx = (activeImgIndex + 1) % imagesToCycle.length;
    setActiveImgIndex(nextIdx);

    setGeneratedPost((prev) =>
      prev
        ? {
            ...prev,
            imageUrl: imagesToCycle[nextIdx],
          }
        : null
    );
  };

  // Régénérer uniquement la légende
  const handleRegenerateCaption = () => {
    if (!generatedPost) return;
    const variations = [
      t('content.studio.captions.v1', { title: generatedPost.title, restaurant: restaurantName }),
      t('content.studio.captions.v2', {
        title: generatedPost.title,
        restaurant: restaurantName,
        discountLine: generatedPost.discountValue
          ? t('content.studio.captions.v2discountLine', { discount: generatedPost.discountValue })
          : '',
      }),
      t('content.studio.captions.v3', { title: generatedPost.title, restaurant: restaurantName }),
    ];
    const newCaption = variations[Math.floor(Math.random() * variations.length)];
    setGeneratedPost({
      ...generatedPost,
      caption: newCaption,
    });
    setNotice(t('content.studio.notices.captionRegenerated'));
    setTimeout(() => setNotice(null), 2500);
  };

  // Publication immédiate
  const handlePublishNow = async () => {
    if (!generatedPost) return;
    setIsGenerating(true);
    try {
      if (generatedPost.id) {
        await fetch(`/api/publications/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: generatedPost.id, channel: platform }),
        });
      }
      setNotice(t('content.studio.notices.publishedLive', { platform: platform.toUpperCase() }));
      setTimeout(() => {
        router.push('/dashboard/planning');
      }, 1200);
    } catch {
      setNotice(t('content.studio.notices.validated'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Enregistrer la programmation
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduleOpen(false);
    setNotice(t('content.studio.notices.scheduled', { date: scheduledDate, time: scheduledTime }));
    setTimeout(() => {
      router.push('/dashboard/planning');
    }, 1200);
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header Épuré — Pro, sans sous-titre ni badges */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.titleGroup}>
              <div className={styles.iconBadge} aria-hidden="true">
                <PenTool size={18} strokeWidth={2} />
              </div>
              <h1 className={styles.pageTitle}>{t('content.studio.title')}</h1>
            </div>
          </div>

          {notice && (
            <div className={styles.noticeBanner}>
              <CheckCircle2 size={16} />
              <span>{notice}</span>
            </div>
          )}
        </header>

        {/* Grille principale : Deux cartes de même taille équilibrées à l'écran */}
        <div className={styles.studioGrid}>
          {/* COLONNE GAUCHE : Formulaire de configuration */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Layers size={17} />
                <span>{t('content.studio.stepOne')}</span>
              </h2>
            </div>

            <div className={styles.cardBody}>
              {/* Sélecteur dynamique d'établissement */}
              <div className={styles.fieldGroup} style={{ marginBottom: '1.25rem' }}>
                <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Store size={15} style={{ color: 'var(--color-primary, #FF6B35)' }} />
                  <span>Établissement sélectionné</span>
                </label>
                <select
                  value={restaurantId}
                  onChange={(e) => handleSelectRestaurant(e.target.value)}
                  className={styles.select}
                  style={{ fontWeight: 600 }}
                >
                  {availableRestaurants.length > 0 ? (
                    availableRestaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))
                  ) : (
                    <option value={restaurantId}>{restaurantName}</option>
                  )}
                </select>
              </div>

              {/* Sélecteur de mode : 2 modes (Saisie Libre ou Mon Événement) */}
              <div className={styles.typeSelector}>
                <button
                  type="button"
                  onClick={() => setSourceType('custom')}
                  className={`${styles.typeBtn} ${sourceType === 'custom' ? styles.typeBtnActive : ''}`}
                >
                  <PenTool size={15} />
                  <span>Saisie libre / Plat du jour</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType('event')}
                  className={`${styles.typeBtn} ${sourceType === 'event' ? styles.typeBtnActive : ''}`}
                >
                  <Calendar size={15} />
                  <span>Mon événement</span>
                </button>
              </div>

              {/* CAS 1 : Saisie libre / Plat du jour (Champ unifié) */}
              {sourceType === 'custom' && (
                <>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      <span>Votre annonce, plat ou création du jour</span>
                    </label>
                    <textarea
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="Décrivez simplement ce que vous souhaitez promouvoir (ex : Plat du jour : Pavé de saumon croustillant, mousseline de patates douces et sauce aneth. Ou : Formule déjeuner express entrée + plat à 19€)..."
                      className={styles.textarea}
                      rows={4}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Avantage ou réduction (facultatif)</label>
                    <input
                      type="text"
                      value={customDiscount}
                      onChange={(e) => setCustomDiscount(e.target.value)}
                      placeholder="Ex: -20% le midi, Dessert offert, Menu à 19€..."
                      className={styles.input}
                    />
                  </div>
                </>
              )}

              {/* CAS 2 : Choisir parmi les événements du restaurant */}
              {sourceType === 'event' && (
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>{t('content.studio.eventLabel')}</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className={styles.select}
                  >
                    {availableEvents.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} ({evt.date})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Réseau social cible */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>{t('content.studio.channelLabel')}</label>
                <div className={styles.platformRow}>
                  {(['instagram', 'facebook', 'google_business'] as Platform[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={`${styles.platformChip} ${platform === p ? styles.platformChipActive : ''}`}
                    >
                      <span>{p === 'google_business' ? 'Google' : p.charAt(0).toUpperCase() + p.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ambiance & Style de l'affiche */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>{t('content.studio.styleLabel')}</label>
                <div className={styles.stylesGrid}>
                  {[
                    { id: 'gourmet', label: t('content.studio.styles.gourmet'), icon: UtensilsCrossed },
                    { id: 'festive', label: t('content.studio.styles.festive'), icon: PartyPopper },
                    { id: 'chic', label: t('content.studio.styles.chic'), icon: PenLine },
                    { id: 'deal', label: t('content.studio.styles.deal'), icon: Zap },
                  ].map((s) => {
                    const StyleIcon = s.icon;
                    const isSelected = visualStyle === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setVisualStyle(s.id as VisualStyle)}
                        className={`${styles.styleCard} ${isSelected ? styles.styleCardActive : ''}`}
                      >
                        <StyleIcon size={15} strokeWidth={1.8} />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pied de carte Formulaire : Bouton Générer fixe */}
            <div className={styles.cardFooter}>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className={styles.generateBtn}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className={styles.spin} />
                    <span>{t('content.studio.generating')}</span>
                  </>
                ) : (
                  <>
                    <PenLine size={16} />
                    <span>{t('content.studio.generate')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* COLONNE DROITE : Aperçu du Rendu (Affiche + Légende) */}
          <div className={styles.previewSection}>
            {!generatedPost ? (
              <div className={styles.emptyStudioCard}>
                <div className={styles.emptyStudioIconCircle}>
                  <Sparkles size={26} />
                </div>
                <h3 className={styles.emptyStudioTitle}>Studio Prêt pour votre Création</h3>
                <p className={styles.emptyStudioText}>
                  Sélectionnez une offre, un événement ou saisissez votre plat du jour à gauche, puis cliquez sur <strong>« Générer l&apos;Affiche &amp; la Légende »</strong>.
                </p>

                <div className={styles.emptyStudioTips}>
                  <div className={styles.emptyStudioTipItem}>
                    <span className={styles.emptyStudioTipDot} />
                    <span>Visuel haute définition adapté au thème</span>
                  </div>
                  <div className={styles.emptyStudioTipItem}>
                    <span className={styles.emptyStudioTipDot} />
                    <span>Légendes optimisées Instagram &amp; Facebook</span>
                  </div>
                  <div className={styles.emptyStudioTipItem}>
                    <span className={styles.emptyStudioTipDot} />
                    <span>Contrôle qualité &amp; respect de votre identité</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.mockupCard}>
                {/* Header Réseau Social */}
                <div className={styles.mockupHeader}>
                  <div className={styles.mockupUser}>
                    <div className={styles.mockupAvatar}>
                      {restaurantName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className={styles.mockupMeta}>
                      <span className={styles.mockupName}>{restaurantName}</span>
                      <span className={styles.mockupTime}>{t('content.studio.previewMeta', { platform: platform.toUpperCase() })}</span>
                    </div>
                  </div>
                </div>

                {/* Corps du Rendu */}
                <div className={styles.previewBody}>
                  {/* L'AFFICHE (Visuel HD — Clic pour ouvrir en grand format) */}
                  <div
                    className={styles.posterFrame}
                    onClick={() => setIsImageModalOpen(true)}
                    title="Cliquer pour afficher l'affiche seule en grand format"
                    role="button"
                    tabIndex={0}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={generatedPost.imageUrl}
                      alt={generatedPost.title || t('content.studio.posterAlt')}
                      className={styles.posterImage}
                    />
                    <div className={styles.posterOverlay}>
                      <div className={styles.posterTopRow}>
                        {generatedPost.discountValue ? (
                          <span className={styles.posterPromoBadge}>
                            {generatedPost.discountValue}
                          </span>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          className={styles.zoomBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsImageModalOpen(true);
                          }}
                          title="Agrandir l'affiche en plein écran"
                        >
                          <Maximize2 size={13} />
                          <span>Agrandir</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions sous l'affiche */}
                  <div className={styles.posterActionRow}>
                    <button
                      type="button"
                      onClick={handleSwitchPoster}
                      className={styles.switchPosterBtn}
                      title={t('content.studio.switchPosterTitle')}
                    >
                      <RefreshCw size={12} />
                      <span>{t('content.studio.switchPoster')}</span>
                    </button>

                    <span className={styles.formatHint}>
                      {t('content.studio.formatNote')}
                    </span>
                  </div>

                  {/* LA LÉGENDE (Aperçu compact — Clic pour agrandir et voir par réseau) */}
                  <div className={styles.captionArea}>
                    <div className={styles.captionHeader}>
                      <span className={styles.captionTitle}>{t('content.studio.captionTitle')}</span>
                      <div className={styles.captionHeaderActions}>
                        <button
                          type="button"
                          onClick={handleRegenerateCaption}
                          className={styles.switchPosterBtn}
                          title={t('content.studio.regenerateTextTitle')}
                        >
                          <RefreshCw size={11} />
                          <span>{t('content.studio.regenerateText')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCaptionPlatform(platform);
                            setIsCaptionModalOpen(true);
                          }}
                          className={styles.expandCaptionBtn}
                          title="Ouvrir la légende en grand et voir les variantes par réseau"
                        >
                          <Maximize2 size={11} />
                          <span>Agrandir / Réseaux</span>
                        </button>
                      </div>
                    </div>

                    <div
                      className={styles.compactCaptionBox}
                      onClick={() => {
                        setActiveCaptionPlatform(platform);
                        setIsCaptionModalOpen(true);
                      }}
                      title="Cliquer pour ouvrir en grand et personnaliser par réseau"
                      role="button"
                      tabIndex={0}
                    >
                      <p className={styles.compactCaptionText}>
                        {generatedPost.caption || t('content.studio.captionPlaceholder')}
                      </p>
                      <div className={styles.captionClickHint}>
                        <Maximize2 size={11} />
                        <span>Cliquer pour voir et modifier les versions par réseau</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pied de carte Rendu : Actions finales (Publier ou Programmer) au même niveau */}
                <div className={styles.finalActionsBar}>
                  <button
                    type="button"
                    onClick={handlePublishNow}
                    disabled={isGenerating || !generatedPost}
                    className={styles.publishNowBtn}
                  >
                    <Send size={15} />
                    <span>{t('content.studio.publishNow')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsScheduleOpen(true)}
                    disabled={isGenerating || !generatedPost}
                    className={styles.scheduleBtn}
                  >
                    <Clock size={15} />
                    <span>{t('content.studio.schedule')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Pop-up : Image seule pour visibilité maximale (Lightbox pure) */}
        {isImageModalOpen && (
          <div
            className={styles.lightboxOverlay}
            onClick={() => setIsImageModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Affiche en grand format"
          >
            <button
              type="button"
              className={styles.lightboxCloseBtn}
              onClick={() => setIsImageModalOpen(false)}
              aria-label="Fermer l'affiche"
            >
              <X size={26} strokeWidth={2.2} />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={generatedPost?.imageUrl || ''}
              alt={generatedPost?.title || 'Affiche en grand format'}
              className={styles.lightboxImage}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Modal Pop-up : Vue agrandie de la légende & variantes par réseau */}
        {isCaptionModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsCaptionModalOpen(false)}>
            <div className={styles.captionModalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>Légende & Copywriting par Réseau</h3>
                  <span className={styles.captionModalSubtitle}>
                    Basculez entre les réseaux ci-dessous pour adapter votre message
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCaptionModalOpen(false)}
                  className={styles.closeBtn}
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Zone de texte éditable en grand format */}
              <div className={styles.captionModalBody}>
                <textarea
                  value={platformCaptions[activeCaptionPlatform] || generatedPost?.caption || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlatformCaptions((prev) => ({
                      ...prev,
                      [activeCaptionPlatform]: val,
                    }));
                    if (activeCaptionPlatform === platform) {
                      setGeneratedPost((prev) => (prev ? { ...prev, caption: val } : null));
                    }
                  }}
                  className={styles.expandedCaptionInput}
                  placeholder="Rédigez la légende adaptée à ce réseau..."
                />
              </div>

              {/* Puces en bas pour voir la version de chaque réseau */}
              <div className={styles.captionModalFooter}>
                <div className={styles.platformPillsRow}>
                  {(['instagram', 'facebook', 'google_business'] as Platform[]).map((p) => {
                    const isActive = activeCaptionPlatform === p;
                    const pLabel = p === 'google_business' ? 'Google Business' : p.charAt(0).toUpperCase() + p.slice(1);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setActiveCaptionPlatform(p)}
                        className={`${styles.platformPill} ${isActive ? styles.platformPillActive : ''}`}
                      >
                        <span>{pLabel}</span>
                      </button>
                    );
                  })}
                </div>

                <div className={styles.captionModalActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setPlatform(activeCaptionPlatform);
                      const selectedText = platformCaptions[activeCaptionPlatform] || generatedPost?.caption || '';
                      setGeneratedPost((prev) => (prev ? { ...prev, caption: selectedText } : null));
                      setIsCaptionModalOpen(false);
                      setNotice(`Légende appliquée pour ${activeCaptionPlatform.toUpperCase()}`);
                      setTimeout(() => setNotice(null), 2500);
                    }}
                    className={styles.applyCaptionBtn}
                  >
                    <Check size={14} />
                    <span>Appliquer à la publication</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Programmer */}
        {isScheduleOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>{t('content.studio.scheduleModalTitle')}</h3>
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className={styles.closeBtn}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>{t('content.studio.scheduleDateLabel')}</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>{t('content.studio.scheduleTimeLabel')}</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <button type="submit" className={styles.generateBtn} style={{ marginTop: 8 }}>
                  <Check size={16} />
                  <span>{t('content.studio.confirmSchedule')}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudioCreatePage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>{t('content.studio.loading')}</div>}>
      <StudioCreateContent />
    </Suspense>
  );
}
