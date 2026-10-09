-- =============================================================================
-- GetSpecial — Schéma SQL complet & Politiques Row Level Security (RLS) Supabase
-- Exécuter ce script dans le SQL Editor de votre projet Supabase.
-- =============================================================================

-- Activation de l'extension pgcrypto / uuid si nécessaire
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Table: users
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: restaurants
CREATE TABLE IF NOT EXISTS public.restaurants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  "openingHours" JSONB,
  specialties TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  "isPaused" BOOLEAN NOT NULL DEFAULT FALSE,
  "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: restaurant_profile
CREATE TABLE IF NOT EXISTS public.restaurant_profile (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "restaurantId" TEXT NOT NULL UNIQUE REFERENCES public.restaurants(id) ON DELETE CASCADE,
  tone TEXT NOT NULL DEFAULT 'chaleureux',
  "hasTerrace" BOOLEAN NOT NULL DEFAULT FALSE,
  "offPeakDays" TEXT[] DEFAULT '{}',
  constraints TEXT[] DEFAULT '{}',
  "customRules" JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table: offers
CREATE TABLE IF NOT EXISTS public.offers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "restaurantId" TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "discountValue" TEXT,
  recurrence TEXT NOT NULL DEFAULT 'none',
  "recurrenceDays" TEXT[] DEFAULT '{}',
  "lastPromotedAt" TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Table: social_accounts
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "restaurantId" TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  "outstandAccountId" TEXT NOT NULL,
  username TEXT,
  "accessToken" TEXT,
  "tokenData" JSONB,
  status TEXT NOT NULL DEFAULT 'connected',
  "lastSyncAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_restaurant_platform UNIQUE ("restaurantId", platform)
);

-- 6. Table: signals
CREATE TABLE IF NOT EXISTS public.signals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "restaurantId" TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  intensity DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  source TEXT NOT NULL,
  data JSONB NOT NULL,
  "detectedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Table: opportunities
CREATE TABLE IF NOT EXISTS public.opportunities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "restaurantId" TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  "signalId" TEXT REFERENCES public.signals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'medium',
  "recommendedTone" TEXT,
  "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "factsCited" JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  "suggestedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Table: posts
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "restaurantId" TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  "opportunityId" TEXT REFERENCES public.opportunities(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  "imageUrl" TEXT,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  "verifiedFacts" JSONB,
  "scheduledAt" TIMESTAMPTZ,
  "approvedAt" TIMESTAMPTZ,
  "publishedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Table: publications
CREATE TABLE IF NOT EXISTS public.publications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "restaurantId" TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  "postId" TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  "outstandPostId" TEXT,
  "sendIdempotencyKey" TEXT NOT NULL UNIQUE,
  attempts INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  "publishedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Table: feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "restaurantId" TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  reason TEXT,
  value DOUBLE PRECISION,
  "opportunityId" TEXT REFERENCES public.opportunities(id) ON DELETE SET NULL,
  "publicationId" TEXT REFERENCES public.publications(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Table: audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "restaurantId" TEXT REFERENCES public.restaurants(id) ON DELETE SET NULL,
  "userId" TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  details JSONB,
  "ipAddress" TEXT,
  status TEXT NOT NULL DEFAULT 'logged',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_signals_restaurant ON public.signals("restaurantId", "detectedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_restaurant ON public.opportunities("restaurantId", status);
CREATE INDEX IF NOT EXISTS idx_posts_restaurant_status ON public.posts("restaurantId", status);
CREATE INDEX IF NOT EXISTS idx_publications_scheduled ON public.publications("restaurantId", status);
CREATE INDEX IF NOT EXISTS idx_audit_log_restaurant ON public.audit_log("restaurantId", "createdAt" DESC);

-- =============================================================================
-- POLITIQUES RLS (Row Level Security)
-- Chaque gérant ne voit et ne modifie que les lignes de son propre restaurant_id
-- =============================================================================

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper pour vérifier si un restaurant appartient à auth.uid()
CREATE OR REPLACE FUNCTION public.user_owns_restaurant(r_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = r_id
    AND ("userId" = auth.uid()::text OR "userId" = (auth.jwt() ->> 'sub'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Restaurants
DROP POLICY IF EXISTS "restaurants_owner_policy" ON public.restaurants;
CREATE POLICY "restaurants_owner_policy" ON public.restaurants
  FOR ALL USING ("userId" = auth.uid()::text OR "userId" = (auth.jwt() ->> 'sub'));

-- RLS Restaurant Profile
DROP POLICY IF EXISTS "profile_owner_policy" ON public.restaurant_profile;
CREATE POLICY "profile_owner_policy" ON public.restaurant_profile
  FOR ALL USING (public.user_owns_restaurant("restaurantId"));

-- RLS Offers
DROP POLICY IF EXISTS "offers_owner_policy" ON public.offers;
CREATE POLICY "offers_owner_policy" ON public.offers
  FOR ALL USING (public.user_owns_restaurant("restaurantId"));

-- RLS Social Accounts
DROP POLICY IF EXISTS "social_accounts_owner_policy" ON public.social_accounts;
CREATE POLICY "social_accounts_owner_policy" ON public.social_accounts
  FOR ALL USING (public.user_owns_restaurant("restaurantId"));

-- RLS Signals
DROP POLICY IF EXISTS "signals_owner_policy" ON public.signals;
CREATE POLICY "signals_owner_policy" ON public.signals
  FOR ALL USING (public.user_owns_restaurant("restaurantId"));

-- RLS Opportunities
DROP POLICY IF EXISTS "opportunities_owner_policy" ON public.opportunities;
CREATE POLICY "opportunities_owner_policy" ON public.opportunities
  FOR ALL USING (public.user_owns_restaurant("restaurantId"));

-- RLS Posts
DROP POLICY IF EXISTS "posts_owner_policy" ON public.posts;
CREATE POLICY "posts_owner_policy" ON public.posts
  FOR ALL USING (public.user_owns_restaurant("restaurantId"));

-- RLS Publications
DROP POLICY IF EXISTS "publications_owner_policy" ON public.publications;
CREATE POLICY "publications_owner_policy" ON public.publications
  FOR ALL USING (public.user_owns_restaurant("restaurantId"));

-- RLS Feedback
DROP POLICY IF EXISTS "feedback_owner_policy" ON public.feedback;
CREATE POLICY "feedback_owner_policy" ON public.feedback
  FOR ALL USING (public.user_owns_restaurant("restaurantId"));

-- RLS Audit Log (lecture seule pour le restaurant)
DROP POLICY IF EXISTS "audit_log_owner_policy" ON public.audit_log;
CREATE POLICY "audit_log_owner_policy" ON public.audit_log
  FOR ALL USING ("restaurantId" IS NULL OR public.user_owns_restaurant("restaurantId"));
