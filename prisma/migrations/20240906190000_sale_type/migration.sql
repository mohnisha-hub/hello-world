-- AlterTable
ALTER TABLE "Perfume" ADD COLUMN "saleType" TEXT NOT NULL DEFAULT 'buy';
ALTER TABLE "Perfume" ADD COLUMN "minBidCents" INTEGER;

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'bid';

-- Existing bid activity becomes bid-only listings
UPDATE "Perfume"
SET "saleType" = 'bid', "minBidCents" = "priceCents"
WHERE id IN (SELECT DISTINCT "perfumeId" FROM "Bid");
