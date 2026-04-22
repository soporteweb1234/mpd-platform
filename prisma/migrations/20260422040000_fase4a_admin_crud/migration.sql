-- FASE 4.A — Admin CRUD baseline
-- CAMBIOS 18.4: notas comerciales privadas del admin sobre cada usuario
-- CAMBIOS 21.3 / 22: room + service fields serán añadidos en subfases posteriores

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;
