-- Light profile + unique recovery code
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "recovery_code" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "recovery_code_created_at" timestamptz;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_completed_at" timestamptz;

-- Backfill readable codes for existing rows (deterministic from id; new users get crypto-random codes)
UPDATE "users"
SET
  "recovery_code" = 'DH-' || upper(substr(md5("id"), 1, 4)) || '-' || upper(substr(md5("id" || '-dh'), 1, 4)),
  "recovery_code_created_at" = COALESCE("recovery_code_created_at", now())
WHERE "recovery_code" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "users_recovery_code_uidx" ON "users" ("recovery_code");
