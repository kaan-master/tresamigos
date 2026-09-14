ALTER TABLE "Location" ADD COLUMN "code" TEXT;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "sortOrder" ASC, name ASC) AS n
  FROM "Location"
)
UPDATE "Location" l
SET "code" = LPAD(ranked.n::text, 3, '0')
FROM ranked
WHERE l.id = ranked.id;

ALTER TABLE "Location" ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

ALTER TABLE "CountSession" ADD COLUMN "locationCode" TEXT NOT NULL DEFAULT '';

UPDATE "CountSession" s
SET "locationCode" = l."code"
FROM "Location" l
WHERE s."locationId" = l.id;
