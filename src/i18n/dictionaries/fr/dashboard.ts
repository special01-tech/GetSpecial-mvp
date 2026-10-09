/* =============================================================================
 * i18n — Dictionnaire FR : tableau de bord (Today)
 * (Rempli lors de la migration de src/app/dashboard/page.tsx)
 * ============================================================================= */

export const dashboard = {
  header: {
    activePartner: 'Partenaire actif',
    resumeTitle: 'Reprendre la publication automatisée',
    pauseTitle: "Mettre en pause d'urgence toute publication automatisée",
    paused: 'En pause',
    pause: 'Pause',
  },
  greeting: {
    title: 'Bonjour !',
    subtitle:
      "Voici ce que nous avons découvert pour votre restaurant aujourd'hui.",
    cta: 'Découvrir les opportunités',
    ctaBadge: '{count} suggestions',
  },
  studio: {
    title: 'Studio Créatif : Générer une affiche & légende à la demande',
    subtitle:
      'Choisissez votre offre, votre soirée ou tapez une idée libre pour créer un post en 3s.',
    cta: 'Créer',
  },
  banner: {
    paused: 'Emergency Pause active. No automated campaigns will be published.',
    active: 'Live automation active. AI is monitoring signals and scheduling posts.',
  },
  signals: {
    live: 'Signaux en direct (Météo & Événements)',
    connecting: 'Connexion aux signaux...',
    autoSync: '• Auto-sync active (30s)',
    refreshTitle:
      'Forcer la synchronisation immédiate des signaux météo et événements',
    syncing: 'Synchronisation...',
    refresh: 'Actualiser',
  },
  fallback: {
    weatherCondition: 'Ciel Dégagé • Austin, TX',
    terraceAdviceNoon: 'Conditions idéales pour le service en terrasse ce midi.',
    terraceAdvice: 'Conditions idéales pour le service en terrasse.',
    eventTitle: 'Concerts & Matchs Locaux',
    eventTime: 'Ce soir',
  },
  opportunities: {
    title: 'Actions marketing du jour',
    count: '{count} opportunités détectées',
    emptyTitle: 'Aucune opportunité pour le moment',
    emptyDescription:
      "GetSpecial analyse en continu la météo et les événements pour vous proposer les meilleures opportunités.",
    emptyButton: 'Voir le planning',
  },
  offer: {
    title: 'Offre spéciale du jour',
    badge: 'Recommandée par l’IA',
  },
  events: {
    title: 'Événements',
    badge: '{count} temps forts aujourd’hui',
  },
  insights: {
    title: 'Impact & Performance',
    badge: 'Derniers 30 jours',
    viewsLabel: 'Vues totales',
    viewsSub: 'Sur vos réseaux connectés',
    engagementLabel: "Taux d'engagement",
    engagementSub: 'Moyenne secteur : 4.5%',
    coversLabel: 'Couverts estimés',
    coversSub: 'Générés par GetSpecial',
  },
  stats: {
    totalPosts: 'Publications totales',
    totalPostsSub: 'Au total',
    scheduled: 'Programmées',
    scheduledSub: 'À venir',
    published: 'Publiées',
    publishedSub: 'Historique',
    thisWeek: 'Cette semaine',
    thisWeekSub: '7 derniers jours',
  },
  marketingContext: {
    title: 'Contexte Marketing',
    today: 'Aujourd’hui :',
    detectedSignals: 'ÉVÉNEMENTS & SIGNAUX DÉTECTÉS',
    noSignals: 'Aucun signal actif pour le moment.',
    boostAction: 'Créer un post pour ce signal',
  },
  recentPosts: {
    title: 'Dernières publications',
    viewAll: 'Voir tout',
    emptyTitle: 'Aucune publication pour l’instant',
    emptyDescription: 'Vos publications apparaîtront ici dès que vous les aurez publiées.',
    empty: 'Aucune publication pour le moment.',
  },
};

