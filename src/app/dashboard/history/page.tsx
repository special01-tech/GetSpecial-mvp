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
} from 'lucide-react';
import styles from './history.module.css';

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
  const [activeTab, setActiveTab] = useState<'proposals' | 'publications'>('proposals');
  const [proposalFilter, setProposalFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [publications, setPublications] = useState<PublicationItem[]>([]);

  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setProposals(json.data.proposals || []);
          setPublications(json.data.publications || []);
        }
      })
      .catch((err) => console.error('Erreur chargement historique:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProposals = proposals.filter((p) => {
    if (proposalFilter === 'all') return true;
    return p.status === proposalFilter;
  });

  const handleCreateInStudio = (title: string, description: string) => {
    const params = new URLSearchParams({
      type: 'custom',
      title,
      desc: description,
    });
    router.push(`/dashboard/create?${params.toString()}`);
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitleRow}>
          <div className={styles.iconCircle} aria-hidden="true">
            <History size={22} color="#ff5a00" strokeWidth={2.2} />
          </div>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Historique d&apos;Activité</h1>
            <p className={styles.subtitle}>
              Suivez les opportunités détectées et vos publications diffusées.
            </p>
          </div>
        </div>

        {/* 2 Onglets Principaux (Segmented control tactile) */}
        <nav className={styles.navTabs} aria-label="Catégories d'historique">
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
      ) : activeTab === 'proposals' ? (
        /* SOUS-SECTION 1 : HISTORIQUE DES PROPOSITIONS GÉRANT */
        <section className={styles.section}>
          {/* Ruban tactile de filtres horizontaux */}
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
                <span>Rejetées ({proposals.filter((p) => p.status === 'rejected').length})</span>
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
                  {/* Ligne 1 : Date & Statut alignés proprement */}
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

                  {/* Ligne 2 : Titre pleine largeur (sans coupure de mot) */}
                  <h3 className={styles.cardTitle}>{item.title}</h3>

                  {/* Ligne 3 : Description aérée */}
                  <p className={styles.cardDesc}>{item.description}</p>

                  {/* Motif de rejet éventuel */}
                  {item.rejectionReason && (
                    <div className={styles.rejectionBox}>
                      <AlertCircle size={14} />
                      <span><strong>Motif :</strong> {item.rejectionReason}</span>
                    </div>
                  )}

                  {/* Ligne 4 : Badges contextuels & Bouton Action direct vers le Studio */}
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
        /* SOUS-SECTION 2 : HISTORIQUE DES PUBLICATIONS DIFFUSÉES PAR CANAL */
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
    </div>
  );
}
