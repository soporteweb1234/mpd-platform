-- FASE 9: Referral engine viral (auto-crediting L1+L2 + anti-fraud + milestones)

-- 1) ReferralAttributionStatus enum
DO $$ BEGIN
  CREATE TYPE "ReferralAttributionStatus" AS ENUM (
    'PENDING', 'AVAILABLE', 'HELD', 'REJECTED', 'REVERSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) User columns (signupIp, leaderboardOptOut)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signupIp" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "leaderboardOptOut" BOOLEAN NOT NULL DEFAULT FALSE;

-- 3) ReferralAttribution
CREATE TABLE IF NOT EXISTS "ReferralAttribution" (
  "id"              TEXT PRIMARY KEY,
  "referrerId"      TEXT NOT NULL,
  "referredId"      TEXT NOT NULL,
  "level"           INTEGER NOT NULL,
  "rakebackRecordId" TEXT,
  "sourceAmount"    DECIMAL(14,2) NOT NULL,
  "commissionPct"   DECIMAL(5,2) NOT NULL,
  "amount"          DECIMAL(14,2) NOT NULL,
  "status"          "ReferralAttributionStatus" NOT NULL DEFAULT 'PENDING',
  "maturedAt"       TIMESTAMP(3),
  "paidAt"          TIMESTAMP(3),
  "balanceTxId"     TEXT,
  "flaggedReason"   TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralAttribution_referrerId_fkey" FOREIGN KEY ("referrerId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReferralAttribution_referredId_fkey" FOREIGN KEY ("referredId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReferralAttribution_unique_rec" UNIQUE ("referrerId", "rakebackRecordId", "level")
);

CREATE INDEX IF NOT EXISTS "ReferralAttribution_referrerId_createdAt_idx"
  ON "ReferralAttribution"("referrerId", "createdAt");
CREATE INDEX IF NOT EXISTS "ReferralAttribution_referredId_createdAt_idx"
  ON "ReferralAttribution"("referredId", "createdAt");
CREATE INDEX IF NOT EXISTS "ReferralAttribution_status_maturedAt_idx"
  ON "ReferralAttribution"("status", "maturedAt");
CREATE INDEX IF NOT EXISTS "ReferralAttribution_rakebackRecordId_idx"
  ON "ReferralAttribution"("rakebackRecordId");

-- 4) ReferralMilestone
CREATE TABLE IF NOT EXISTS "ReferralMilestone" (
  "id"          TEXT PRIMARY KEY,
  "code"        TEXT NOT NULL,
  "label"       TEXT NOT NULL,
  "description" TEXT,
  "threshold"   DECIMAL(14,2) NOT NULL,
  "metric"      TEXT NOT NULL,
  "bonusAmount" DECIMAL(14,2) NOT NULL,
  "active"      BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralMilestone_code_key" UNIQUE ("code")
);

-- 5) ReferralMilestoneAward
CREATE TABLE IF NOT EXISTS "ReferralMilestoneAward" (
  "id"          TEXT PRIMARY KEY,
  "milestoneId" TEXT NOT NULL,
  "referrerId"  TEXT NOT NULL,
  "referredId"  TEXT NOT NULL,
  "awardedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "amount"      DECIMAL(14,2) NOT NULL,
  "balanceTxId" TEXT,
  CONSTRAINT "ReferralMilestoneAward_milestone_fkey" FOREIGN KEY ("milestoneId")
    REFERENCES "ReferralMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReferralMilestoneAward_referrer_fkey" FOREIGN KEY ("referrerId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReferralMilestoneAward_referred_fkey" FOREIGN KEY ("referredId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReferralMilestoneAward_unique" UNIQUE ("milestoneId", "referrerId", "referredId")
);

CREATE INDEX IF NOT EXISTS "ReferralMilestoneAward_referrerId_awardedAt_idx"
  ON "ReferralMilestoneAward"("referrerId", "awardedAt");

-- 6) ReferralFraudFlag
CREATE TABLE IF NOT EXISTS "ReferralFraudFlag" (
  "id"         TEXT PRIMARY KEY,
  "userId"     TEXT NOT NULL,
  "reason"     TEXT NOT NULL,
  "severity"   TEXT NOT NULL DEFAULT 'MEDIUM',
  "evidence"   JSONB NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'OPEN',
  "resolvedBy" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "notes"      TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralFraudFlag_user_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReferralFraudFlag_unique" UNIQUE ("userId", "reason", "status")
);

CREATE INDEX IF NOT EXISTS "ReferralFraudFlag_userId_status_idx"
  ON "ReferralFraudFlag"("userId", "status");
CREATE INDEX IF NOT EXISTS "ReferralFraudFlag_status_createdAt_idx"
  ON "ReferralFraudFlag"("status", "createdAt");

-- 7) ReferralPolicy singleton
CREATE TABLE IF NOT EXISTS "ReferralPolicy" (
  "id"                 TEXT PRIMARY KEY DEFAULT 'global',
  "defaultL1Percent"   DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  "defaultL2Percent"   DECIMAL(5,2) NOT NULL DEFAULT 2.00,
  "maxL1Percent"       DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  "maxL2Percent"       DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  "holdDays"           INTEGER NOT NULL DEFAULT 7,
  "leaderboardEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy"          TEXT
);

-- Seed singleton row
INSERT INTO "ReferralPolicy"("id") VALUES ('global') ON CONFLICT ("id") DO NOTHING;
