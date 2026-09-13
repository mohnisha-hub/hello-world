ALTER TABLE "Perfume" ADD COLUMN "bidEndsAt" TIMESTAMP(3);

CREATE INDEX "Perfume_bidEndsAt_idx" ON "Perfume"("bidEndsAt");
