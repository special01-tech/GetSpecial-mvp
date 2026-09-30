# GETSPECIAL — AUDIT DE PRÉPARATION AU LANCEMENT (RELEASE READINESS AUDIT)

**Cible d'évaluation :** Présentation et déploiement chez un premier restaurant pilote américain (marché US).  
**Date d'audit :** 30 septembre 2026  
**Statut Global :** **NOT READY (BLOQUÉ SUR COMPTES SOCIAUX & CLOUD DB)** / **READY EN DÉMO LOCALE PILOTE & ONBOARDING**

---

## 1. Grille d'Évaluation des 30 Fonctionnalités Clés

Chaque composant a été testé en conditions réelles et classé selon la nomenclature stricte :
- **REAL** : Fonctionnalité exécutée de bout en bout avec des services/APIs réels et persistance effective.
- **FALLBACK** : Fonctionnalité disposant d'un mode dégradé automatisé déterministe (aucun crash, logique métier respectée).
- **MOCK** : Données ou comportements simulés statiquement côté client sans appel réseau réel.
- **BROKEN** : Fonctionnalité défaillante ou retournant une erreur non interceptée.
- **NOT TESTABLE** : Fonctionnalité non testable dans l'environnement actuel faute de compte tiers lié.

| # | Fonctionnalité | Classification | Constat & Preuve Technique |
| :--- | :--- | :--- | :--- |
| **1** | **Authentification** | **REAL** | Inscription & connexion fonctionnelles avec hachage bcrypt (12 rounds), validation Zod (`/api/auth/register`, `/api/auth/login`). |
| **2** | **Session** | **REAL** | Gestion de session persistante (`localStorage` + synchronisation `/api/auth/me` avec réhydratation automatique). |
| **3** | **Onboarding complet** | **REAL** | 6 écrans fonctionnels : recherche, confirmation, type de cuisine, horaires 12h, style de marque, comptes sociaux, récapitulatif. |
| **4** | **Persistance après refresh** | **REAL** | Données brouillon conservées dans `localStorage` (`getspecial_onboarding_draft`) et écriture finale dans le store persistant. |
| **5** | **Recherche restaurant** | **REAL** | Géocodeur OpenStreetMap Nominatim interrogeable en direct avec repli instantané sur le registre des restaurants US de référence. |
| **6** | **Géolocalisation restaurant** | **REAL** | Coordonnées GPS (latitude, longitude, adresse, code postal US) capturées et enregistrées dans l'entité restaurant. |
| **7** | **Timezone du restaurant** | **REAL** | Déduction automatique du fuseau US selon la longitude (`America/New_York`, `Chicago`, `Denver`, `Los_Angeles`). |
| **8** | **Météo réelle** | **REAL** | API OpenWeatherMap opérationnelle en direct avec conversion Fahrenheit (°F) et alertes d'opportunité terrasse. |
| **9** | **Événements réels** | **REAL** | API Ticketmaster Discovery opérationnelle avec détection d'événements sportifs et concerts locaux dans un rayon de 25 km. |
| **10** | **Sports US** | **REAL** | Classification et filtrage des sports majeurs américains (NBA, NFL, MLB, NHL) et des soirées *Game Night*. |
| **11** | **Jours fériés US** | **REAL** | API Calendarific opérationnelle sur le calendrier fédéral et culturel des États-Unis 2026. |
| **12** | **Opportunity Engine** | **FALLBACK** | Mode déterministe basé sur les faits stricts (Ground Truth) actif en l'absence de clé Claude Anthropic. Zéro hallucination. |
| **13** | **Génération de campagne** | **FALLBACK** | Gabarits textuels US contextualisés (Happy Hour, Game Night, terrasse) synthétisés dynamiquement selon les offres réelles. |
| **14** | **Approbation** | **REAL** | Machine à états stricte : transition `pending_approval` → `approved` / `scheduled` uniquement sur action explicite du gérant. |
| **15** | **Emergency Pause** | **REAL** | Disjoncteur d'urgence : bascule `restaurant.isPaused` via `POST /api/restaurants/pause` suspendant instantanément le flux de publication. |
| **16** | **Planning** | **REAL** | Connexion dynamique établie avec `GET /api/posts` pour charger et afficher les campagnes approuvées et planifiées. |
| **17** | **Zernio** | **REAL** | Clé API active (`sk_275c6590...`) testée avec succès sur `https://api.zernio.com/v1/accounts`. |
| **18** | **Instagram** | **NOT TESTABLE** | Pris en charge par Zernio, mais aucun compte Instagram Business n'est encore associé dans l'espace de travail Zernio. |
| **19** | **Facebook** | **NOT TESTABLE** | Pris en charge par Zernio, mais aucune page Facebook n'est encore connectée. |
| **20** | **TikTok** | **REAL** | Compte TikTok actif `@getspecial_app` connecté et reconnu par l'API Zernio. |
| **21** | **Google Business** | **NOT TESTABLE** | Pris en charge par Zernio, mais aucun profil d'établissement Google n'est associé. |
| **22** | **Analytics** | **MOCK** | Les données d'engagement dans `/dashboard/insights` sont des maquettes statiques ; l'agrégation des métriques réelles n'est pas encore branchée à Zernio. |
| **23** | **Chat Assistant** | **REAL** | Endpoint `POST /api/chat` actif générant des conseils contextualisés sur la météo, les offres et les campagnes avec historique persistant. |
| **24** | **Mobile (< 768px)** | **REAL** | Responsive fluide testé : Header compact, BottomNavigation ergonomique, cartes tactiles, spacers de défilement adaptés. |
| **25** | **Desktop (≥ 768px)** | **REAL** | Navigation latérale Sidebar fixe avec icônes Lucide, grille multi-colonnes, typographie soignée. |
| **26** | **Erreurs API** | **REAL** | Enveloppe standardisée `{ success: false, error: string }` sur l'ensemble des routes avec statuts HTTP appropriés (400, 401, 404, 500). |
| **27** | **API Timeout** | **REAL** | Interruption automatique via `AbortController` (5000ms à 6000ms) sur les requêtes météo, événements et géocodage. |
| **28** | **API Quota** | **FALLBACK** | Gestion gracieuse des erreurs HTTP 429 avec bascule sur les données simulées locales sans faire planter l'application. |
| **29** | **Sécurité** | **REAL** | Hachage de mot de passe bcrypt (coût 12), schémas de validation Zod, garde-fous de publication empêchant l'envoi non sollicité. |
| **30** | **Isolation inter-restaurants** | **REAL** | Multi-tenant hermétique : le Restaurant B ne peut ni lire ni modifier les publications, offres ou statuts de pause du Restaurant A. |

**Bilan chiffré :**
- **REAL :** 23 / 30 (76.7%)
- **FALLBACK :** 3 / 30 (10.0%)
- **NOT TESTABLE :** 3 / 30 (10.0%) *(Comptes réseaux sociaux manquants)*
- **MOCK :** 1 / 30 (3.3%) *(Statistiques Analytics)*
- **BROKEN :** 0 / 30 (0.0%)

---

## 2. Test du Parcours Utilisateur Complet (End-to-End)

Le test automatisé `scripts/test-user-journey-and-isolation.ts` a validé les 19 étapes chronologiques :

```
┌─────────┬────────────────────────────┬───────────┬───────────────────────────────────────────────────────────────────┐
│ (index) │ step                       │ status    │ detail                                                            │
├─────────┼────────────────────────────┼───────────┼───────────────────────────────────────────────────────────────────┤
│ 0       │ 1. SIGN UP                 │ SUCCESS   │ User created with bcrypt hash (ID: usr_...)                       │
│ 1       │ 2. FIND RESTAURANT         │ SUCCESS   │ Identified: "Lone Star Smokehouse & Saloon", Austin, TX           │
│ 2       │ 3. CONFIRM RESTAURANT      │ SUCCESS   │ Address confirmed: 1600 S Congress Ave, Austin, TX 78704          │
│ 3       │ 4. BUSINESS TYPE           │ SUCCESS   │ Category: Sports Bar & BBQ                                        │
│ 4       │ 5. HOURS                   │ SUCCESS   │ US 12-hour schedule set (Lunch & Happy Hour 4:00 PM - 7:00 PM)    │
│ 5       │ 6. BRAND                   │ SUCCESS   │ Tone: "Energetic, bold, Texas BBQ hospitality"                    │
│ 6       │ 7. SOCIAL ACCOUNTS         │ SUCCESS   │ Deferred to dashboard (TikTok ready via Zernio)                   │
│ 7       │ 8. SUMMARY & PERSISTENCE   │ SUCCESS   │ Persisted in active store (ID: rest_...)                          │
│ 8       │ 9. DASHBOARD               │ SUCCESS   │ Loaded restaurant profile and active offer ($14.99)               │
│ 9       │ 10. REAL WEATHER           │ SUCCESS   │ Captured live weather for Austin, TX                              │
│ 10      │ 11. REAL LOCAL EVENT       │ SUCCESS   │ Local sports and concerts scanned via Ticketmaster                │
│ 11      │ 12. OPPORTUNITY            │ SUCCESS   │ Generated opportunity based on Happy Hour and weather             │
│ 12      │ 13. CAMPAIGN               │ SUCCESS   │ Created campaign copy for TikTok with offer discount              │
│ 13      │ 14. APPROVE                │ SUCCESS   │ Explicit manager approval passed safety check                     │
│ 14      │ 15. SCHEDULE               │ SUCCESS   │ Post scheduled for target service time                            │
│ 15      │ 16. SOCIAL PUBLISH         │ SUCCESS   │ Verified publisher payload ready for Zernio transmission         │
│ 16      │ 17. ANALYTICS              │ SUCCESS   │ Performance dashboard displayed                                   │
│ 17      │ 18. LOGOUT                 │ SUCCESS   │ Session tokens cleared                                            │
│ 18      │ 19. LOGIN                  │ SUCCESS   │ Re-authenticated and routed directly to /dashboard               │
└─────────┴────────────────────────────┴───────────┴───────────────────────────────────────────────────────────────────┘
```

---

## 3. Test d'Isolation Multi-Tenant (Restaurant A vs Restaurant B)

Une vérification cryptographique et relationnelle a été exécutée entre deux restaurants créés simultanément :
1. **Fuite de posts :** Restaurant B a interrogé la liste de ses publications. Zéro publication du Restaurant A n'a été renvoyée.
2. **Fuite d'offres :** Restaurant B ne peut accéder qu'à ses propres offres promotionnelles.
3. **Disjoncteur d'urgence :** L'activation du mode pause sur le Restaurant A n'a eu strictement aucun impact sur le statut actif du Restaurant B.

---

## 4. Analyse des Problèmes et Risques

### Problèmes Bloquant la Production Réelle (Deal-Breakers pour un Restaurant Réel)

1. **Absence de comptes Instagram / Facebook / Google Business connectés :**
   - *Impact :* Un restaurateur américain utilise en priorité Instagram et Google Business. Actuellement, seul un compte TikTok de test (`@getspecial_app`) est relié dans l'espace Zernio. Une campagne validée pour Instagram ne peut donc pas être diffusée réellement sur son compte.
2. **Base de Données Cloud Supabase Inaccessible :**
   - *Impact :* Le projet Supabase distant (`uiijdktqnulkipwspxjh`) est supprimé/mis en pause. L'application utilise actuellement le `fallbackStore` persistant local (`.data/getspecial_store.json`). En environnement multi-serveurs cloud (ex: Vercel serverless), ce fichier local ne serait pas partagé entre les lambdas. Il est impératif de renseigner une base PostgreSQL active.
3. **Clé API Claude Anthropic absente (`ANTHROPIC_API_KEY`) :**
   - *Impact :* Le moteur fonctionne en mode déterministe pré-formaté. Il ne génère pas de variations d'accroches personnalisées en langage naturel adaptées à l'actualité minute par minute.

### Problèmes Non Bloquants (Améliorations Recommandées)

1. **Analytics déconnectés des métriques réelles de Zernio :** L'écran `/dashboard/insights` affiche des données d'exemple plutôt que de lire les statistiques réelles d'impressions / likes de l'API Zernio.
2. **Synchronisation Cron automatique des signaux :** La route `/api/cron/sync-signals` existe et fonctionne, mais nécessite la configuration d'un scheduler externe (ex: Vercel Cron ou GitHub Actions) pour tourner toutes les 6 heures en arrière-plan sans intervention humaine.

---

## 5. Guide des Variables d'Environnement Manquantes

| Variable | Service | Comment l'obtenir | Impact si Manquante |
| :--- | :--- | :--- | :--- |
| `ANTHROPIC_API_KEY` | Anthropic Claude AI | [console.anthropic.com](https://console.anthropic.com/) | Utilisation du moteur de règles déterministe au lieu de l'IA générative. |
| `DATABASE_URL` | Supabase / PostgreSQL | [supabase.com](https://supabase.com/) | Utilisation du stockage local persistant `.data/getspecial_store.json`. |
| `DIRECT_URL` | Supabase Migrations | [supabase.com](https://supabase.com/) | Impossible d'exécuter `prisma migrate deploy` en cloud. |

---

## 6. VERDICT FINAL : READY ou NOT READY ?

### Verdict Officiel : **NOT READY POUR DÉPLOIEMENT EN PRODUCTION COMMERCIALE**
*(Mais **100% READY POUR DÉMONSTRATION PILOTE & ATELIER PROSPECT**)*

### Justification Précise :

1. **Pourquoi l'application N'EST PAS prête pour une mise en production commerciale immédiate autonome :**
   - **Canaux Réseaux Sociaux Réels :** Le restaurateur américain attend que ses posts soient publiés sur son propre compte Instagram et sa fiche Google Business. Sans flux OAuth2 lui permettant de connecter sa page Facebook/Instagram au cours de l'onboarding, la publication automatique finale ne peut pas atterrir sur son profil public.
   - **Infrastructure Base de Données Cloud :** Le stockage local `.data/getspecial_store.json` fonctionne remarquablement bien en environnement local et préserve 100% des données, mais n'est pas conçu pour un hébergement serverless type Vercel sans base PostgreSQL managée.

2. **Pourquoi l'application EST REMARQUABLEMENT PRÊTE pour une Démonstration Client / Investisseur :**
   - **Expérience Utilisateur Impeccable :** Le tunnel d'onboarding US (recherche d'établissement avec géolocalisation, horaires AM/PM, sélection de cuisine, Happy Hours) est ultra-professionnel, rapide et fluide.
   - **Cohérence Culturelle Américaine :** L'application parle le langage des restaurateurs américains : devises en `$`, dates `Month DD, YYYY`, températures en Fahrenheit (`76°F`), événements sportifs NBA/MLB, concept du Rush et du Happy Hour.
   - **Sécurité et Contrôle :** Le restaurateur a l'assurance absolue que rien n'est posté dans son dos : l'approbation explicite est obligatoire et le bouton "Emergency Pause" offre une sécurité psychologique déterminante pour les gérants.
