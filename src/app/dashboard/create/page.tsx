'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Tag,
  Calendar,
  PenTool,
  Share2,
  RefreshCw,
  Send,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  Flame,
  Check,
  X,
  AlertCircle,
  Loader2,
  Layers,
  ArrowRight,
  UtensilsCrossed,
  PartyPopper,
  Zap,
} from 'lucide-react';
import { INITIAL_RESTAURANT_OFFERS, RestaurantOffer } from '@/services/restaurant/restaurant-offers.data';
import { INITIAL_RESTAURANT_EVENTS, RestaurantEvent } from '@/services/restaurant/restaurant-events.data';
import styles from './create.module.css';

type SourceType = 'offer' | 'event' | 'custom';
type Platform = 'instagram' | 'facebook' | 'google_business' | 'tiktok';
type VisualStyle = 'gourmet' | 'festive' | 'chic' | 'deal';

function StudioCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [restaurantName, setRestaurantName] = useState('Le Petit Bistrot');
  const [restaurantId, setRestaurantId] = useState('rest_demo_austin_1');

  // Données disponibles
  const [availableOffers, setAvailableOffers] = useState<RestaurantOffer[]>(INITIAL_RESTAURANT_OFFERS);
  const [availableEvents, setAvailableEvents] = useState<RestaurantEvent[]>(INITIAL_RESTAURANT_EVENTS);

  // Formulaire de configuration
  const [sourceType, setSourceType] = useState<SourceType>('offer');
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customDiscount, setCustomDiscount] = useState('-20%');

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

  // Modal de programmation
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('2026-10-02');
  const [scheduledTime, setScheduledTime] = useState('18:30');

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

      // Charger offres
      const storedOffers = localStorage.getItem('getspecial_restaurant_offers');
      if (storedOffers) {
        const parsedO = JSON.parse(storedOffers);
        if (Array.isArray(parsedO) && parsedO.length > 0) {
          setAvailableOffers(parsedO);
          setSelectedOfferId(parsedO[0].id);
        }
      } else {
        setSelectedOfferId(INITIAL_RESTAURANT_OFFERS[0].id);
      }

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

      // Query params éventuels (?type=offer&id=... ou ?type=event&id=...)
      const pType = searchParams.get('type') as SourceType | null;
      const pId = searchParams.get('id');
      if (pType && ['offer', 'event', 'custom'].includes(pType)) {
        setSourceType(pType);
        if (pType === 'offer' && pId) setSelectedOfferId(pId);
        if (pType === 'event' && pId) setSelectedEventId(pId);
      }
    } catch {
      // Ignorer
    }
  }, [searchParams]);

  // Génération automatique d'un premier mockup au chargement pour que l'écran soit tout de suite vivant
  useEffect(() => {
    if (!generatedPost && availableOffers.length > 0) {
      const firstOffer = availableOffers[0];
      setGeneratedPost({
        title: firstOffer.name,
        caption: `OFFRE SPÉCIALE : ${firstOffer.name} !\n\n${firstOffer.description}\n\nFormule exclusive : ${firstOffer.discount || 'Offre du jour'}\n\nRendez-vous au restaurant ce soir !\nRéservez votre table dès maintenant.\n\n#restaurant #foodie #bonneadresse #faitmaison`,
        imageUrl: firstOffer.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
        alternativeImages: [
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
        ],
        discountValue: firstOffer.discount,
      });
    }
  }, [availableOffers, generatedPost]);

  // Action : Générer l'Affiche & la Légende
  const handleGenerate = async () => {
    setIsGenerating(true);

    let titleToUse = '';
    let descToUse = '';
    let discountToUse: string | undefined = undefined;

    if (sourceType === 'offer') {
      const targetOffer = availableOffers.find((o) => o.id === selectedOfferId) || availableOffers[0];
      titleToUse = targetOffer?.name || 'Offre Spéciale du Chef';
      descToUse = targetOffer?.description || 'Formule exclusive à découvrir aujourd’hui.';
      discountToUse = targetOffer?.discount || '-20%';
    } else if (sourceType === 'event') {
      const targetEvent = availableEvents.find((e) => e.id === selectedEventId) || availableEvents[0];
      titleToUse = targetEvent?.title || 'Événement Spécial';
      descToUse = targetEvent?.description || `Rendez-vous le ${targetEvent?.date || 'ce soir'} à l'établissement !`;
      discountToUse = targetEvent?.time ? `Ce soir ${targetEvent.time}` : 'Événement';
    } else {
      titleToUse = customTitle.trim() || 'Menu du Jour & Suggestions';
      descToUse = customDescription.trim() || 'Venez découvrir notre sélection fraîche du marché concoctée par le chef.';
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
        setNotice('Affiche & Légende générées avec succès !');
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
    if (!generatedPost || !generatedPost.alternativeImages.length) return;
    const nextIdx = (activeImgIndex + 1) % generatedPost.alternativeImages.length;
    setActiveImgIndex(nextIdx);
    setGeneratedPost({
      ...generatedPost,
      imageUrl: generatedPost.alternativeImages[nextIdx],
    });
  };

  // Régénérer uniquement la légende
  const handleRegenerateCaption = () => {
    if (!generatedPost) return;
    const variations = [
      `${generatedPost.title} à l'honneur chez ${restaurantName} !\n\nUne expérience culinaire unique à partager sans modération.\n\n${restaurantName}\nRéservez votre table en quelques clics ou venez directement !\n\n#restaurant #foodie #lepetitbistrot #bonneadresse`,
      `ALERTE GOURMANDE chez ${restaurantName} !\n\n${generatedPost.title} est disponible dès aujourd'hui.\n${generatedPost.discountValue ? `Formule exclusive : ${generatedPost.discountValue}\n` : ''}\nEnvie de vous régaler ? On vous garde une table !\n\n#foodlover #restaurant #tapas #gastronomie`,
      `Ne manquez pas : ${generatedPost.title} !\n\nAmbiance chaleureuse, produits frais et moments de partage garantis chez ${restaurantName}.\n\nVenez nous rendre visite ce midi ou ce soir.\nPlus d'infos en message ou sur place !\n\n#foodies #restau #paris #faitmaison`,
    ];
    const newCaption = variations[Math.floor(Math.random() * variations.length)];
    setGeneratedPost({
      ...generatedPost,
      caption: newCaption,
    });
    setNotice('Légende reformulée avec succès.');
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
      setNotice(`Publication diffusée en direct sur ${platform.toUpperCase()} avec succès !`);
      setTimeout(() => {
        router.push('/dashboard/planning');
      }, 1200);
    } catch {
      setNotice('Post validé et ajouté au calendrier.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Enregistrer la programmation
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduleOpen(false);
    setNotice(`Affiche programmée pour diffusion le ${scheduledDate} à ${scheduledTime}.`);
    setTimeout(() => {
      router.push('/dashboard/planning');
    }, 1200);
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.titleGroup}>
              <div className={styles.iconBadge}>
                <Sparkles size={22} />
              </div>
              <div>
                <h1 className={styles.pageTitle}>Studio Créatif IA</h1>
                <p className={styles.pageSubtitle}>
                  Choisissez une offre, un événement ou saisissez une idée libre : l&apos;IA génère l&apos;affiche et la légende prêtes à publier.
                </p>
              </div>
            </div>

            <div className={styles.tagLive}>
              <span className={styles.pulseDot} />
              <span>Génération IA Instantanée</span>
            </div>
          </div>

          {notice && (
            <div className={styles.noticeBanner}>
              <CheckCircle2 size={18} />
              <span>{notice}</span>
            </div>
          )}
        </header>

        {/* Grille principale : Paramètres (Gauche) & Aperçu Post (Droite) */}
        <div className={styles.studioGrid}>
          {/* COLONNE GAUCHE : Sélecteur & Paramètres */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Layers size={18} color="#FF6B4A" />
                <span>1. Que souhaitez-vous promouvoir ?</span>
              </h2>
            </div>

            {/* Sélecteur de type : Offre, Événement ou Saisie Libre */}
            <div className={styles.typeSelector}>
              <button
                type="button"
                onClick={() => setSourceType('offer')}
                className={`${styles.typeBtn} ${sourceType === 'offer' ? styles.typeBtnActive : ''}`}
              >
                <Tag size={16} />
                <span>Mon Offre</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('event')}
                className={`${styles.typeBtn} ${sourceType === 'event' ? styles.typeBtnActive : ''}`}
              >
                <Calendar size={16} />
                <span>Mon Événement</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('custom')}
                className={`${styles.typeBtn} ${sourceType === 'custom' ? styles.typeBtnActive : ''}`}
              >
                <PenTool size={16} />
                <span>Saisie libre</span>
              </button>
            </div>

            {/* CAS 1 : Choisir parmi les offres configurées */}
            {sourceType === 'offer' && (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Sélectionnez votre offre du restaurant :</label>
                <select
                  value={selectedOfferId}
                  onChange={(e) => setSelectedOfferId(e.target.value)}
                  className={styles.select}
                >
                  {availableOffers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} {off.discount ? `(${off.discount})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* CAS 2 : Choisir parmi les événements configurés */}
            {sourceType === 'event' && (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Sélectionnez l&apos;événement à diffuser :</label>
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

            {/* CAS 3 : Saisie libre / Plat du jour */}
            {sourceType === 'custom' && (
              <>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Titre ou plat à mettre en avant :</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Ex. Côte de bœuf maturée, Soirée Cocktail Mojito..."
                    className={styles.input}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Description ou formule :</label>
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Ex. Servie avec frites maison et sauce béarnaise pour 2 personnes..."
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Badge réduction ou prix spécial :</label>
                  <input
                    type="text"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(e.target.value)}
                    placeholder="Ex. 14,90€, -20%, Cocktail offert..."
                    className={styles.input}
                  />
                </div>
              </>
            )}

            {/* Réseau social cible */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Canal de diffusion :</label>
              <div className={styles.platformRow}>
                {(['instagram', 'facebook', 'google_business', 'tiktok'] as Platform[]).map((p) => (
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
              <label className={styles.label}>Ambiance visuelle de l&apos;affiche :</label>
              <div className={styles.stylesGrid}>
                {[
                  { id: 'gourmet', label: 'Gourmand & Chaleureux', icon: UtensilsCrossed },
                  { id: 'festive', label: 'Festif & Soirée', icon: PartyPopper },
                  { id: 'chic', label: 'Chic & Épuré', icon: Sparkles },
                  { id: 'deal', label: 'Promo Choc & Deal', icon: Zap },
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
                      <StyleIcon size={16} strokeWidth={1.75} />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bouton Générer */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className={styles.generateBtn}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Génération de l&apos;Affiche & de la Légende...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Générer l&apos;Affiche & la Légende par IA</span>
                </>
              )}
            </button>
          </div>

          {/* COLONNE DROITE : Aperçu du Post (Affiche + Légende) */}
          <div className={styles.previewSection}>
            <div className={styles.mockupCard}>
              {/* Header Réseau Social */}
              <div className={styles.mockupHeader}>
                <div className={styles.mockupUser}>
                  <div className={styles.mockupAvatar}>
                    {restaurantName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.mockupMeta}>
                    <span className={styles.mockupName}>{restaurantName}</span>
                    <span className={styles.mockupTime}>Aperçu diffusion • {platform.toUpperCase()}</span>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#FF6B4A', background: '#FFF5F2', padding: '3px 8px', borderRadius: 4 }}>
                  Post IA
                </span>
              </div>

              {/* L'AFFICHE (Visuel HD) */}
              <div className={styles.posterFrame}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    generatedPost?.imageUrl ||
                    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
                  }
                  alt={generatedPost?.title || 'Affiche restaurant'}
                  className={styles.posterImage}
                />
                <div className={styles.posterOverlay}>
                  <div className={styles.posterBadges}>
                    {generatedPost?.discountValue && (
                      <span className={styles.posterDiscountBadge}>
                        {generatedPost.discountValue}
                      </span>
                    )}
                    <span className={styles.posterNetworkBadge}>
                      {platform.toUpperCase()}
                    </span>
                  </div>

                  <div className={styles.posterBottomInfo}>
                    <h3 className={styles.posterHeadline}>{generatedPost?.title || 'Votre Spécialité'}</h3>
                    <p className={styles.posterSub}>Disponible chez {restaurantName}</p>
                  </div>
                </div>
              </div>

              {/* Actions sous l'affiche */}
              <div className={styles.posterActionRow}>
                <button
                  type="button"
                  onClick={handleSwitchPoster}
                  className={styles.switchPosterBtn}
                  title="Changer pour un autre visuel"
                >
                  <RefreshCw size={13} />
                  <span>Changer l&apos;affiche (Autre visuel)</span>
                </button>

                <span style={{ fontSize: 11, color: '#94A3B8' }}>
                  Format optimisé 4:3 HD
                </span>
              </div>

              {/* LA LÉGENDE (Texte du post) */}
              <div className={styles.captionArea}>
                <div className={styles.captionHeader}>
                  <span className={styles.captionTitle}>Légende & Copywriting</span>
                  <button
                    type="button"
                    onClick={handleRegenerateCaption}
                    className={styles.switchPosterBtn}
                    title="Générer une autre variante de texte"
                  >
                    <RefreshCw size={12} />
                    <span>Régénérer texte</span>
                  </button>
                </div>

                <textarea
                  value={generatedPost?.caption || ''}
                  onChange={(e) =>
                    setGeneratedPost((prev) => (prev ? { ...prev, caption: e.target.value } : null))
                  }
                  className={styles.editCaptionInput}
                  placeholder="La légende du post apparaîtra ici..."
                />
              </div>
            </div>

            {/* Actions finales : Publier ou Programmer */}
            <div className={styles.finalActionsBar}>
              <button
                type="button"
                onClick={handlePublishNow}
                disabled={isGenerating || !generatedPost}
                className={styles.publishNowBtn}
              >
                <Send size={16} />
                <span>Publier maintenant</span>
              </button>

              <button
                type="button"
                onClick={() => setIsScheduleOpen(true)}
                disabled={isGenerating || !generatedPost}
                className={styles.scheduleBtn}
              >
                <Clock size={16} />
                <span>Programmer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Programmer */}
        {isScheduleOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Programmer la publication</h3>
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
                  <label className={styles.label}>Date de diffusion :</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Heure de diffusion :</label>
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
                  <span>Confirmer la programmation</span>
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
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Chargement du Studio...</div>}>
      <StudioCreateContent />
    </Suspense>
  );
}
