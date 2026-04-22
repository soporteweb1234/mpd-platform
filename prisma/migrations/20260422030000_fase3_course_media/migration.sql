-- FASE 3.3 — Course media for redesigned catalogue (CAMBIOS 10)
-- + User profile extended fields (CAMBIOS 13.1)

ALTER TABLE "Course"
  ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "tagline" TEXT;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "availability" TEXT,
  ADD COLUMN IF NOT EXISTS "bio" TEXT;
