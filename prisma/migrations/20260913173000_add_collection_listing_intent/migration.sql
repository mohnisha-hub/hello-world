ALTER TABLE "Perfume" ADD COLUMN "listingIntent" TEXT NOT NULL DEFAULT 'marketplace';

CREATE INDEX "Perfume_listingIntent_status_idx" ON "Perfume"("listingIntent", "status");
