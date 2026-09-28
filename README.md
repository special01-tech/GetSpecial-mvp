# 🍽️ GetSpecial — MVP

> Plateforme de marketing contextuel intelligent pour restaurants.

GetSpecial analyse les signaux externes (météo, événements, calendrier) pour suggérer et générer du contenu percutant, le publier sur les réseaux sociaux et mesurer l'impact sur les ventes.

---

## 🛠️ Stack Technique

- **Framework** : [Next.js](https://nextjs.org/) (App Router, React 19)
- **Langage** : TypeScript (mode strict)
- **Styling** : CSS Modules natifs + Design Tokens (`src/styles/tokens.css`), Dark theme par défaut
- **Base de données & ORM** : PostgreSQL + [Prisma ORM](https://www.prisma.io/)
- **Validation & Schémas** : [Zod](https://zod.dev/)
- **Authentification** : NextAuth.js / bcryptjs

---

## 📂 Architecture du Projet

Le projet sépare strictement le frontend et le backend au sein de `src/` :

```text
src/
├── app/                          # Frontend — Next.js App Router
│   ├── (dashboard)/              # Espace connecté (dashboard, sidebar, etc.)
│   ├── layout.tsx                # Shell racine (PWA meta, polices)
│   └── globals.css               # Styles globaux & reset
│
├── components/                   # Composants UI
│   ├── ui/                       # Primitives réutilisables (Button, Card, Input, Badge)
│   └── layout/                   # Layout responsive (Sidebar desktop, Header, BottomNav mobile)
│
├── styles/                       # Système de design
│   ├── tokens.css                # Variables CSS (couleurs dark theme, typo, espacements)
│   └── reset.css                 # Reset CSS minimal
│
└── server/                       # Backend Next.js
    ├── db/                       # Accès base de données (singleton Prisma Client)
    ├── lib/                      # Utilitaires partagés (api-response.ts, errors.ts)
    └── modules/                  # Modules métier alignés sur la boucle produit
        ├── auth/                 # 🔐 Inscription, connexion, hash de mots de passe
        ├── context-store/        # 🧠 KNOW : Connaît chaque restaurant (profil, horaires, GPS)
        ├── signal-collector/     # 👀 OBSERVE : Ingestion des signaux (météo, événements)
        ├── opportunity-engine/   # 💡 THINK : Scoring de pertinence des opportunités
        ├── content-generator/    # ✍️ CREATE : Textes et visuels calibrés par réseau
        ├── publisher/            # 📣 PUBLISH : Planification et publication externe
        └── feedback-loop/        # 🔄 LEARN : Corrélation ventes caisse ↔ publications
```

---

## 🚀 Démarrage Rapide

### 1. Prérequis

- [Node.js](https://nodejs.org/) (v20 ou supérieur recommandé)
- Une base de données PostgreSQL accessible

### 2. Installation

```bash
git clone <url-du-repo>
cd GetSpecial-mvp
npm install
```

### 3. Configuration de l'environnement

Créer un fichier `.env.local` à la racine (et un `.env` pour la CLI Prisma) :

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/getspecial_dev"

# Authentification
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre_secret_aleatoire_de_production"
```

### 4. Base de données

Générer le client Prisma à partir du schéma :

```bash
npx prisma generate
```

Pour synchroniser la base avec le schéma :

```bash
npx prisma db push
```

### 5. Lancer l'application

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## 📐 Règles & Conventions

- **Modularité** : chaque module backend dans `src/server/modules/<nom>/` contient son `.schema.ts` (Zod), son `.service.ts` (logique métier) et son `index.ts`.
- **Typage strict** : vérifier la conformité TypeScript avec `npx tsc --noEmit`.
- **Simplicité** : conserver un code robuste, lisible, auto-documenté et sans superflu.
