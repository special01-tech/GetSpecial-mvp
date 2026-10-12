'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Share2,
  Instagram,
  Facebook,
  Globe,
  AlertCircle,
  ExternalLink,
  Filter
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
  const [activeTab, setActiveTab] = useState<'proposals' | 'publications'>('proposals');
  const [proposalFilter, setProposalFilter] = useState<'all' | 'confirmed' | 'rejected'>('all');
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

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram size={18} color="#E1306C" />;
      case 'facebook':
        return <Facebook size={18} color="#1877F2" />;
      default:
        return <Globe size={18} color="#059669" />;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitleRow}>
          <div className={styles.iconCircle}>
            <History size={24} color="#ff6600" />
          </div>
          <div>
            <h1 className={styles.title}>Historique d'Activité</h1>
            <p className={styles.subtitle}>
              Consultez les propositions validées ou rejetées par le gérant et l'historique des publications sur vos réseaux.
            </p>
          </div>
        </div>

        {/* 2 Onglets Principaux */}
        <nav className={styles.navTabs}>
          <button
            type="button"
            onClick={() => setActiveTab('proposals')}
            className={`${styles.tabBtn} ${activeTab === 'proposals' ? styles.tabActive : ''}`}
          >
            Propositions Gérant ({proposals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('publications')}
            className={`${styles.tabBtn} ${activeTab === 'publications' ? styles.tabActive : ''}`}
          >
            Publications Diffusées ({publications.length})
          </button>
        </nav>
      </header>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Chargement de l'historique en direct...</p>
        </div>
      ) : activeTab === 'proposals' ? (
        /* SOUS-SECTION 1 : HISTORIQUE DES PROPOSITIONS GÉRANT */
        <section className={styles.section}>
          {/* Sous-filtre pour les propositions */}
          <div className={styles.subFilterBar}>
            <span className={styles.filterLabel}>
              <Filter size={14} /> Filtrer les décisions :
            </span>
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
                onClick={() => setProposalFilter('confirmed')}
                className={`${styles.pillBtn} ${proposalFilter === 'confirmed' ? styles.pillActive : ''}`}
              >
                <CheckCircle2 size={14} color="#15803d" />
                Confirmées ({proposals.filter((p) => p.status === 'confirmed').length})
              </button>
              <button
                type="button"
                onClick={() => setProposalFilter('rejected')}
                className={`${styles.pillBtn} ${proposalFilter === 'rejected' ? styles.pillActive : ''}`}
              >
                <XCircle size={14} color="#b91c1c" />
                Infirmées / Rejetées ({proposals.filter((p) => p.status === 'rejected').length})
              </button>
            </div>
          </div>

          {filteredProposals.length === 0 ? (
            <div className={styles.emptyState}>
              <Clock size={40} color="#94a3b8" />
              <h3>Aucune proposition dans cette catégorie</h3>
              <p>Les prochaines opportunités générées s'afficheront ici au fil des services.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {filteredProposals.map((item) => (
                <div key={item.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <span className={styles.dateBadge}>
                        {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <h3 className={styles.cardTitle}>{item.title}</h3>
                    </div>

                    {item.status === 'confirmed' ? (
                      <span className={`${styles.statusBadge} ${styles.badgeConfirmed}`}>
                        <CheckCircle2 size={16} /> Confirmé par le gérant
                      </span>
                    ) : item.status === 'rejected' ? (
                      <span className={`${styles.statusBadge} ${styles.badgeRejected}`}>
                        <XCircle size={16} /> Infirmé / Non retenu
                      </span>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles.badgePending}`}>
                        <Clock size={16} /> En attente de décision
                      </span>
                    )}
                  </div>

                  <p className={styles.cardDesc}>{item.description}</p>

                  {item.rejectionReason && (
                    <div className={styles.rejectionBox}>
                      <AlertCircle size={16} />
                      <span><strong>Motif :</strong> {item.rejectionReason}</span>
                    </div>
                  )}

                  <div className={styles.cardFooter}>
                    <span className={styles.cardMeta}>
                      Urgence : <strong>{item.urgency}</strong> | Contenus générés : {item.postsCount}
                    </span>
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
              <Share2 size={40} color="#94a3b8" />
              <h3>Aucune publication enregistrée pour l'instant</h3>
              <p>Dès qu'un post est validé et diffusé sur vos réseaux, il sera archivé avec son canal ici.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {publications.map((pub) => (
                <div key={pub.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className={styles.channelBadge}>
                        {getPlatformIcon(pub.platform)}
                        <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>
                          {pub.platform}
                        </span>
                      </div>
                      <span className={styles.dateBadge}>
                        Diffusé le {new Date(pub.publishedAt).toLocaleDateString('fr-FR', {
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
                        ? 'Publié en ligne'
                        : pub.status === 'failed'
                        ? 'Échec de publication'
                        : 'En cours d\'envoi'}
                    </span>
                  </div>

                  <div className={styles.pubBody}>
                    {pub.imageUrl && (
                      <div className={styles.pubThumb}>
                        <img src={pub.imageUrl} alt="Visuel publié" />
                      </div>
                    )}
                    <div className={styles.pubContent}>
                      <h4 className={styles.pubTitle}>{pub.postTitle}</h4>
                      <p className={styles.pubText}>{pub.postText}</p>
                    </div>
                  </div>

                  {pub.lastError && (
                    <div className={styles.rejectionBox}>
                      <AlertCircle size={16} />
                      <span><strong>Erreur réseau :</strong> {pub.lastError}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
