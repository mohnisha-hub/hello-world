-- Persist the optional profile scent picks used by the public profile.
-- The production database predates this field, so keep the default compatible
-- with existing collector accounts.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "scentShowcase" TEXT NOT NULL DEFAULT '{}';
