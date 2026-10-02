'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import PostInsights from '@/components/ui/PostInsights/PostInsights';
import {
  MOCK_DETAILED_POST,
  DetailedPostStats,
} from '@/services/insights/post-insights.data';
import styles from './post-detail.module.css';

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;

  const [post, setPost] = useState<DetailedPostStats>(MOCK_DETAILED_POST);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    fetch('/api/analytics')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data && Array.isArray(json.data.posts)) {
          const matched = json.data.posts.find((p: any) => p.id === postId);
          if (matched) {
            setPost({
              id: matched.id,
              title: matched.content.slice(0, 60) + (matched.content.length > 60 ? '...' : ''),
              imageUrl: matched.thumbnailUrl || MOCK_DETAILED_POST.imageUrl,
              platform: matched.platform || 'tiktok',
              date: new Date(matched.publishedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
              time: new Date(matched.publishedAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              }),
              postUrl: matched.url,
              views: matched.views || 0,
              likes: matched.likes || 0,
              comments: matched.comments || 0,
              shares: matched.shares || 0,
              metrics: {
                views: matched.views,
                likes: matched.likes,
                comments: matched.comments || 0,
                shares: matched.shares || 0,
                engagementRate: `${matched.engagementRate}%`,
              },
              demographics: MOCK_DETAILED_POST.demographics,
            });
          }
        }
      })
      .catch((err) => console.warn('Could not load post analytics:', err));
  }, [postId]);

  const handleViewPost = () => {
    setNotice(`Redirection vers la publication en direct sur ${post.platform.toUpperCase()}...`);
    setTimeout(() => {
      window.open(post.postUrl, '_blank');
      setNotice(null);
    }, 600);
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header avec Navigation Retour */}
        <header className={styles.header}>
          <button
            type="button"
            onClick={() => router.push('/dashboard/insights')}
            className={styles.backBtn}
            aria-label="Retour aux insights"
          >
            <ArrowLeft size={18} />
          </button>

          <div className={styles.headerTitleGroup}>
            <h1 className={styles.pageTitle}>Détail de la publication</h1>
            <span className={styles.statusLive}>Diffusé via IA</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: post.title,
                  url: post.postUrl,
                });
              } else {
                setNotice('Lien copié dans le presse-papier !');
                setTimeout(() => setNotice(null), 2500);
              }
            }}
            className={styles.shareIconBtn}
            aria-label="Partager les statistiques"
          >
            <Share2 size={16} />
          </button>
        </header>

        {/* Notice temporaire */}
        {notice && (
          <div className={styles.noticeBanner}>
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
        )}

        {/* Composant Métier PostInsights */}
        <main className={styles.mainContent}>
          <PostInsights post={post} onViewPost={handleViewPost} />
        </main>

        {/* Spacer pour Bottom Navigation */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
