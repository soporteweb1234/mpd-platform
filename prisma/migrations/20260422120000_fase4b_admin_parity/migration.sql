-- FASE 4.B — Admin paridad
-- CAMBIOS 24: BankingCandidate (scaffold, user-side diferido a 4.C)
-- CAMBIOS 25: ReferralCommission (override % por user×user×room+período)
-- CAMBIOS 30: SuggestedQuestion (CRUD admin del bot interno; pipe a /dashboard/chat en FASE 5)

-- ============================================
-- Enum: BankingCandidateStatus (idempotente)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BankingCandidateStatus') THEN
    CREATE TYPE "BankingCandidateStatus" AS ENUM ('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED');
  END IF;
END $$;

-- ============================================
-- ReferralCommission
-- ============================================
CREATE TABLE IF NOT EXISTS "ReferralCommission" (
  "id"                TEXT NOT NULL,
  "referrerId"        TEXT NOT NULL,
  "referredId"        TEXT NOT NULL,
  "roomId"            TEXT NOT NULL,
  "commissionPercent" DECIMAL(5,2) NOT NULL,
  "periodStart"       TIMESTAMP(3) NOT NULL,
  "periodEnd"         TIMESTAMP(3),
  "active"            BOOLEAN NOT NULL DEFAULT TRUE,
  "notes"             TEXT,
  "createdBy"         TEXT NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralCommission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReferralCommission_referrerId_referredId_roomId_periodStart_key"
  ON "ReferralCommission" ("referrerId", "referredId", "roomId", "periodStart");
CREATE INDEX IF NOT EXISTS "ReferralCommission_referrerId_idx" ON "ReferralCommission" ("referrerId");
CREATE INDEX IF NOT EXISTS "ReferralCommission_referredId_idx" ON "ReferralCommission" ("referredId");
CREATE INDEX IF NOT EXISTS "ReferralCommission_roomId_idx"     ON "ReferralCommission" ("roomId");
CREATE INDEX IF NOT EXISTS "ReferralCommission_active_idx"     ON "ReferralCommission" ("active");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReferralCommission_referrerId_fkey') THEN
    ALTER TABLE "ReferralCommission"
      ADD CONSTRAINT "ReferralCommission_referrerId_fkey"
      FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReferralCommission_referredId_fkey') THEN
    ALTER TABLE "ReferralCommission"
      ADD CONSTRAINT "ReferralCommission_referredId_fkey"
      FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReferralCommission_roomId_fkey') THEN
    ALTER TABLE "ReferralCommission"
      ADD CONSTRAINT "ReferralCommission_roomId_fkey"
      FOREIGN KEY ("roomId") REFERENCES "PokerRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- SuggestedQuestion (bot interno)
-- ============================================
CREATE TABLE IF NOT EXISTS "SuggestedQuestion" (
  "id"          TEXT NOT NULL,
  "question"    TEXT NOT NULL,
  "category"    TEXT,
  "priority"    INTEGER NOT NULL DEFAULT 0,
  "active"      BOOLEAN NOT NULL DEFAULT TRUE,
  "timesAsked"  INTEGER NOT NULL DEFAULT 0,
  "createdBy"   TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SuggestedQuestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SuggestedQuestion_active_priority_idx"
  ON "SuggestedQuestion" ("active", "priority" DESC);

-- ============================================
-- BankingCandidate (scaffold)
-- ============================================
CREATE TABLE IF NOT EXISTS "BankingCandidate" (
  "id"               TEXT NOT NULL,
  "userId"           TEXT NOT NULL,
  "status"           "BankingCandidateStatus" NOT NULL DEFAULT 'PENDING',
  "monthlyBankroll"  DECIMAL(12,2),
  "graphUrl"         TEXT,
  "documentsJson"    JSONB,
  "notes"            TEXT,
  "reviewedBy"       TEXT,
  "reviewedAt"       TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BankingCandidate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BankingCandidate_userId_key" ON "BankingCandidate" ("userId");
CREATE INDEX IF NOT EXISTS "BankingCandidate_status_idx" ON "BankingCandidate" ("status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BankingCandidate_userId_fkey') THEN
    ALTER TABLE "BankingCandidate"
      ADD CONSTRAINT "BankingCandidate_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
