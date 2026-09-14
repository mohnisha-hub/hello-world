-- Each marketplace listing may represent more than one available unit.
ALTER TABLE "Perfume" ADD COLUMN "unitsAvailable" INTEGER NOT NULL DEFAULT 1;
