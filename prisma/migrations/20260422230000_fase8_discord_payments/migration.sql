-- FASE 8: Discord Role Sync + NOWPayments deposits
-- Idempotente: safe to re-run

-- 1) Add DEPOSIT_USDT to TransactionType enum
DO $$ BEGIN
  ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'DEPOSIT_USDT';
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

-- 2) Create PaymentProvider enum
DO $$ BEGIN
  CREATE TYPE "PaymentProvider" AS ENUM ('NOWPAYMENTS', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 3) Create PaymentIntentStatus enum
DO $$ BEGIN
  CREATE TYPE "PaymentIntentStatus" AS ENUM (
    'WAITING', 'CONFIRMING', 'CONFIRMED', 'FINISHED', 'FAILED', 'REFUNDED', 'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 4) PaymentIntent table
CREATE TABLE IF NOT EXISTS "PaymentIntent" (
  "id"              TEXT PRIMARY KEY,
  "userId"          TEXT NOT NULL,
  "provider"        "PaymentProvider" NOT NULL DEFAULT 'NOWPAYMENTS',
  "providerOrderId" TEXT NOT NULL,
  "amountUsd"       DECIMAL(12,2) NOT NULL,
  "network"         TEXT NOT NULL,
  "payCurrency"     TEXT NOT NULL,
  "payAddress"      TEXT,
  "payAmount"       DECIMAL(24,8),
  "status"          "PaymentIntentStatus" NOT NULL DEFAULT 'WAITING',
  "creditedAt"      TIMESTAMP(3),
  "txHash"          TEXT,
  "notes"           TEXT,
  "expiresAt"       TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentIntent_providerOrderId_key" UNIQUE ("providerOrderId"),
  CONSTRAINT "PaymentIntent_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PaymentIntent_userId_createdAt_idx"
  ON "PaymentIntent"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentIntent_status_idx"
  ON "PaymentIntent"("status");
CREATE INDEX IF NOT EXISTS "PaymentIntent_createdAt_idx"
  ON "PaymentIntent"("createdAt");

-- 5) PaymentWebhookEvent table
CREATE TABLE IF NOT EXISTS "PaymentWebhookEvent" (
  "id"          TEXT PRIMARY KEY,
  "intentId"    TEXT NOT NULL,
  "eventHash"   TEXT NOT NULL,
  "payload"     JSONB NOT NULL,
  "receivedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed"   BOOLEAN NOT NULL DEFAULT FALSE,
  "processedAt" TIMESTAMP(3),
  "error"       TEXT,
  CONSTRAINT "PaymentWebhookEvent_eventHash_key" UNIQUE ("eventHash"),
  CONSTRAINT "PaymentWebhookEvent_intentId_fkey" FOREIGN KEY ("intentId")
    REFERENCES "PaymentIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PaymentWebhookEvent_intentId_receivedAt_idx"
  ON "PaymentWebhookEvent"("intentId", "receivedAt");

-- 6) DiscordRoleSyncLog table
CREATE TABLE IF NOT EXISTS "DiscordRoleSyncLog" (
  "id"             TEXT PRIMARY KEY,
  "userId"         TEXT NOT NULL,
  "discordId"      TEXT NOT NULL,
  "fromStratum"    "PlayerStratum",
  "toStratum"      "PlayerStratum" NOT NULL,
  "addedRoleId"    TEXT,
  "removedRoleId"  TEXT,
  "source"         TEXT NOT NULL,
  "success"        BOOLEAN NOT NULL,
  "error"          TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiscordRoleSyncLog_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DiscordRoleSyncLog_userId_createdAt_idx"
  ON "DiscordRoleSyncLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "DiscordRoleSyncLog_createdAt_idx"
  ON "DiscordRoleSyncLog"("createdAt");
CREATE INDEX IF NOT EXISTS "DiscordRoleSyncLog_success_createdAt_idx"
  ON "DiscordRoleSyncLog"("success", "createdAt");
