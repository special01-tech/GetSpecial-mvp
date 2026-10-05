/* =============================================================================
 * i18n — Dictionnaire FR : espace restaurant (profil, comptes, offres, events)
 * (Rempli lors de la migration de src/app/dashboard/restaurant/**)
 * ============================================================================= */

export const restaurant = {
  header: {
    subtitle: "Gestion de l'établissement & IA",
  },
  tabs: {
    label: 'Sections du restaurant',
    profile: 'Profil',
    offers: 'Offres',
    events: 'Événements',
    accounts: 'Comptes',
  },
  profile: {
    themeToLight: 'Passer en mode clair',
    themeToDark: 'Passer en mode sombre',
    activateLight: 'Activer mode clair',
    activateDark: 'Activer mode sombre',
    light: 'Clair',
    dark: 'Sombre',
    darkEnabled: 'Mode sombre activé (thème global GetSpecial appliqué).',
    lightEnabled: 'Mode clair activé.',
    infoUpdated: 'Informations générales mises à jour.',
    hoursUpdated: 'Horaires d’ouverture mis à jour.',
    terraceOn: 'Terrasse activée pour les opportunités météo.',
    terraceOff: 'Terrasse désactivée.',
    deliveryOn: 'Livraison activée pour les jours pluvieux.',
    deliveryOff: 'Livraison désactivée.',
    infoTitle: 'Informations générales',
    infoDescription: "Identité du restaurant et style utilisé par l'IA",
    save: 'Enregistrer',
    edit: 'Modifier',
    nameLabel: 'Nom du Restaurant',
    typeLabel: "Type d'établissement",
    types: {
      restaurant: 'Restaurant',
      bar: 'Bar',
      brasserie: 'Brasserie',
      pizzeria: 'Pizzeria',
      cafe: 'Café',
      fastFood: 'Fast Food',
    },
    toneLabel: 'Ton de marque IA',
    colorsLabel: 'Couleurs de marque',
    servicesTitle: 'Services & Aménagements',
    servicesDescription:
      'Facteurs pris en compte pour vos suggestions météo et affluence',
    terraceTitle: 'Terrasse extérieure',
    terraceSubtitle: 'Active les campagnes ensoleillées et afterwork plein air',
    terraceToggle: 'Basculer terrasse',
    deliveryTitle: 'Service de livraison',
    deliverySubtitle:
      "Active les opportunités de commande à emporter lors d'intempéries",
    deliveryToggle: 'Basculer livraison',
    hoursTitle: "Horaires d'ouverture",
    hoursDescription:
      'Affichage et paramétrage détaillé par jour de la semaine',
    closed: 'Fermé',
    closeDay: 'Fermer le jour',
    openDay: 'Ouvrir le jour',
    lunchPlaceholder: 'Midi',
    dinnerPlaceholder: 'Soir',
    closedAllDay: 'Fermé toute la journée',
  },
  accounts: {
    title: 'Comptes & Réseaux sociaux',
    summary: '{connected} connecté{plural} sur {total} canaux disponibles',
    connectedNotice:
      'Compte {name} connecté avec succès ! La diffusion automatique est active.',
    disconnectedNotice:
      'Compte {name} déconnecté. Vos futures publications ne seront plus diffusées sur ce canal.',
    disconnectTitle: 'Déconnecter {name} ?',
    confirmPrefix: 'Êtes-vous sûr de vouloir déconnecter le compte',
    confirmSuffix:
      "? L'IA ne pourra plus y diffuser vos offres ni vos posts automatiques.",
    cancel: 'Annuler',
    confirmDisconnect: 'Confirmer la déconnexion',
  },
  offers: {
    title: 'Offres spéciales & promos',
    summary: '{count} offre{plural} configurée{plural} pour votre restaurant',
    studio: 'Studio Affiche & Légende',
    add: '+ Ajouter une offre',
    created: 'Offre "{name}" créée et enregistrée avec succès.',
    selected: 'Offre "{name}" sélectionnée.',
  },
  events: {
    title: 'Événements du quartier',
    summary: '{active} actif{plural} sur {total} configuré{pluralTotal}',
    studio: 'Studio Affiche & Légende',
    add: '+ Ajouter',
    liveTitleFallback: 'Concert / Événement en direct',
    liveDateLabel: "Aujourd'hui / Ce soir",
    localZone: 'Zone locale',
    liveDescription:
      'Détecté en direct par Ticketmaster à proximité : {venue} ({distance}). Utilisé pour les opportunités IA.',
    manualDescriptionFallback: "Événement {title} organisé à l'établissement.",
    updated: 'Événement "{title}" mis à jour.',
    added: 'Événement "{title}" ajouté avec succès.',
    deleted: 'Événement "{title}" supprimé.',
    activated: 'Événement "{title}" activé pour l’IA.',
    snoozed: 'Événement "{title}" mis en veille.',
  },
};
