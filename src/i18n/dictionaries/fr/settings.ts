/* =============================================================================
 * i18n — Dictionnaire FR : réglages & divers (settings, more)
 * (Rempli lors de la migration de settings / more)
 * ============================================================================= */

export const settings = {
  pauseOn: 'Emergency Pause active. Toutes les publications sont suspendues.',
  pauseOff:
    'Automatisation active. GetSpecial surveille vos signaux et prépare vos posts.',
  header: {
    title: 'Paramètres & Sécurité',
    subtitle:
      'Gérez vos canaux connectés, vos limites de publication et la sécurité de {name}.',
  },
  emergency: {
    title: "Disjoncteur d'Urgence (Emergency Pause)",
    paused: 'Publications totalement suspendues',
    normal: 'Mode normal actif',
    description:
      "En cas de rush imprévu ou de fermeture temporaire, suspendez toutes les publications d'un simple tap.",
    resume: 'Reprendre l’assistant',
    pause: 'Mettre en Pause',
  },
  channels: {
    title: 'Canaux de Diffusion Connectés',
    tiktokDescription: 'Connecté via passerelle unifiée Zernio',
    connected: 'Connecté',
    instagramDescription: 'Prêt pour liaison directe ou publication guidée',
    ready: 'Prêt',
    facebookGoogleDescription: 'Synchronisation des fiches locales',
    optional: 'Liaison optionnelle',
  },
  frequency: {
    title: 'Règles Anti-Fatigue & Fréquence',
    capLabel: 'Plafond de publication quotidienne',
    capDescription:
      'Limite le nombre de posts automatiques par jour pour ne jamais lasser votre audience.',
    onePerDay: '1 post par jour (Recommandé)',
    twoPerDay: '2 posts par jour max',
    validationLabel: 'Validation obligatoire par le gérant',
    validationDescription:
      "Rien n'est publié sans votre approbation explicite sur l'écran Today.",
    strictlyActive: 'Strictement actif',
  },
  session: {
    label: 'Session utilisateur',
    description: "Déconnecter l'appareil actuel de votre compte GetSpecial.",
    logout: 'Déconnexion',
  },
  language: {
    title: "Langue de l'interface",
    description: 'Choisissez la langue d’affichage de GetSpecial.',
  },
};
