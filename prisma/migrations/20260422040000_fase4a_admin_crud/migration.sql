-- FASE 4.A — Admin CRUD baseline
-- CAMBIOS 18.4: notas comerciales privadas del admin sobre cada usuario
-- CAMBIOS 21.3: campos editables de salas (deal, master, rating, flags)
-- CAMBIOS 22: service fields serán añadidos en subfase posterior

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;

ALTER TABLE "PokerRoom"
  ADD COLUMN IF NOT EXISTS "shortDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "longDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "dealCurrent" INTEGER,
  ADD COLUMN IF NOT EXISTS "dealMax" INTEGER,
  ADD COLUMN IF NOT EXISTS "registrationCode" TEXT,
  ADD COLUMN IF NOT EXISTS "master" TEXT,
  ADD COLUMN IF NOT EXISTS "requiresRenting" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "noKyc" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "rating" INTEGER;

-- CAMBIOS 22 — FASE 4.A.7: servicios con candado + publicable + whitelist
ALTER TABLE "Service"
  ADD COLUMN IF NOT EXISTS "priceVisible" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "locked" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "lockedLabel" TEXT;

CREATE TABLE IF NOT EXISTS "ServiceWhitelist" (
  "serviceId" TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "addedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "addedBy"   TEXT,
  CONSTRAINT "ServiceWhitelist_pkey" PRIMARY KEY ("serviceId", "userId")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ServiceWhitelist_serviceId_fkey') THEN
    ALTER TABLE "ServiceWhitelist"
      ADD CONSTRAINT "ServiceWhitelist_serviceId_fkey"
      FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ServiceWhitelist_userId_fkey') THEN
    ALTER TABLE "ServiceWhitelist"
      ADD CONSTRAINT "ServiceWhitelist_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ServiceWhitelist_userId_idx" ON "ServiceWhitelist"("userId");
