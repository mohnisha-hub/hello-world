-- The original deadline migration created the column before its migration
-- record failed. Ensure its lookup index exists without disturbing data.
CREATE INDEX IF NOT EXISTS "Perfume_bidEndsAt_idx" ON "Perfume"("bidEndsAt");
