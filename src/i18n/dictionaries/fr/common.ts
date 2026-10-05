/* =============================================================================
 * i18n — Dictionnaire FR : chaînes communes (boutons, états, actions)
 * ============================================================================= */

export const common = {
  back: 'Retour',
  continue: 'Continuer',
  cancel: 'Annuler',
  close: 'Fermer',
  save: 'Enregistrer',
  confirm: 'Confirmer',
  retry: 'Réessayer',
  skip: 'Passer',
  skipStep: 'Passer cette étape',
  loading: 'Chargement...',
  saving: 'Enregistrement...',
  finish: 'Terminer',
  next: 'Suivant',
  previous: 'Précédent',
  delete: 'Supprimer',
  edit: 'Modifier',
  view: 'Voir',
  yes: 'Oui',
  no: 'Non',
  search: 'Rechercher',
  today: "Aujourd'hui",
  all: 'Tous',
  none: 'Aucun',
  errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
  required: 'requis',

  /** Libellés des catégories d'événements (par id stable) */
  eventCategories: {
    concert: 'Concert',
    sport: 'Sport / Match',
    festival: 'Fête / Festival',
    special_day: 'Jour Férié',
    culture: 'Culture & Spectacle',
  },

  /** Statuts de planification (par id stable) */
  planningStatus: {
    published: 'Publié',
    programmed: 'Programmé',
    approved: 'Approuvé',
    to_validate: 'À valider',
  },

  /** Comptes sociaux : descriptions & bénéfices (par plateforme) */
  socialAccounts: {
    facebook: {
      description: 'Page officielle de votre établissement',
      benefits: 'Publication automatique des menus & événements locaux',
    },
    instagram: {
      description: 'Compte professionnel Instagram Business',
      benefits: 'Photos d’ambiance, stories & visibilité auprès des foodies',
    },
    google_business: {
      description: 'Fiche Google Maps & recherche locale',
      benefits: 'Posts "Actualités" & "Offres" vus par les clients à proximité',
    },
  },

  /** Comptes connectés du restaurant (par plateforme) */
  connectedAccounts: {
    facebook: {
      description: 'Diffusion instantanée des offres et événements sur votre page abonnés.',
    },
    instagram: {
      description: 'Publication des stories et posts pour vos clients locaux et touristes.',
    },
    google_business: {
      description: 'Apparaissez dans le Pack Local Maps lors des recherches de proximité.',
    },
  },

  splash: {
    badge: "Aujourd'hui • Terrasse pleine grâce au soleil",
    slogan: 'Votre assistant marketing pour un restaurant qui fait parler de lui.',
    subtext:
      'Transformez chaque jour la météo, les événements et vos spécialités en clients à table.',
    benefit1Title: 'Plus de clients',
    benefit1Desc: 'Remplissez vos tables aux heures creuses',
    benefit2Title: 'Plus de visibilité',
    benefit2Desc: 'Présence active et ultra-ciblée sur vos réseaux',
    benefit3Title: "Moins d'efforts",
    benefit3Desc: 'Opportunités et posts rédigés en 1 clic',
    start: 'Commencer',
    createNew: 'Créer un nouveau restaurant',
    goToDashboard: 'Accéder à mon tableau de bord actif →',
    disclaimer: 'Sans engagement • Configuration en 2 minutes',
  },

  components: {
    emptyState: {
      title: "Rien d'urgent aujourd'hui",
      description:
        "On reste à l'affût des meilleures opportunités pour votre restaurant.",
      buttonText: 'Voir le planning',
    },
    emailAuthButton: {
      defaultLabel: 'Continuer avec email',
    },
    countrySelect: {
      placeholder: 'Sélectionnez ou recherchez votre pays...',
      countryTitle: 'Pays',
      clearSearchTitle: 'Effacer la recherche',
      openListTitle: 'Ouvrir la liste des pays',
      closeListTitle: 'Fermer la liste',
      unlistedPrefix: 'Pays non répertorié :',
      unlistedHint: 'Cliquez ou appuyez sur Entrée pour valider ce pays',
    },
    eventCard: {
      active: 'Actif',
      inactive: 'Désactivé',
      disableTitle: 'Désactiver cet événement',
      enableTitle: 'Activer cet événement',
      actionsAria: "Actions de l'événement",
      edit: 'Modifier',
      disable: 'Désactiver',
      enable: 'Activer',
      delete: 'Supprimer',
    },
    eventForm: {
      editTitle: 'Modifier l’événement',
      createTitle: 'Nouvel événement local',
      subtitle: "Permet à l'IA d'anticiper l'affluence de votre quartier",
      closeAria: 'Fermer',
      nameLabel: "Nom de l'événement *",
      namePlaceholder: 'Ex : Concert Live Jazz ou Match PSG',
      categoryLabel: 'Catégorie *',
      dateLabel: 'Date *',
      datePlaceholder: 'Ex : Vendredi 2 Oct. 2026',
      timeLabel: 'Heure',
      imageLabel: 'Illustration (URL)',
      descriptionLabel: 'Description / Précisions',
      descriptionPlaceholder: 'Détails pour calibrer les offres spéciales...',
      activeToggleTitle: 'Événement actif',
      activeToggleSubtitle:
        'Prendre en compte dans les propositions IA du dashboard',
      cancel: 'Annuler',
      saveChanges: 'Enregistrer les modifications',
      addEvent: 'Ajouter l’événement',
    },
    openingHoursEditor: {
      reopenTitle: 'Rouvrir cette journée',
      markClosedTitle: 'Marquer comme fermé',
      closedLabel: 'Fermé',
      openLabel: 'Ouvert',
      closedAllDay: 'Fermé toute la journée',
      lunch: 'Midi',
      dinner: 'Soir',
      openLunchAria: 'Ouverture midi {day}',
      closeLunchAria: 'Fermeture midi {day}',
      openDinnerAria: 'Ouverture soir {day}',
      closeDinnerAria: 'Fermeture soir {day}',
      days: {
        mon: 'Lun',
        tue: 'Mar',
        wed: 'Mer',
        thu: 'Jeu',
        fri: 'Ven',
        sat: 'Sam',
        sun: 'Dim',
      },
    },
    offerForm: {
      title: 'Nouvelle offre spéciale',
      subtitle: 'Créez et ciblez votre promotion',
      closeAria: 'Fermer',
      offerTitleLabel: "Titre de l'offre *",
      offerTitlePlaceholder: 'Ex : Burgers Gourmet -30%',
      discountLabel: 'Réduction ou Avantage *',
      discountPlaceholder: 'Ex : -30% ou 1 acheté = 1 offert',
      descriptionLabel: 'Description *',
      descriptionPlaceholder:
        'Détaillez les conditions (ex : valable sur place pour le match)...',
      imageLabel: "Lien de l'image d'illustration",
      activationDateLabel: "Date d'activation",
      startTimeLabel: 'Heure de début',
      platformsLabel: 'Plateformes de diffusion',
      cancel: 'Annuler',
      save: "Enregistrer l'offre",
      period: 'Le {date} à partir de {time}',
    },
    opportunityCard: {
      hideJustification: 'Masquer la justification',
      showJustification: 'Pourquoi cette recommandation ?',
      verifiedFactsTitle: 'Faits vérifiés utilisés :',
      defaultSignalOrigin:
        'Conditions et offres du restaurant observées ce jour.',
      createCampaign: 'Créer la campagne',
    },
    socialAccountCard: {
      localBadge: 'Référencement local',
      connected: 'Connecté',
      disconnected: 'Non connecté',
      disconnectAria: 'Déconnecter {name}',
      connectAria: 'Connecter {name}',
      connectButton: 'Connecter',
      connectedButton: 'Connecté',
    },
    restaurantAccountCard: {
      connected: 'Connecté',
      disconnected: 'Non connecté',
      disconnectAria: 'Déconnecter {name}',
      connectAria: 'Connecter {name}',
      connectButton: 'Connecter',
      disconnectButton: 'Déconnecter',
    },
    postInsights: {
      viewPost: 'Voir le post',
      statsHeading: 'Statistiques du post',
      viewsLabel: 'Vues',
      likesLabel: 'Likes',
      commentsLabel: 'Commentaires',
      sharesLabel: 'Partages',
      demographicsHeading: 'Démographie',
      audienceBadge: 'Audience touchée',
      genderHeading: 'Hommes / Femmes',
      genderRatio: '{women}% Femmes • {men}% Hommes',
      womenTitle: 'Femmes: {pct}%',
      menTitle: 'Hommes: {pct}%',
      womenLegend: 'Femmes ({pct}%)',
      menLegend: 'Hommes ({pct}%)',
      ageRangesHeading: "Tranches d'âge",
    },
    platformStats: {
      distributionAria: 'Répartition des vues par plateforme',
      segmentTitle: '{name}: {views} vues ({pct}%)',
      interactionsLabel: '{count} interactions',
      viewsLabel: '{views} vues',
    },
    restaurantCard: {
      openNow: 'Ouvert actuellement',
      closed: 'Fermé',
      galleryTitle: 'Galerie photos',
      photoAlt: '{name} photo {index}',
    },
    brandProfile: {
      analysisDone: 'Analyse automatique terminée',
      confidenceLabel: 'Indice de confiance : {score}%',
      foundVoiceTitle: "Voix que j'ai trouvée",
      hide: 'Masquer',
      customize: 'Personnaliser',
      editorialLabel: 'Style rédactionnel :',
      colorsTitle: 'Couleurs détectées',
      colorCount: '{count} teintes identifiées',
    },
    brandToneSelector: {
      tones: {
        chaleureux: {
          label: 'Chaleureux',
          description: 'Accueillant, authentique et proche des clients',
        },
        convivial: {
          label: 'Convivial',
          description: 'Partage, bonne humeur et esprit de tablée',
        },
        gourmand: {
          label: 'Gourmand',
          description: 'Focus sur les saveurs, textures et produits frais',
        },
        festif: {
          label: 'Festif',
          description: 'Énergie haute, apéros animés et soirées',
        },
        chic_elegant: {
          label: 'Chic & Raffiné',
          description: 'Gastronomie soignée, vocabulaire élégant',
        },
        decontracte: {
          label: 'Décontracté',
          description: 'Simple, direct, sans chichis',
        },
      },
      selectedCounter: '{selected} / {max} tonalités sélectionnées',
    },
    chatCampaignCard: {
      opportunityBadge: 'Opportunité détectée',
      broadcastLabel: 'Diffusion :',
      rejectedBanner: 'Campagne refusée',
      scheduledBanner: 'Publication programmée pour ce soir à 18h',
      viewDetail: 'Voir le détail',
      reject: 'Refuser',
    },
    campaignDetail: {
      platformsHeading: 'Plateformes de diffusion',
      whyOpportunity: 'Pourquoi cette opportunité ?',
      publishTimeLabel: 'Heure de publication recommandée',
      optimizedContext: 'Optimisé pour un impact maximal',
    },
    offerCard: {
      scheduled: 'Programmée',
      draft: 'Brouillon',
    },
    todayOfferCard: {
      readyLabel: 'Prêt pour diffusion réseaux',
      boostButton: "Pousser l'offre",
    },
    restaurantVisual: {
      defaultBadge: 'Service du midi complet • +34% de couverts',
      imageAlt: 'Ambiance restaurant GetSpecial',
    },
    analyticsChart: {
      viewsLegend: 'Vues totales',
      interactionsLegend: 'Interactions',
      periodLabel: '4 dernières semaines',
    },
  },
};
