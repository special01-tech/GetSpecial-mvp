'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Share2,
  Globe,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  Maximize2,
  Download,
  Eye,
  X,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import styles from './history.module.css';

interface PosterItem {
  id: string;
  title: string;
  headline: string;
  text: string;
  instagramCaption?: string;
  facebookCaption?: string;
  hashtags: string[];
  imageUrl: string | null;
  mediaUrls: string[];
  aspectRatio: string;
  platform: string;
  status: string;
  origin: string;
  campaignType: string;
  createdAt: string;
  daFamilyId?: string | null;
  daFamilyName?: string | null;
  servingTemperature?: string | null;
  materials: string[];
  variety?: any;
  opportunityTitle?: string | null;
  isPublished: boolean;
  publicationsCount: number;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  urgency: string;
  createdAt: string;
  status: 'confirmed' | 'rejected' | 'pending';
  rejectionReason?: string | null;
  postsCount: number;
}

interface PublicationItem {
  id: string;
  platform: string;
  status: string;
  publishedAt: string;
  postTitle: string;
  postText: string;
  imageUrl?: string | null;
  lastError?: string | null;
}

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posters' | 'proposals' | 'publications'>('posters');
  const [posterFilter, setPosterFilter] = useState<'all' | 'with_image' | 'ready' | 'published'>('all');
  const [proposalFilter, setProposalFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);

  const [posters, setPosters] = useState<PosterItem[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [publications, setPublications] = useState<PublicationItem[]>([]);

  // Modal aperçu HD
  const [previewPoster, setPreviewPoster] = useState<PosterItem | null>(null);

  useEffect(() => {
    let url = '/api/history';
    try {
      const storedId = localStorage.getItem('getspecial_restaurant_id');
      if (storedId) {
        url += `?restaurantId=${encodeURIComponent(storedId)}`;
      }
    } catch {
      // Ignore
    }

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setPosters(json.data.posters || []);
          setProposals(json.data.proposals || []);
          setPublications(json.data.publications || []);
        }
      })
      .catch((err) => console.error('Erreur chargement historique:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateInStudio = (title: string, description: string) => {
    const params = new URLSearchParams({
      type: 'custom',
      title: title || '',
      desc: description || '',
    });
    router.push(`/dashboard/create?${params.toString()}`);
  };

  const handleDownloadImage = async (url: string, filename: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'affiche-getspecial.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
          </svg>
        );
      case 'facebook':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1877F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
          </svg>
        );
      default:
        return <Globe size={18} color="#059669" />;
    }
  };

  const formatServingTemperature = (temp?: string | null) => {
    if (!temp) return null;
    switch (temp.toLowerCase()) {
      case 'hot':
        return '🔥 Plat Chaud';
      case 'cold':
        return '❄️ Frais / Glacé';
      case 'room':
        return '🌱 Tempéré';
      case 'ambient':
        return '☕ Ambiance';
      default:
        return temp;
    }
  };

  // Filtrage des affiches
  const filteredPosters = posters.filter((p) => {
    if (posterFilter === 'with_image') return !!p.imageUrl;
    if (posterFilter === 'ready') return !p.isPublished;
    if (posterFilter === 'published') return p.isPublished;
    return true;
  });

  const postersWithImageCount = posters.filter((p) => !!p.imageUrl).length;
  const postersReadyCount = posters.filter((p) => !p.isPublished).length;
  const postersPublishedCount = posters.filter((p) => p.isPublished).length;

  // Filtrage des propositions
  const filteredProposals = proposals.filter((p) => {
    if (proposalFilter === 'all') return true;
    return p.status === proposalFilter;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitleRow}>
          <div className={styles.iconCircle} aria-hidden="true">
            <History size={22} color="#ff5a00" strokeWidth={2.2} />
          </div>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Historique & Galerie d&apos;Affiches</h1>
            <p className={styles.subtitle}>
              Retrouvez toutes vos affiches générées, vos opportunités et vos publications diffusées.
            </p>
          </div>
        </div>

        {/* 3 Onglets Principaux (Segmented control tactile) */}
        <nav className={styles.navTabs} aria-label="Catégories d'historique">
          <button
            type="button"
            onClick={() => setActiveTab('posters')}
            className={`${styles.tabBtn} ${activeTab === 'posters' ? styles.tabActive : ''}`}
          >
            Affiches générées ({posters.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('proposals')}
            className={`${styles.tabBtn} ${activeTab === 'proposals' ? styles.tabActive : ''}`}
          >
            Propositions ({proposals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('publications')}
            className={`${styles.tabBtn} ${activeTab === 'publications' ? styles.tabActive : ''}`}
          >
            Diffusées ({publications.length})
          </button>
        </nav>
      </header>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Chargement de l&apos;historique en direct...</p>
        </div>
      ) : activeTab === 'posters' ? (
        /* =====================================================================
         * SECTION 1 : GALERIE DE TOUTES LES AFFICHES GÉNÉRÉES
         * ===================================================================== */
        <section className={styles.section}>
          {/* Ruban tactile de filtres */}
          <div className={styles.subFilterBar}>
            <div className={styles.pillGroup}>
              <button
                type="button"
                onClick={() => setPosterFilter('all')}
                className={`${styles.pillBtn} ${posterFilter === 'all' ? styles.pillActive : ''}`}
              >
                Toutes ({posters.length})
              </button>
              <button
                type="button"
                onClick={() => setPosterFilter('with_image')}
                className={`${styles.pillBtn} ${posterFilter === 'with_image' ? styles.pillActive : ''}`}
              >
                <ImageIcon size={13} />
                <span>Avec visuel ({postersWithImageCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setPosterFilter('ready')}
                className={`${styles.pillBtn} ${posterFilter === 'ready' ? styles.pillActive : ''}`}
              >
                <Sparkles size={13} color="#ff5a00" />
                <span>En réserve ({postersReadyCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setPosterFilter('published')}
                className={`${styles.pillBtn} ${posterFilter === 'published' ? styles.pillActive : ''}`}
              >
                <CheckCircle2 size={13} color="#15803d" />
                <span>Diffusées ({postersPublishedCount})</span>
              </button>
            </div>
          </div>

          {filteredPosters.length === 0 ? (
            <div className={styles.emptyState}>
              <ImageIcon size={42} color="#94a3b8" />
              <h3>Aucune affiche dans cette vue</h3>
              <p>
                Toutes les créations d&apos;affiches et de posts générées par l&apos;IA s&apos;archiveront automatiquement ici.
              </p>
              <button
                type="button"
                onClick={() => router.push('/dashboard/create')}
                className={styles.emptyStateActionBtn}
              >
                <Sparkles size={15} />
                <span>Créer une affiche dans le Studio</span>
              </button>
            </div>
          ) : (
            <div className={styles.postersGrid}>
              {filteredPosters.map((poster) => {
                const dateStr = new Date(poster.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const tempLabel = formatServingTemperature(poster.servingTemperature);

                return (
                  <article key={poster.id} className={styles.posterCard}>
                    {/* Visual Media Wrap */}
                    <div
                      className={styles.posterMediaWrap}
                      onClick={() => setPreviewPoster(poster)}
                      role="button"
                      tabIndex={0}
                      title="Cliquer pour afficher l'affiche en haute définition"
                    >
                      <span className={styles.posterRatioBadge}>
                        {poster.aspectRatio || '4:5'}
                      </span>

                      {poster.isPublished ? (
                        <span className={styles.posterStatusBadge} style={{ color: '#15803d' }}>
                          <CheckCircle2 size={12} color="#15803d" />
                          <span>Diffusée</span>
                        </span>
                      ) : poster.imageUrl ? (
                        <span className={styles.posterStatusBadge} style={{ color: '#ff5a00' }}>
                          <Sparkles size={12} color="#ff5a00" />
                          <span>Prête</span>
                        </span>
                      ) : (
                        <span className={styles.posterStatusBadge} style={{ color: '#64748b' }}>
                          <span>Texte seul</span>
                        </span>
                      )}

                      {poster.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={poster.imageUrl}
                          alt={poster.headline || poster.title}
                          className={styles.posterImage}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.posterPlaceholder}>
                          <Sparkles size={32} color="#f97316" />
                          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                            Contenu éditorial rédigé
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className={styles.posterBody}>
                      <div className={styles.posterTopRow}>
                        <span className={styles.posterDate}>
                          <Clock size={12} />
                          {dateStr}
                        </span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {getPlatformIcon(poster.platform)}
                        </div>
                      </div>

                      <h3 className={styles.posterHeadline}>
                        {poster.headline || poster.title || 'Affiche GetSpecial'}
                      </h3>

                      {/* DA Family & Food Profile Tags */}
                      <div className={styles.posterTagsRow}>
                        {poster.daFamilyName && (
                          <span className={styles.daFamilyBadge} title="Direction artistique">
                            <Sparkles size={10} />
                            <span>{poster.daFamilyName}</span>
                          </span>
                        )}
                        {tempLabel && (
                          <span className={styles.materialBadge} title="Texture culinaire">
                            <span>{tempLabel}</span>
                          </span>
                        )}
                        {Array.isArray(poster.materials) &&
                          poster.materials.slice(0, 2).map((mat, i) => (
                            <span key={i} className={styles.materialBadge}>
                              {mat}
                            </span>
                          ))}
                      </div>

                      {/* Caption Snippet */}
                      {(poster.instagramCaption || poster.text) && (
                        <p className={styles.posterCaptionPreview}>
                          {poster.instagramCaption || poster.text}
                        </p>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className={styles.posterFooter}>
                      <div className={styles.posterActionGroup}>
                        <button
                          type="button"
                          onClick={() => setPreviewPoster(poster)}
                          className={styles.posterActionBtn}
                          title="Aperçu grand format"
                        >
                          <Eye size={14} />
                          <span>Aperçu</span>
                        </button>

                        {poster.imageUrl && (
                          <button
                            type="button"
                            onClick={(e) =>
                              handleDownloadImage(
                                poster.imageUrl!,
                                `affiche-${poster.headline || poster.id}.png`,
                                e
                              )
                            }
                            className={styles.posterActionBtn}
                            title="Télécharger l'affiche HD"
                          >
                            <Download size={14} />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCreateInStudio(
                            poster.headline || poster.title,
                            poster.instagramCaption || poster.text
                          )
                        }
                        className={`${styles.posterActionBtn} ${styles.posterPrimaryBtn}`}
                        title="Ouvrir dans le Studio pour modifier ou régénérer"
                      >
                        <span>Studio</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : activeTab === 'proposals' ? (
        /* =====================================================================
         * SECTION 2 : HISTORIQUE DES PROPOSITIONS GÉRANT
         * ===================================================================== */
        <section className={styles.section}>
          {/* Ruban tactile de filtres */}
          <div className={styles.subFilterBar}>
            <div className={styles.pillGroup}>
              <button
                type="button"
                onClick={() => setProposalFilter('all')}
                className={`${styles.pillBtn} ${proposalFilter === 'all' ? styles.pillActive : ''}`}
              >
                Toutes ({proposals.length})
              </button>
              <button
                type="button"
                onClick={() => setProposalFilter('pending')}
                className={`${styles.pillBtn} ${proposalFilter === 'pending' ? styles.pillActive : ''}`}
              >
                <Clock size={13} />
                <span>En attente ({proposals.filter((p) => p.status === 'pending').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setProposalFilter('confirmed')}
                className={`${styles.pillBtn} ${proposalFilter === 'confirmed' ? styles.pillActive : ''}`}
              >
                <CheckCircle2 size={13} color="#15803d" />
                <span>Confirmées ({proposals.filter((p) => p.status === 'confirmed').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setProposalFilter('rejected')}
                className={`${styles.pillBtn} ${proposalFilter === 'rejected' ? styles.pillActive : ''}`}
              >
                <XCircle size={13} color="#b91c1c" />
                <span>Non retenues ({proposals.filter((p) => p.status === 'rejected').length})</span>
              </button>
            </div>
          </div>

          {filteredProposals.length === 0 ? (
            <div className={styles.emptyState}>
              <Clock size={36} color="#94a3b8" />
              <h3>Aucune proposition dans cette catégorie</h3>
              <p>Les prochaines opportunités générées s&apos;afficheront ici au fil de vos services.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {filteredProposals.map((item) => (
                <div key={item.id} className={styles.card}>
                  <div className={styles.cardTopRow}>
                    <div className={styles.cardDateWrap}>
                      <Clock size={12} className={styles.cardClockIcon} />
                      <span className={styles.dateBadge}>
                        {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {item.status === 'confirmed' ? (
                      <span className={`${styles.statusBadge} ${styles.badgeConfirmed}`}>
                        <CheckCircle2 size={13} />
                        <span>Confirmée</span>
                      </span>
                    ) : item.status === 'rejected' ? (
                      <span className={`${styles.statusBadge} ${styles.badgeRejected}`}>
                        <XCircle size={13} />
                        <span>Non retenue</span>
                      </span>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles.badgePending}`}>
                        <span className={styles.pendingDot} />
                        <span>En attente</span>
                      </span>
                    )}
                  </div>

                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardDesc}>{item.description}</p>

                  {item.rejectionReason && (
                    <div className={styles.rejectionBox}>
                      <AlertCircle size={14} />
                      <span><strong>Motif :</strong> {item.rejectionReason}</span>
                    </div>
                  )}

                  <div className={styles.cardFooter}>
                    <div className={styles.metaBadgesRow}>
                      {item.urgency === 'high' ? (
                        <span className={styles.urgentBadge}>
                          <Flame size={12} />
                          <span>Priorité Haute</span>
                        </span>
                      ) : (
                        <span className={styles.normalBadge}>
                          <Zap size={12} />
                          <span>Opportunité</span>
                        </span>
                      )}

                      {item.postsCount > 0 ? (
                        <span className={styles.postsCountBadge}>
                          <Sparkles size={11} />
                          <span>{item.postsCount} post{item.postsCount > 1 ? 's' : ''} généré{item.postsCount > 1 ? 's' : ''}</span>
                        </span>
                      ) : (
                        <span className={styles.noPostsBadge}>
                          <span>0 contenu</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCreateInStudio(item.title, item.description)}
                      className={styles.createInStudioBtn}
                      title="Générer directement l'affiche et la légende dans le Studio"
                    >
                      <span>Créer dans le Studio</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* =====================================================================
         * SECTION 3 : HISTORIQUE DES PUBLICATIONS DIFFUSÉES PAR CANAL
         * ===================================================================== */
        <section className={styles.section}>
          {publications.length === 0 ? (
            <div className={styles.emptyState}>
              <Share2 size={36} color="#94a3b8" />
              <h3>Aucune publication enregistrée pour l&apos;instant</h3>
              <p>Dès qu&apos;un post est validé et diffusé sur vos réseaux, il sera archivé avec son canal ici.</p>
              <button
                type="button"
                onClick={() => router.push('/dashboard/create')}
                className={styles.emptyStateActionBtn}
              >
                <Sparkles size={15} />
                <span>Créer un premier post dans le Studio</span>
              </button>
            </div>
          ) : (
            <div className={styles.list}>
              {publications.map((pub) => (
                <div key={pub.id} className={styles.card}>
                  <div className={styles.cardTopRow}>
                    <div className={styles.channelBadge}>
                      {getPlatformIcon(pub.platform)}
                      <span className={styles.pubPlatformName}>
                        {pub.platform === 'google_business' ? 'Google' : pub.platform}
                      </span>
                      <span className={styles.cardDateSeparator}>•</span>
                      <span className={styles.dateBadge}>
                        {new Date(pub.publishedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <span
                      className={`${styles.statusBadge} ${
                        pub.status === 'published'
                          ? styles.badgeConfirmed
                          : pub.status === 'failed'
                          ? styles.badgeRejected
                          : styles.badgePending
                      }`}
                    >
                      {pub.status === 'published'
                        ? 'En ligne'
                        : pub.status === 'failed'
                        ? 'Échec'
                        : 'En cours'}
                    </span>
                  </div>

                  <div className={styles.pubBody}>
                    {pub.imageUrl && (
                      <div className={styles.pubThumb}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pub.imageUrl} alt={pub.postTitle || 'Visuel publié'} />
                      </div>
                    )}
                    <div className={styles.pubContent}>
                      <h4 className={styles.pubTitle}>{pub.postTitle}</h4>
                      <p className={styles.pubText}>{pub.postText}</p>
                    </div>
                  </div>

                  {pub.lastError && (
                    <div className={styles.rejectionBox}>
                      <AlertCircle size={14} />
                      <span><strong>Erreur réseau :</strong> {pub.lastError}</span>
                    </div>
                  )}

                  <div className={styles.cardFooter}>
                    <button
                      type="button"
                      onClick={() => handleCreateInStudio(pub.postTitle, pub.postText)}
                      className={styles.createInStudioBtn}
                    >
                      <span>Décliner une nouvelle version</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =====================================================================
       * MODAL APERÇU HAUTE DÉFINITION & DÉTAILS ARTISTIQUES
       * ===================================================================== */}
      {previewPoster && (
        <div
          className={styles.modalOverlay}
          onClick={() => setPreviewPoster(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Côté Image HD */}
            <div className={styles.modalImageSide}>
              {previewPoster.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewPoster.imageUrl}
                  alt={previewPoster.headline || previewPoster.title}
                  className={styles.modalPosterImg}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <ImageIcon size={48} />
                  <p style={{ marginTop: 10 }}>Aucun visuel généré pour ce post</p>
                </div>
              )}
            </div>

            {/* Côté Informations & Actions */}
            <div className={styles.modalInfoSide}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitleGroup}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={styles.dateBadge}>
                      {new Date(previewPoster.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className={styles.posterRatioBadge}>
                      {previewPoster.aspectRatio || '4:5'}
                    </span>
                  </div>
                  <h2 className={styles.modalHeadline}>
                    {previewPoster.headline || previewPoster.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewPoster(null)}
                  className={styles.modalCloseBtn}
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Badges de Direction Artistique */}
              <div>
                <p className={styles.modalSectionTitle}>Direction Artistique & Identité</p>
                <div className={styles.posterTagsRow}>
                  {previewPoster.daFamilyName && (
                    <span className={styles.daFamilyBadge}>
                      <Sparkles size={11} />
                      <span>{previewPoster.daFamilyName}</span>
                    </span>
                  )}
                  {previewPoster.servingTemperature && (
                    <span className={styles.materialBadge}>
                      <span>{formatServingTemperature(previewPoster.servingTemperature)}</span>
                    </span>
                  )}
                  {Array.isArray(previewPoster.materials) &&
                    previewPoster.materials.map((mat, i) => (
                      <span key={i} className={styles.materialBadge}>
                        {mat}
                      </span>
                    ))}
                </div>
              </div>

              {/* Texte / Légende */}
              <div>
                <p className={styles.modalSectionTitle}>Légende Réseaux Sociaux</p>
                <div className={styles.modalTextContent}>
                  {previewPoster.instagramCaption ||
                    previewPoster.text ||
                    'Aucune légende rédigée.'}
                </div>
              </div>

              {/* Hashtags */}
              {Array.isArray(previewPoster.hashtags) && previewPoster.hashtags.length > 0 && (
                <div>
                  <p className={styles.modalSectionTitle}>Hashtags</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {previewPoster.hashtags.map((h, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.74rem',
                          color: '#2563EB',
                          background: '#EFF6FF',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                      >
                        {h.startsWith('#') ? h : `#${h}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className={styles.modalActionsRow}>
                {previewPoster.imageUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadImage(
                        previewPoster.imageUrl!,
                        `affiche-${previewPoster.headline || previewPoster.id}.png`
                      )
                    }
                    className={styles.modalFullBtn}
                    style={{
                      background: '#F1F5F9',
                      color: '#0F172A',
                      border: '1px solid #CBD5E1',
                    }}
                  >
                    <Download size={15} />
                    <span>Télécharger HD</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const h = previewPoster.headline || previewPoster.title;
                    const c = previewPoster.instagramCaption || previewPoster.text;
                    setPreviewPoster(null);
                    handleCreateInStudio(h, c);
                  }}
                  className={styles.modalFullBtn}
                  style={{
                    background: '#FF5A00',
                    color: '#FFFFFF',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(255, 90, 0, 0.25)',
                  }}
                >
                  <Sparkles size={15} />
                  <span>Ouvrir dans le Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
