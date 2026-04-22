-- FASE 6 — Calendario global (§33)
-- CalendarEvent + 2 enums. Patrón 4.A.7 idempotente.

-- ============================================
-- Enums
-- ============================================
DO $$
BEGIN
  CREATE TYPE "CalendarEventCategory" AS ENUM (
    'GENERAL', 'TORNEO', 'COMUNIDAD', 'MANTENIMIENTO', 'FORMACION', 'PAGOS'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "CalendarEventVisibility" AS ENUM (
    'PUBLIC', 'STRATUM_ONLY', 'ADMIN_ONLY'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- CalendarEvent
-- ============================================
CREATE TABLE IF NOT EXISTS "CalendarEvent" (
  "id"          TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "startAt"     TIMESTAMP(3) NOT NULL,
  "endAt"       TIMESTAMP(3),
  "category"    "CalendarEventCategory"   NOT NULL DEFAULT 'GENERAL',
  "visibility"  "CalendarEventVisibility" NOT NULL DEFAULT 'PUBLIC',
  "color"       TEXT,
  "location"    TEXT,
  "url"         TEXT,
  "createdBy"   TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CalendarEvent_startAt_idx"
  ON "CalendarEvent" ("startAt");

CREATE INDEX IF NOT EXISTS "CalendarEvent_visibility_startAt_idx"
  ON "CalendarEvent" ("visibility", "startAt");

CREATE INDEX IF NOT EXISTS "CalendarEvent_createdBy_idx"
  ON "CalendarEvent" ("createdBy");

-- FK creator → User (RESTRICT: no borrar user con eventos creados)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CalendarEvent_createdBy_fkey') THEN
    ALTER TABLE "CalendarEvent"
      ADD CONSTRAINT "CalendarEvent_createdBy_fkey"
      FOREIGN KEY ("createdBy") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
