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
