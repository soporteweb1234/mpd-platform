-- StatusLevel enum
DO $$ BEGIN
  CREATE TYPE "StatusLevel" AS ENUM ('APRENDIZ', 'VERSADO', 'PROFESIONAL', 'EXPERTO', 'MAESTRO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- User: statusLevel + prestigeScore + reputationScore
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "statusLevel" "StatusLevel" NOT NULL DEFAULT 'APRENDIZ',
  ADD COLUMN IF NOT EXISTS "prestigeScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reputationScore" INTEGER NOT NULL DEFAULT 0;

-- RoomAffiliation: nickname / roomEmail / referralCodeAtRoom / codeId
ALTER TABLE "RoomAffiliation"
  ADD COLUMN IF NOT EXISTS "nickname" TEXT,
  ADD COLUMN IF NOT EXISTS "roomEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "referralCodeAtRoom" TEXT,
  ADD COLUMN IF NOT EXISTS "codeId" TEXT;
