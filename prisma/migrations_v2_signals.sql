-- =============================================================================
-- Migration V2 : Enrichissement des signaux et opportunités (Phase 1)
-- =============================================================================

-- 1. Nettoyage préventif des signaux temporaires mal formés (sans unicité)
DELETE FROM "signals" WHERE "createdAt" < NOW() - INTERVAL '3 days';

-- 2. Ajout des colonnes sur signals
ALTER TABLE "signals" 
  ADD COLUMN IF NOT EXISTS "externalId" TEXT,
  ADD COLUMN IF NOT EXISTS "category" TEXT,
  ADD COLUMN IF NOT EXISTS "startsAt" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "endsAt" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "distanceMeters" INTEGER,
  ADD COLUMN IF NOT EXISTS "isFallback" BOOLEAN NOT NULL DEFAULT false;

-- 3. Ajout de la contrainte d'unicité et index
CREATE UNIQUE INDEX IF NOT EXISTS "uq_signals_restaurant_source_external" 
  ON "signals" ("restaurantId", "source", "externalId")
  WHERE "externalId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_signals_restaurant_starts_at" 
  ON "signals" ("restaurantId", "startsAt");

-- 4. Ajout des colonnes sur opportunities
ALTER TABLE "opportunities"
  ADD COLUMN IF NOT EXISTS "forDate" TEXT,
  ADD COLUMN IF NOT EXISTS "timeSlot" TEXT,
  ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'ai';

CREATE INDEX IF NOT EXISTS "idx_opportunities_date"
  ON "opportunities" ("restaurantId", "forDate");
