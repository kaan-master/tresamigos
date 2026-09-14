CREATE TABLE "CountListProduct" (
    "listId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CountListProduct_pkey" PRIMARY KEY ("listId","productId")
);

INSERT INTO "CountListProduct" ("listId", "productId", "sortOrder")
SELECT c."listId", p."id", p."sortOrder"
FROM "CountProduct" p
INNER JOIN "CountCategory" c ON c."id" = p."categoryId"
WHERE c."listId" IS NOT NULL
ON CONFLICT ("listId", "productId") DO NOTHING;

CREATE INDEX "CountListProduct_listId_sortOrder_idx" ON "CountListProduct"("listId", "sortOrder");

ALTER TABLE "CountListProduct" ADD CONSTRAINT "CountListProduct_listId_fkey" FOREIGN KEY ("listId") REFERENCES "CountList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CountListProduct" ADD CONSTRAINT "CountListProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CountProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CountCategory" DROP CONSTRAINT IF EXISTS "CountCategory_listId_fkey";
DROP INDEX IF EXISTS "CountCategory_listId_sortOrder_idx";
ALTER TABLE "CountCategory" DROP COLUMN IF EXISTS "listId";
