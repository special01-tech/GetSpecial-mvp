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
  ArrowLeft,
  Undo2,
  UtensilsCrossed,
  PartyPopper,
  Zap,
  Maximize2,
  Sparkles,
  Store,
} from 'lucide-react';
import { useLanguage } from '@/i18n';
import styles from './create.module.css';

export interface EventItem {
  id: string;
  title: string;
  date?: string;
  dateStr?: string;
  time?: string;
  timeStr?: string;
  description?: string;
}

type SourceType = 'custom' | 'event';
type Platform = 'instagram' | 'facebook' | 'google_business';
type VisualStyle = 'gourmet' | 'festive' | 'chic' | 'deal';

function StudioCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [availableRestaurants, setAvailableRestaurants] = useState<any[]>([]);

  // Événements réels disponibles
  const [availableEvents, setAvailableEvents] = useState<EventItem[]>([]);

  // Formulaire de configuration : 2 modes (Saisie Libre ou Mon Événement)
  const [sourceType, setSourceType] = useState<SourceType>('custom');
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [customDescription, setCustomDescription] = useState('');
  const [customDiscount, setCustomDiscount] = useState('');

  const [platform, setPlatform] = useState<Platform>('instagram');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('gourmet');

  // Navigation par étapes sur Mobile (1: Contenu, 2: Style & Réseau, 3: Résultat)
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

  const handleNextToStyle = () => {
    if (sourceType === 'event' && availableEvents.length === 0) {
      setNotice("Aucun événement disponible. Créez-en un dans votre Planning ou utilisez la Saisie libre.");
      setTimeout(() => setNotice(null), 3500);
      return;
    }
    setMobileStep(2);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToContent = () => {
    setMobileStep(1);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleModifyPrompt = () => {
    setMobileStep(1);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // État de génération
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Résultat généré (Affiche + Légende)
  const [generatedPost, setGeneratedPost] = useState<{
    id?: string;
    title: string;
    caption: string;
    instagramCaption?: string;
    facebookCaption?: string;
    imageUrl?: string | null;
    alternativeImages?: string[];
    discountValue?: string;
    imageError?: string | null;
  } | null>(null);

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Régénération IA de la légende
  const [isRegeneratingCaption, setIsRegeneratingCaption] = useState(false);
  const [captionAngleIndex, setCaptionAngleIndex] = useState(0);

  // Plats du restaurant (extraits du menu ou configurés)
  const [menuDishes, setMenuDishes] = useState<any[]>([]);

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
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
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
        return `${rawCaption}\n\n${restName} — Mentionnez l'offre au serveur pour en profiter.\n\n#restaurant #foodie #bonneadresse #faitmaison`;
      case 'facebook':
        return `Envie de vous régaler ?\n\n${rawCaption}\n\nRetrouvez-nous chez ${restName} pour en profiter et partagez ce moment avec vos proches.`;
      case 'google_business':
        return `[Offre Spéciale] ${title}${deal ? ` - ${deal}` : ''}\n${rawCaption}\n\nDisponible aujourd'hui chez ${restName}. Venez nous rendre visite pendant nos heures de service !`;
    }
  };

  const loadRestaurantDishes = (rId: string) => {
    try {
      const localDishes =
        localStorage.getItem(`menu_extracted_dishes_${rId}`) ||
        localStorage.getItem('gs_extracted_dishes');
      if (localDishes) {
        const parsed = JSON.parse(localDishes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMenuDishes(parsed);
          return;
        }
      }
    } catch { }

    fetch(`/api/restaurants/${rId}/dishes`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.dishes) && json.data.dishes.length > 0) {
          setMenuDishes(json.data.dishes);
        }
      })
      .catch(() => { });
  };

  const handleSelectRestaurant = (newId: string) => {
    const target = availableRestaurants.find((r) => r.id === newId);
    if (!target) return;
    setRestaurantId(target.id);
    setRestaurantName(target.name);
    loadRestaurantDishes(target.id);
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
    } catch { }
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

      // Charger les plats de la carte du restaurant
      loadRestaurantDishes(storedId || restaurantId);

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
              loadRestaurantDishes(found.id);
            }
          }
        })
        .catch(() => { });

      // Charger les événements réels du restaurant
      const storedEvents =
        localStorage.getItem('gs_user_events') ||
        localStorage.getItem('getspecial_restaurant_events');
      if (storedEvents) {
        const parsedE = JSON.parse(storedEvents);
        if (Array.isArray(parsedE) && parsedE.length > 0) {
          setAvailableEvents(parsedE);
          setSelectedEventId(parsedE[0].id);
        } else {
          setAvailableEvents([]);
        }
      } else {
        setAvailableEvents([]);
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
        instagram: generatedPost.instagramCaption || buildPlatformCaption('instagram', generatedPost.title, generatedPost.caption, restaurantName, generatedPost.discountValue),
        facebook: generatedPost.facebookCaption || buildPlatformCaption('facebook', generatedPost.title, generatedPost.caption, restaurantName, generatedPost.discountValue),
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
    if (!restaurantId) {
      setNotice("Veuillez sélectionner un établissement pour générer du contenu.");
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    if (sourceType === 'event' && availableEvents.length === 0) {
      setNotice("Aucun événement enregistré. Veuillez en créer un dans votre Planning ou passer en Saisie libre.");
      setTimeout(() => setNotice(null), 3500);
      setMobileStep(1);
      return;
    }

    setMobileStep(3);
    setIsGenerating(true);

    let titleToUse = '';
    let descToUse = '';
    let discountToUse: string | undefined = undefined;

    if (sourceType === 'event') {
      const targetEvent = availableEvents.find((e) => e.id === selectedEventId) || availableEvents[0];
      titleToUse = targetEvent.title;
      descToUse =
        targetEvent.description ||
        `Événement le ${targetEvent.dateStr || targetEvent.date || 'bientôt'} chez ${restaurantName}.`;
      discountToUse = targetEvent.timeStr || targetEvent.time || undefined;
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
        const hasImg = Boolean(d.imageUrl);
        setGeneratedPost({
          id: json.data.post?.id,
          title: d.title,
          caption: platform === 'facebook' ? (d.facebookCaption || d.caption) : (d.instagramCaption || d.caption),
          instagramCaption: d.instagramCaption || d.caption,
          facebookCaption: d.facebookCaption || d.caption,
          imageUrl: d.imageUrl || null,
          alternativeImages: hasImg ? [d.imageUrl] : [],
          discountValue: d.discountValue || discountToUse,
          imageError: d.imageError || (!hasImg ? 'Image non disponible, réessayez plus tard.' : null),
        });
        setActiveImgIndex(0);
        if (!hasImg) {
          setNotice('Image non disponible, réessayez plus tard.');
        } else {
          setNotice(t('content.studio.notices.generated'));
        }
        setTimeout(() => setNotice(null), 3500);
      } else {
        setNotice(json.error || 'Erreur lors de la génération. Veuillez réessayer.');
        setTimeout(() => setNotice(null), 4000);
      }
    } catch (err: any) {
      console.warn('[STUDIO_GENERATE_ERROR]', err);
      setNotice(err?.message || 'Erreur lors de la génération. Veuillez réessayer.');
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  // Régénérer ou réessayer la génération de l'image par IA
  const handleRetryImage = async () => {
    if (!generatedPost || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setNotice("Génération de l'image par IA en cours...");

    try {
      const res = await fetch('/api/posts/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: generatedPost.id,
          restaurantId,
          title: generatedPost.title,
          description: customDescription,
          discountValue: generatedPost.discountValue,
          style: visualStyle,
          platform,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data?.imageUrl) {
        setGeneratedPost((prev) =>
          prev
            ? {
              ...prev,
              imageUrl: json.data.imageUrl,
              imageError: null,
              alternativeImages: prev.alternativeImages && prev.alternativeImages.length > 0 ? (prev.alternativeImages.includes(json.data.imageUrl) ? prev.alternativeImages : [...prev.alternativeImages, json.data.imageUrl]) : [json.data.imageUrl],
            }
            : null
        );
        setNotice("Image générée avec succès par l'IA");
        setTimeout(() => setNotice(null), 3500);
      } else {
        throw new Error(json.error || 'Image non disponible, réessayez plus tard.');
      }
    } catch (err: any) {
      console.warn('[STUDIO_RETRY_IMAGE_ERROR]', err);
      setNotice('Image non disponible, réessayez plus tard.');
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Alterner l'image de l'affiche (si plusieurs déclinaisons)
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

  // Régénérer uniquement la légende par IA
  const handleRegenerateCaption = async () => {
    if (!generatedPost || isRegeneratingCaption) return;
    setIsRegeneratingCaption(true);
    try {
      const nextAngle = captionAngleIndex + 1;
      setCaptionAngleIndex(nextAngle);

      const res = await fetch('/api/posts/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          postId: generatedPost.id,
          title: generatedPost.title,
          description: customDescription,
          discountValue: generatedPost.discountValue,
          platform,
          style: visualStyle,
          sourceType,
          angleIndex: nextAngle,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.caption) {
        const newCaption = json.data.caption;
        setGeneratedPost((prev) => (prev ? { ...prev, caption: newCaption } : null));

        setPlatformCaptions((prev) => ({
          ...prev,
          [platform]: newCaption,
        }));

        setNotice(json.data.isAiGenerated ? 'Légende réécrite avec succès par IA' : 'Nouvelle variante de légende générée');
        setTimeout(() => setNotice(null), 3000);
      } else {
        throw new Error(json.error || 'Erreur lors de la régénération');
      }
    } catch (err: any) {
      console.warn('[STUDIO_REGENERATE_CAPTION_ERROR]', err);
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
      setGeneratedPost((prev) => (prev ? { ...prev, caption: newCaption } : null));
      setNotice(t('content.studio.notices.captionRegenerated'));
      setTimeout(() => setNotice(null), 2500);
    } finally {
      setIsRegeneratingCaption(false);
    }
  };

  // Publication immédiate
  const handlePublishNow = async () => {
    if (!generatedPost) return;
    setIsGenerating(true);
    try {
      if (generatedPost.id) {
        // 1. Sauvegarder d'éventuelles modifications de texte ou d'image
        await fetch(`/api/posts/${generatedPost.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            text: generatedPost.caption,
            imageUrl: generatedPost.imageUrl,
            platform,
          }),
        });

        // 2. Approuver le post pour publication
        const approveRes = await fetch(`/api/posts/${generatedPost.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantId }),
        });

        if (!approveRes.ok) {
          const errData = await approveRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Erreur lors de la validation du post');
        }

        // 3. Déclencher le scheduler de publication
        fetch('/api/publications/run', { method: 'POST' }).catch(() => { });

        // 4. Synchroniser l'affichage immédiat dans le planning
        try {
          const stored = localStorage.getItem('gs_scheduled_posts');
          const existing = stored ? JSON.parse(stored) : [];
          const todayStr = new Date().toISOString().split('T')[0];
          const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          const newScheduledItem = {
            id: generatedPost.id,
            title: generatedPost.title,
            dateStr: todayStr,
            timeStr,
            imageUrl: generatedPost.imageUrl,
            platform: platform.charAt(0).toUpperCase() + platform.slice(1),
            status: 'published',
          };
          localStorage.setItem('gs_scheduled_posts', JSON.stringify([newScheduledItem, ...existing]));
        } catch { }
      }

      setNotice(t('content.studio.notices.publishedLive', { platform: platform.toUpperCase() }));
      setTimeout(() => {
        router.push('/dashboard/planning');
      }, 1200);
    } catch (err: any) {
      console.error('[STUDIO_PUBLISH_ERROR]', err);
      setNotice(err?.message || t('content.studio.notices.validated'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Enregistrer la programmation
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedPost) return;
    setIsGenerating(true);
    try {
      if (generatedPost.id) {
        // 1. Sauvegarder d'éventuelles modifications de texte ou d'image
        await fetch(`/api/posts/${generatedPost.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            text: generatedPost.caption,
            imageUrl: generatedPost.imageUrl,
            platform,
          }),
        });

        // 2. Approuver le post avec date planifiée
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
        const approveRes = await fetch(`/api/posts/${generatedPost.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            scheduledAt: scheduledDateTime.toISOString(),
          }),
        });

        if (!approveRes.ok) {
          const errData = await approveRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Erreur lors de la programmation du post');
        }

        // 3. Synchroniser l'affichage dans le planning
        try {
          const stored = localStorage.getItem('gs_scheduled_posts');
          const existing = stored ? JSON.parse(stored) : [];
          const newScheduledItem = {
            id: generatedPost.id,
            title: generatedPost.title,
            dateStr: scheduledDate,
            timeStr: scheduledTime,
            imageUrl: generatedPost.imageUrl,
            platform: platform.charAt(0).toUpperCase() + platform.slice(1),
            status: 'scheduled',
          };
          localStorage.setItem('gs_scheduled_posts', JSON.stringify([newScheduledItem, ...existing]));
        } catch { }
      }

      setIsScheduleOpen(false);
      setNotice(t('content.studio.notices.scheduled', { date: scheduledDate, time: scheduledTime }));
      setTimeout(() => {
        router.push('/dashboard/planning');
      }, 1200);
    } catch (err: any) {
      console.error('[STUDIO_SCHEDULE_ERROR]', err);
      setNotice(err?.message || 'Erreur lors de la programmation');
    } finally {
      setIsGenerating(false);
    }
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

        {/* Stepper mobile (Étape 1 Contenu -> Étape 2 Style & Canal -> Étape 3 Résultat) */}
        <nav className={styles.mobileStepper} aria-label="Étapes de création mobile">
          <button
            type="button"
            onClick={() => setMobileStep(1)}
            className={`${styles.stepItem} ${mobileStep === 1 ? styles.stepItemActive : ''} ${mobileStep > 1 ? styles.stepItemDone : ''}`}
            title="Étape 1 : Contenu"
          >
            <div className={styles.stepCircle}>
              {mobileStep > 1 ? <Check size={13} strokeWidth={2.5} /> : '1'}
            </div>
            <span className={styles.stepLabel}>Contenu</span>
          </button>

          <div className={`${styles.stepConnector} ${mobileStep >= 2 ? styles.stepConnectorActive : ''}`} />

          <button
            type="button"
            onClick={() => {
              if (sourceType === 'event' && availableEvents.length === 0) {
                setNotice("Veuillez d'abord configurer votre événement.");
                setTimeout(() => setNotice(null), 3000);
                return;
              }
              setMobileStep(2);
            }}
            className={`${styles.stepItem} ${mobileStep === 2 ? styles.stepItemActive : ''} ${mobileStep > 2 ? styles.stepItemDone : ''}`}
            title="Étape 2 : Style & Canal"
          >
            <div className={styles.stepCircle}>
              {mobileStep > 2 ? <Check size={13} strokeWidth={2.5} /> : '2'}
            </div>
            <span className={styles.stepLabel}>Style &amp; Canal</span>
          </button>

          <div className={`${styles.stepConnector} ${mobileStep >= 3 ? styles.stepConnectorActive : ''}`} />

          <button
            type="button"
            onClick={() => {
              if (generatedPost || isGenerating) {
                setMobileStep(3);
              } else {
                setNotice("Configurez d'abord votre annonce aux étapes 1 et 2.");
                setTimeout(() => setNotice(null), 3000);
              }
            }}
            className={`${styles.stepItem} ${mobileStep === 3 ? styles.stepItemActive : ''}`}
            title="Étape 3 : Résultat & Diffusion"
            disabled={!generatedPost && !isGenerating}
          >
            <div className={styles.stepCircle}>
              <Sparkles size={13} />
            </div>
            <span className={styles.stepLabel}>Résultat</span>
          </button>
        </nav>

        {/* Grille principale : Deux cartes équilibrées (ou stepper par étapes sur mobile) */}
        <div className={styles.studioGrid} data-mobile-step={mobileStep}>
          {/* COLONNE GAUCHE : Formulaire de configuration */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Layers size={17} />
                <span>
                  {mobileStep === 1
                    ? '1. Que souhaitez-vous promouvoir ?'
                    : '2. Style & Canal de diffusion'}
                </span>
              </h2>
              <span className={styles.mobileStepBadge}>
                Étape {mobileStep}/3
              </span>
            </div>

            <div className={styles.cardBody}>
              {/* SECTION ÉTAPE 1 : Contenu (Établissement, Saisie libre vs Événement) */}
              <div className={styles.stepSection1}>
                {/* Sélecteur dynamique d'établissement */}
                <div className={styles.fieldGroup} style={{ marginBottom: '0.5rem' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label className={styles.label} style={{ marginBottom: 0 }}>
                          <span>Votre annonce, plat ou création du jour</span>
                        </label>
                        {menuDishes.length > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary, #FF6B35)', fontWeight: 600 }}>
                            {menuDishes.length} plat(s) du menu
                          </span>
                        )}
                      </div>

                      {/* Suggestions rapides en ruban tactile fluide */}
                      {menuDishes.length > 0 && (
                        <div className={styles.dishSuggestionsScroll}>
                          {menuDishes.slice(0, 8).map((dish, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                const desc = dish.description
                                  ? `${dish.name} : ${dish.description}`
                                  : dish.name;
                                setCustomDescription(desc);
                                if (dish.priceText) {
                                  setCustomDiscount(`Prix : ${dish.priceText}`);
                                }
                              }}
                              className={styles.dishChip}
                              title={dish.description || dish.name}
                            >
                              <UtensilsCrossed size={13} strokeWidth={2} />
                              <span>{dish.name}</span>
                              {dish.priceText && (
                                <span style={{ opacity: 0.75, fontSize: '0.7rem' }}>({dish.priceText})</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

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
                    {availableEvents.length > 0 ? (
                      <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className={styles.select}
                      >
                        {availableEvents.map((evt) => (
                          <option key={evt.id} value={evt.id}>
                            {evt.title} ({evt.dateStr || evt.date || 'À venir'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div
                        style={{
                          padding: '12px 14px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px dashed var(--color-border, rgba(255, 255, 255, 0.15))',
                          borderRadius: '10px',
                          fontSize: '0.85rem',
                          color: 'var(--color-text-secondary, #94a3b8)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <span>Aucun événement n&apos;est enregistré pour le moment.</span>
                        <button
                          type="button"
                          onClick={() => router.push('/dashboard/planning')}
                          style={{
                            background: 'transparent',
                            color: 'var(--color-primary, #FF6B35)',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            padding: 0,
                          }}
                        >
                          + Créer un événement dans le Planning &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Mobile Étape 1 -> Étape 2 */}
                <div className={styles.mobileStepNav}>
                  <button
                    type="button"
                    onClick={handleNextToStyle}
                    className={styles.mobileNextBtn}
                  >
                    <span>Choisir le Style &amp; le Canal</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* SECTION ÉTAPE 2 : Style & Canal de diffusion */}
              <div className={styles.stepSection2}>
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

                {/* Navigation Mobile Étape 2 -> Étape 3 (Générer) ou Retour */}
                <div className={styles.mobileStepNavDouble}>
                  <button
                    type="button"
                    onClick={handleBackToContent}
                    className={styles.mobileBackBtn}
                  >
                    <ArrowLeft size={15} />
                    <span>Retour</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={styles.mobileGenerateBtn}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={16} className={styles.spin} />
                        <span>Génération IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Générer l&apos;Affiche &amp; Légende</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Pied de carte Formulaire : Bouton Générer fixe Desktop */}
            <div className={styles.desktopCardFooter}>
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

          {/* COLONNE DROITE : Aperçu du Rendu (Affiche + Légende) — Étape 3 sur mobile */}
          <div className={styles.previewSection}>
            {isGenerating ? (
              <div className={styles.generatingStateCard}>
                <div className={styles.generatingIconPulse}>
                  <Sparkles size={30} />
                </div>
                <h3 className={styles.generatingTitle}>Création de votre publication IA en cours...</h3>
                <p className={styles.generatingSubtitle}>
                  L&apos;IA GetSpecial conçoit une affiche haute définition et optimise votre légende pour{' '}
                  <strong>{platform === 'google_business' ? 'Google Business' : platform.charAt(0).toUpperCase() + platform.slice(1)}</strong>.
                </p>
                <div className={styles.generatingProgressBar}>
                  <div className={styles.generatingProgressFill} />
                </div>
                <span className={styles.generatingHint}>Votre contenu est presque prêt...</span>
              </div>
            ) : !generatedPost ? (
              <div className={styles.emptyStudioCard}>
                <div className={styles.emptyStudioIconCircle}>
                  <Sparkles size={26} />
                </div>
                <h3 className={styles.emptyStudioTitle}>Studio Prêt pour votre Création</h3>
                <p className={styles.emptyStudioText}>
                  Sélectionnez une offre, un événement ou saisissez votre plat du jour, puis cliquez sur <strong>« Générer l&apos;Affiche &amp; la Légende »</strong>.
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

                <button
                  type="button"
                  onClick={() => setMobileStep(1)}
                  className={styles.mobileStartBtn}
                >
                  <PenLine size={15} />
                  <span>Commencer à l&apos;Étape 1</span>
                </button>
              </div>
            ) : (
              <div className={styles.mockupCard}>
                {/* Barre supérieure mobile pour modifier facilement les choix */}
                <div className={styles.previewTopBarMobile}>
                  <button
                    type="button"
                    onClick={handleModifyPrompt}
                    className={styles.modifyPromptBtn}
                    title="Revenir pour ajuster votre texte ou votre style"
                  >
                    <Undo2 size={13} />
                    <span>Modifier l&apos;annonce ou le style</span>
                  </button>
                  <span className={styles.previewSuccessBadge}>
                    <CheckCircle2 size={13} />
                    <span>Prêt à diffuser</span>
                  </span>
                </div>

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
                  {generatedPost.imageUrl ? (
                    <>
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
                          onClick={handleRetryImage}
                          disabled={isGeneratingImage}
                          className={styles.switchPosterBtn}
                          title="Régénérer une nouvelle image par IA"
                        >
                          <RefreshCw size={12} className={isGeneratingImage ? styles.spin : ''} />
                          <span>{isGeneratingImage ? "Génération..." : "Régénérer l'image"}</span>
                        </button>

                        <span className={styles.formatHint}>
                          {t('content.studio.formatNote')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className={styles.imageUnavailableFrame}>
                      <div className={styles.imageUnavailableContent}>
                        <div className={styles.imageUnavailableIconWrapper}>
                          <ImageIcon size={26} />
                        </div>
                        <p className={styles.imageUnavailableText}>
                          Image non disponible, réessayez plus tard.
                        </p>
                        <button
                          type="button"
                          onClick={handleRetryImage}
                          disabled={isGeneratingImage}
                          className={styles.retryImageBtn}
                        >
                          <RefreshCw size={13} className={isGeneratingImage ? styles.spin : ''} />
                          <span>
                            {isGeneratingImage
                              ? "Génération en cours..."
                              : "Réessayer"}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* LA LÉGENDE (Aperçu compact — Clic pour agrandir et voir par réseau) */}
                  <div className={styles.captionArea}>
                    <div className={styles.captionHeader}>
                      <span className={styles.captionTitle}>{t('content.studio.captionTitle')}</span>
                      <div className={styles.captionHeaderActions}>
                        <button
                          type="button"
                          onClick={handleRegenerateCaption}
                          disabled={isRegeneratingCaption || isGenerating}
                          className={styles.switchPosterBtn}
                          title={t('content.studio.regenerateTextTitle')}
                          style={{ opacity: isRegeneratingCaption ? 0.7 : 1 }}
                        >
                          <RefreshCw
                            size={11}
                            style={isRegeneratingCaption ? { animation: 'spin 1s linear infinite' } : undefined}
                          />
                          <span>{isRegeneratingCaption ? 'Réécriture IA...' : t('content.studio.regenerateText')}</span>
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
        {isImageModalOpen && Boolean(generatedPost?.imageUrl) && (
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
