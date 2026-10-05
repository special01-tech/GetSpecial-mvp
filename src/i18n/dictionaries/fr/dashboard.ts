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
    title: "Today's Opportunities",
    count: '{count} live detected',
    emptyTitle: 'All quiet for today',
    emptyDescription:
      'We are continuously monitoring local signals for high-impact opportunities.',
    emptyButton: 'View schedule',
  },
  offer: {
    title: 'Featured Offer',
    badge: 'Recommended',
  },
};
