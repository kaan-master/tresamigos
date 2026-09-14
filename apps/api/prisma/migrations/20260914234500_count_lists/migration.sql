-- CreateTable
CREATE TABLE "CountList" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountList_pkey" PRIMARY KEY ("id")
);

INSERT INTO "CountList" ("id", "title", "active", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('lijst-start', 'Lijst start', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lijst-sluit', 'Lijst sluit', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "CountCategory" ADD COLUMN "listId" TEXT;

UPDATE "CountCategory" SET "listId" = 'lijst-sluit' WHERE "listId" IS NULL;

ALTER TABLE "CountCategory" ALTER COLUMN "listId" SET NOT NULL;

CREATE INDEX "CountCategory_listId_sortOrder_idx" ON "CountCategory"("listId", "sortOrder");

ALTER TABLE "CountCategory" ADD CONSTRAINT "CountCategory_listId_fkey" FOREIGN KEY ("listId") REFERENCES "CountList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CountSession" ADD COLUMN "listId" TEXT;
ALTER TABLE "CountSession" ADD COLUMN "listTitle" TEXT NOT NULL DEFAULT '';

UPDATE "CountSession" SET "listId" = 'lijst-sluit', "listTitle" = 'Lijst sluit' WHERE "listId" IS NULL;

ALTER TABLE "CountSession" ALTER COLUMN "listId" SET NOT NULL;

DROP INDEX IF EXISTS "CountSession_locationId_countDate_shift_key";

CREATE UNIQUE INDEX "CountSession_locationId_countDate_shift_listId_key" ON "CountSession"("locationId", "countDate", "shift", "listId");

CREATE INDEX "CountSession_listId_idx" ON "CountSession"("listId");

ALTER TABLE "CountSession" ADD CONSTRAINT "CountSession_listId_fkey" FOREIGN KEY ("listId") REFERENCES "CountList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
