CREATE TABLE "ScentHeart" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "slot" TEXT NOT NULL,
  "perfumeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScentHeart_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScentHeart_userId_profileId_slot_key" ON "ScentHeart"("userId", "profileId", "slot");
CREATE INDEX "ScentHeart_profileId_slot_idx" ON "ScentHeart"("profileId", "slot");
ALTER TABLE "ScentHeart" ADD CONSTRAINT "ScentHeart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScentHeart" ADD CONSTRAINT "ScentHeart_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
