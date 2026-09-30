# 🍽️ GetSpecial — MVP & Audit Projet

> **Plateforme SaaS de marketing intelligent et contextuel pour restaurants, bars, cafés et food trucks.**  
> Référence : *Document Projet — Août 2026*.

GetSpecial transforme le contexte quotidien d'un établissement (météo en temps réel, événements locaux, jours creux, spécialités) en opportunités marketing concrètes et publications prêtes à diffuser sur les réseaux sociaux.

---

## 📋 Audit de Conformité vs Document Projet (Août 2026)

Cet audit compare scrupuleusement les spécifications du **Document Projet** avec l'implémentation actuelle de la base de code.

### Matrice des Fonctionnalités Clés (Section 11 & 12 du Document)

| Section du Document | Spécification Attendue | État dans la Base de Code | Statut |
| :--- | :--- | :--- | :---: |
| **11.1 Profil & Identité** | Fiche établissement : nom, localisation, spécialités, branding, offres, réseaux sociaux. | ✅ **Opérationnel** : Onboarding en 90s, gestion des offres et profil sur `/etablissement`. | 🟢 **Réel** |
| **11.2 Analyse Météo** | Ingestion météo via l'API gratuite Open-Meteo pour adapter les offres (pluie, terrasse, froid). | ✅ **Opérationnel** : `weather.collector.ts` appelle l'API Open-Meteo sans clé selon les coordonnées GPS réelles. | 🟢 **Réel** |
| **11.3 Événements Locaux** | Détection d'événements de quartier (matchs, concerts, jours fériés) pour anticiper l'affluence. | 🟡 **Partiel** : Modèle de signaux et collecteur codés, utilise des signaux contextuels locaux tant qu'une clé Ticketmaster n'est pas fournie. | 🟡 **Simulé / Fallback** |
| **11.4 Suggestions de Posts** | Moteur proactif d'opportunités marketing générées selon le contexte et l'historique. | ✅ **Opérationnel** : Moteur d'opportunités avec scoring de pertinence, affiché sur le Dashboard et `/idees`. | 🟢 **Réel** |
| **11.5 Objectif de publication** | Choix de l'objectif recherché : attirer du monde, promouvoir une offre, booster la livraison. | ✅ **Opérationnel** : Capturé dès l'onboarding et orienté dans le studio de création. | 🟢 **Réel** |
| **11.6 Création de contenu IA** | Production automatique : texte/caption + hashtags + image + vidéo courte. | 🟡 **Partiel** : Texte et hashtags générés par Claude 3.5 Sonnet. Images contextuelles via bibliothèque. **Vidéo non implémentée**. | 🟡 **Partiel** |
| **11.7 & 11.8 Prévisualisation** | Aperçu smartphone réaliste multi-plateformes (Instagram, Facebook, TikTok). | ✅ **Opérationnel** : `SocialPostPreview` reproduit fidèlement le post Instagram/Facebook sur mobile. | 🟢 **Réel** |
| **11.9 Publication & Planning** | Publication immédiate ou programmée, gestion multi-canal. | ✅ **Opérationnel** : Planification et enregistrement réel en base (`POST /api/posts`). | 🟡 **Persisté en base** |
| **11.10 Calendrier Marketing** | Visualisation mensuelle des contenus à publier, programmés et publiés. | ✅ **Opérationnel** : Calendrier mensuel interactif et liste ordonnée sur `/publications`. | 🟢 **Réel** |
| **11.11 Intégration Caisse (POS)** | Corrélation marketing ↔ ventes de caisse (chiffre d'affaires, plats vendus). | ⚪ **Phase future** : Documenté comme *"en cours de construction / offre supérieure"*. Tables `feedback` prêtes. | ⚪ **Roadmap** |
| **11.12 Suivi des Performances** | Portée, impressions, interactions, clics, Donut Chart par plateforme. | ✅ **Opérationnel** : Calcul dynamique des métriques et Donut SVG sur `/performances`. | 🟢 **Réel** |
| **11.13 Apprentissage** | Adaptation des suggestions selon les rejets et retours passés. | ✅ **Opérationnel** : Table `feedback` et cooldown de 48h sur les thèmes rejetés par le gérant. | 🟢 **Réel** |
| **Section 12 : Métiers spécifiques** | Déclencheurs adaptés : Food truck (mobilité), Bar (happy hour), Fast-food (promos flash). | ✅ **Opérationnel** : Pris en compte lors de l'onboarding et dans la génération des offres initiales. | 🟢 **Réel** |

---

### 🟢 Ce qui marche VRAIMENT (Testable immédiatement par un utilisateur)

1. **Onboarding Intelligent en 90 secondes (`/onboarding`)** :
   * Ne demande pas de remplir un CRM fastidieux.
   * Étape 1 : Nom, Ville/Adresse géocodée par GPS, sélection visuelle du métier (Restaurant, Food truck, Bar, Café, Fast-food, Boulangerie).
   * Étape 2 : Dépôt du menu (PDF/photo de la carte), comptes sociaux et sélection du ton (*Convivial*, *Festif*, *Gourmet*).
   * Étape 3 : Coche rapide des priorités (*Attirer du monde*, *Remplir les jours creux*, *Livraison*) et sélection des jours calmes.
   * Étape 4 : Écran d'apprentissage IA avec séquence d'ingestion et redirection automatique vers le Dashboard.
2. **Dashboard dynamique (`/dashboard`)** :
   * Salutation personnalisée avec le nom du restaurant.
   * Affichage des opportunités du jour générées en temps réel selon la météo et le contexte.
   * Statistiques hebdomadaires d'impact (Portée, Interactions, Clics) et dernières publications.
3. **Flux d'Idées & Filtres (`/idees`)** :
   * Liste complète des opportunités triables par pilules (*Aujourd'hui*, *Cette semaine*, *Météo*, *Événements*, *Tendances*, *Saisonnalité*).
4. **Studio de Création (`/creer`)** :
   * Stepper interactif en 3 étapes avec pré-remplissage depuis une opportunité.
   * **Aperçu smartphone en direct** (visuel, texte, horaires, badges).
   * **Enregistrement réel** dans PostgreSQL (`POST /api/posts`) avec gestion de statut (*Programmé*, *À publier*).
5. **Calendrier des Publications (`/publications`)** :
   * Vue calendrier mensuelle et grille des posts passés et à venir.
6. **Fiche Établissement & Pause d'urgence (`/etablissement`)** :
   * Consultation du profil, des offres actives et des réseaux sociaux.
   * **Bouton d'action fonctionnel** : mise en pause globale / reprise de l'activité commerciale (`POST /api/restaurants/pause`).
7. **Performances & Donut Chart (`/performances`)** :
   * Synthèse de visibilité et répartition graphique SVG Donut par réseau social.
8. **Sécurité & Sessions** :
   * Authentification Supabase Auth (`@supabase/ssr`) avec cookies chiffrés `HttpOnly`.
   * Auto-provisioning automatique de l'utilisateur dans PostgreSQL.
   * Couche DTOs stricte garantissant qu'aucune valeur `null` ou format invalide ne casse l'interface.

---

### 🟡 Ce qui est SIMULÉ ou en mode FALLBACK

1. **Diffusion vers les vraies API Sociales (Meta / Outstand)** :
   * Les posts sont enregistrés et planifiés avec succès dans la base PostgreSQL (`gs_mvp`).
   * Cependant, ils ne partent pas encore sur une vraie page Facebook ou un vrai compte Instagram d'entreprise sans jeton API Outstand ou Meta Graph configuré.
2. **Génération de texte Claude 3.5 Sonnet** :
   * Le service `content-generator.service.ts` appelle l'API Anthropic officielle. Si la variable `ANTHROPIC_API_KEY` n'est pas renseignée dans `.env.local`, un moteur de template structuré prend le relais sans bloquer l'interface.
3. **Statistiques sociales réelles (Meta Insights)** :
   * Les données de portée (42,6K) et d'interactions sont actuellement initialisées lors du seed et enrichies par les actions en base, en attente de synchronisation directe avec les statistiques Instagram/Facebook.

---

### 🔴 Ce qui MANQUE par rapport aux promesses du Document Projet

1. **Le module Vidéo (Sections 11.6 et 11.8)** :
   * Le document promet la création de **vidéos courtes** (formats TikTok / Reels / Stories). L'application ne gère actuellement que les formats images fixes.
2. **Génération d'images personnalisées & Upload direct de photos de plats** :
   * Les images sont actuellement sélectionnées via une galerie thématique Unsplash. L'upload de photos réelles depuis le smartphone du restaurateur nécessite un bucket de stockage (ex: Supabase Storage).
3. **Intégration Caisse (POS) (Section 11.11)** :
   * Conforme à la feuille de route du document (prévu pour les offres supérieures ultérieures). Aucun connecteur réel (Square, Lightspeed) n'est encore branché.
4. **Modales d'édition directe sur `/etablissement`** :
   * Les boutons "Modifier" sur la fiche établissement n'ouvrent pas encore de formulaire modal d'édition (les routes API `PATCH` existent déjà).

---

## 🛠️ Stack Technique

* **Framework** : [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19)
* **Langage** : TypeScript (mode strict avec DTOs centralisés dans `src/types/dto.ts`)
* **Base de données & ORM** : PostgreSQL (local ou Supabase) + [Prisma ORM](https://www.prisma.io/)
* **Authentification** : [Supabase Auth](https://supabase.com/docs/guides/auth) (`@supabase/ssr`, sessions cookies `HttpOnly`)
* **Météo en direct** : Open-Meteo API (100% gratuit, sans clé, prévisions mondiales par coordonnées GPS)
* **IA Générative** : Anthropic Claude 3.5 Sonnet (`@anthropic-ai/sdk`)
* **Design & Styling** : CSS Modules natifs + Tokens de design centralisés (`#080C0E`, `#0B1115`, `#111A20`, accent `#FF5C00`)
* **Icônes** : [Lucide React](https://lucide.dev/)
* **Validation des schémas** : [Zod](https://zod.dev/)

---

## 📂 Architecture des Dossiers

```text
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Pages d'authentification (login, register)
│   ├── (dashboard)/              # Espace gérant connecté
│   │   ├── dashboard/            # 1. Page "Aujourd'hui" (Opportunités, stats, publications)
│   │   ├── idees/                # 2. Page "Idées" (Filtres, cartes d'opportunités)
│   │   ├── creer/                # 3. Studio "Créer une publication" (Stepper & Live Preview)
│   │   ├── publications/         # 4. Page "Publications" (Calendrier mensuel & Liste)
│   │   ├── performances/         # 5. Page "Performances" (Top posts, Donut SVG)
│   │   └── etablissement/        # 6. Page "Mon établissement" (Profil, offres, pause)
│   ├── onboarding/               # Parcours d'onboarding immersif en 90s
│   ├── api/                      # Route Handlers REST sécurisés
│   │   ├── onboarding/           # Ingestion complète établissement & signaux
│   │   ├── restaurants/          # Lecture, profil et pause d'urgence
│   │   ├── opportunities/        # Moteur d'opportunités IA
│   │   ├── posts/                # Création, validation et mise à jour des posts
│   │   ├── publications/         # Liste des publications planifiées
│   │   └── performances/         # Agrégation des métriques d'impact
│   ├── layout.tsx                # Shell racine
│   └── globals.css               # Styles globaux
│
├── components/                   # Composants UI
│   ├── ui/                       # Primitives (Button, StatCard, OpportunityCard, IdeaCard,
│   │                             # PublicationCard, SocialPostPreview, DonutChart, StatusBadge)
│   └── layout/                   # Layout responsive (Sidebar, Header, BottomNav)
│
├── types/                        # Contrats de données & DTOs
│   └── dto.ts                    # DTOs stricts partagés (Restaurant, Opportunity, Publication, Performance)
│
├── server/                       # Backend & Logique Métier
│   ├── db/                       # Singletons Prisma Client & Supabase Admin
│   ├── lib/                      # Auth, Géocodage, Seed de démarrage, Réponses API
│   ├── transformers/             # Mappers Prisma ➔ DTOs frontend formatés
│   └── modules/                  # Modules métier (context, signal, opportunity, content, publisher, feedback)
```

---

## 🚀 Démarrage Rapide

### 1. Installation

```bash
git clone <url-du-repo>
cd GetSpecial-mvp
npm install
```

### 2. Configuration des variables d'environnement (`.env` et `.env.local`)

Pour faire tourner l'application avec votre base PostgreSQL locale (gérée via **pgAdmin**) et l'authentification Supabase :

```env
# Base de données PostgreSQL locale (pgAdmin)
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/gs_mvp"

# Supabase Auth (Cloud)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."

# Anthropic Claude 3.5 Sonnet (Optionnel pour génération live)
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Synchronisation de la base de données

```bash
npx prisma db push
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

* **Inscription** : [http://localhost:3000/register](http://localhost:3000/register) *(redirige automatiquement vers l'Onboarding)*
* **Onboarding** : [http://localhost:3000/onboarding](http://localhost:3000/onboarding)
* **Connexion** : [http://localhost:3000/login](http://localhost:3000/login)
* **Dashboard** : [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

## 🎯 Prochaines Étapes Prioritaires

1. **Module Vidéo & Stories (Sections 11.6 & 11.8)** : intégrer un template visuel vertical 9:16 pour les stories Instagram / TikTok.
2. **Upload d'images réelles** : configurer un bucket Supabase Storage pour permettre l'import de vraies photos de plats dans le studio de création.
3. **Modales d'édition sur `/etablissement`** : permettre la modification en direct des horaires, de l'adresse et des offres.
4. **Connexion Meta Developers** : finaliser l'OAuth Facebook/Instagram pour la diffusion automatique sur les vrais comptes sociaux.
