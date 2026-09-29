# 🍽️ GetSpecial — MVP

> Plateforme SaaS de marketing contextuel intelligent pour restaurants.

GetSpecial analyse les signaux externes (météo, événements de quartier, tendances et affluence) pour suggérer et générer des publications percutantes via IA (Claude 3.5), les faire valider en quelques clics par le restaurateur, les publier sur les réseaux sociaux et mesurer leur impact sur la visibilité.

---

## 📌 État Actuel du Projet

### 🟢 Ce qui marche (Opérationnel)

- **Frontend complet & Direction artistique Dark SaaS Premium** :
  - **Dashboard "Aujourd'hui" (`/dashboard`)** : Cartes d'opportunités du jour (*Pluie*, *Match*, *Happy Hour*), suivi d'activité hebdomadaire (*Portée 42,6K*, *Interactions 1,3K*, *Clics 892*), et aperçu des dernières publications.
  - **Page "Idées" (`/idees`)** : Filtres interactifs par pills (*Météo*, *Événements*, *Tendances*, *Saisonnalité*) et liste détaillée des opportunités détectées.
  - **Studio "Créer une publication" (`/creer`)** : Stepper interactif en 3 étapes (*Choisir*, *Personnaliser*, *Générer*) avec **aperçu smartphone en direct** (post Instagram/Facebook réaliste).
  - **Page "Publications" (`/publications`)** : Vue Calendrier mensuel (Avril 2025) interactif, liste des publications à venir et grille complète des posts avec statuts (*À publier*, *Programmée*, *Publiée*).
  - **Page "Performances" (`/performances`)** : Métriques d'impact, top des meilleures publications et **Donut Chart SVG interactif** de répartition par plateforme (Instagram 62%, Facebook 28%, TikTok 10%).
  - **Page "Mon établissement" (`/etablissement`)** : Fiche restaurant (*Le Comptoir*), horaires, statut ouvert, identité visuelle, offres et toggles de préférences.
- **Composants d'Interface Réutilisables** :
  - Système de design sous tokens CSS (`#080C0E`, `#0B1115`, `#111A20`, accent `#FF5C00`).
  - Primitives et composants métier avec barrels export dédiés (`Button`, `StatCard`, `OpportunityCard`, `IdeaCard`, `PublicationCard`, `SocialPostPreview`, `StatusBadge`, `FilterPills`, `DonutChart`, `PageHeader`).
- **Authentification & Sessions** :
  - Authentification Supabase Auth (`@supabase/ssr`) opérationnelle (inscription, connexion, cookies chiffrés `HTTP-Only`).
  - Protection de session sécurisée dans `src/proxy.ts` et `src/server/lib/auth.ts`.
  - Résilience du layout : si la base de données PostgreSQL est injoignable, l'application bascule gracieusement sur les données de la session Supabase active sans écran rouge.
- **Architecture Backend Modulaire (KNOW ➔ OBSERVE ➔ THINK ➔ CREATE ➔ PUBLISH ➔ LEARN)** :
  - 6 modules métier prêts dans `src/server/modules/`.
  - Protection anti-IDOR et vérification d'appartenance du restaurant (`requireRestaurantOwnership`).

---

### 🔴 Ce qui casse ou points d'attention (Troubleshooting)

- **Connectivité PostgreSQL directe Supabase (IPv6)** :
  - **Symptôme** : Message `PrismaClientInitializationError: Can't reach database server at db.[REF].supabase.co:5432`.
  - **Cause** : L'adresse directe `db.[REF].supabase.co:5432` de Supabase résout uniquement en **IPv6**. Si votre réseau local, FAI ou box ne supporte pas l'IPv6, la connexion TCP vers Prisma échoue.
  - **Solution** : Utiliser l'URL de **Connection Pooling (IPv4 / Supavisor)** disponible dans la console Supabase (*Project Settings > Database > Connection Pooling*) sur le port `6543` ou `5432` pour la variable `DATABASE_URL` dans `.env.local`.
- **Synchronisation automatique User Prisma** :
  - Tant que Prisma n'a pas accès à la base de données, la création de la ligne dans la table `public.User` ne s'exécute pas. L'application utilise donc un fallback direct sur `auth.supabaseUser`.

---

### 🟡 Ce qui manque pour la mise en production

1. **Câblage Frontend ↔ Endpoints API** :
   - Le frontend utilise actuellement un module de données réalistes [`src/lib/mock-data.ts`](src/lib/mock-data.ts). Il reste à brancher les formulaires de création et de filtres sur les routes API `/api/*` une fois la connexion base de données active.
2. **Clés d'API Externes Réelles** :
   - **IA Claude (Anthropic)** : Renseigner une clé `ANTHROPIC_API_KEY` valide pour le moteur d'opportunités et la génération automatique de texte.
   - **Météo & Événements** : Clés OpenWeatherMap et Ticketmaster dans les collecteurs.
   - **Publication Sociale** : Jeton API Outstand / Meta Graph API pour la diffusion réelle des posts programmés.
3. **Schedulers & Tâches d'arrière-plan** :
   - Mise en place d'un cron job (Vercel Cron, QStash ou worker) pour déclencher la boucle d'ingestion et de publication automatique.
4. **Stockage Médias (Storage Bucket)** :
   - Configuration d'un bucket Supabase Storage pour l'upload réel des photos et logos du restaurant.

---

## 🛠️ Stack Technique

- **Framework** : [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Langage** : TypeScript (mode strict)
- **Authentification & Sessions** : [Supabase Auth](https://supabase.com/docs/guides/auth) via `@supabase/ssr` (sessions cookies `HTTP-Only`)
- **Base de données & ORM** : PostgreSQL (Supabase) + [Prisma ORM](https://www.prisma.io/)
- **Sécurité Base de Données** : Row Level Security (RLS) PostgreSQL & triggers SQL
- **Styling** : CSS Modules natifs + Design Tokens centralisés (`src/styles/tokens.css`), Dark SaaS theme par défaut
- **Icônes** : [Lucide React](https://lucide.dev/)
- **IA Générative** : Anthropic Claude 3.5 Sonnet (`@anthropic-ai/sdk`)
- **Validation** : [Zod](https://zod.dev/)

---

## 📂 Architecture du Projet

```text
src/
├── app/                          # Frontend — Next.js App Router
│   ├── (auth)/                   # Pages d'authentification (login, register)
│   ├── (dashboard)/              # Espace gérant connecté (Design de référence)
│   │   ├── dashboard/            # 1. Page "Aujourd'hui" (Opportunités, stats, publications)
│   │   ├── idees/                # 2. Page "Idées" (Filtres, cartes opportunités)
│   │   ├── creer/                # 3. Page "Créer une publication" (Stepper & Live Preview)
│   │   ├── publications/         # 4. Page "Publications" (Calendrier & Galerie)
│   │   ├── performances/         # 5. Page "Performances" (Top posts, Donut SVG)
│   │   └── etablissement/        # 6. Page "Mon établissement" (Profil, offres, toggles)
│   ├── api/                      # Route Handlers REST sécurisés
│   │   ├── audit/                # Logs d'audit traçabilité
│   │   ├── opportunities/        # Moteur d'opportunités IA
│   │   ├── posts/                # Validation et génération des posts
│   │   ├── publications/         # Planification et diffusion
│   │   └── restaurants/          # Paramètres et profil restaurant
│   ├── layout.tsx                # Shell racine (meta PWA, polices Poppins)
│   └── globals.css               # Point d'entrée CSS global
│
├── components/                   # Composants d'interface
│   ├── ui/                       # Primitives UI (Button, StatCard, OpportunityCard,
│   │                             # IdeaCard, PublicationCard, SocialPostPreview,
│   │                             # DonutChart, StatusBadge, FilterPills, PageHeader)
│   └── layout/                   # Layout responsive (Sidebar, Header, BottomNav)
│
├── lib/                          # Clients & Données partagées
│   ├── mock-data.ts              # Données réalistes pour l'affichage frontend
│   └── supabase/                 # Clients Supabase SSR (server.ts, client.ts)
│
├── styles/                       # Système de design
│   ├── tokens.css                # Variables CSS (Palette dark, orange vif, radius, typo)
│   ├── reset.css                 # Reset CSS moderne
│   └── animations.css            # Transitions et micro-interactions
│
└── server/                       # Backend & Logique Métier
    ├── db/                       # Singletons Prisma Client & Supabase Admin
    ├── lib/                      # Helpers d'authentification & ownership restaurant
    └── modules/                  # Modules métier (context, signal, opportunity, content, publisher, feedback)
```

---

## 🚀 Démarrage Rapide

### 1. Installation

```bash
git clone <url-du-repo>
cd GetSpecial-mvp
npm install
```

### 2. Configuration (`.env.local`)

```env
# Base de données PostgreSQL (Recommandé : Pooler Supabase IPv4 port 6543 ou 5432)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."

# Anthropic Claude
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Lancer l'application en développement

```bash
npm run dev
```

- Inscription : [http://localhost:3000/register](http://localhost:3000/register)
- Connexion : [http://localhost:3000/login](http://localhost:3000/login)
- Dashboard : [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
