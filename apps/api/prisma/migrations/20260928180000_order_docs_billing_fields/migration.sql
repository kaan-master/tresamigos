-- Franchise account factuurgegevens + catering factuurnummer/kvk
ALTER TABLE "FranchiseAccount" ADD COLUMN IF NOT EXISTS "company" TEXT NOT NULL DEFAULT '';
ALTER TABLE "FranchiseAccount" ADD COLUMN IF NOT EXISTS "vatId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "FranchiseAccount" ADD COLUMN IF NOT EXISTS "kvk" TEXT NOT NULL DEFAULT '';

ALTER TABLE "CateringOrder" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CateringOrder" ADD COLUMN IF NOT EXISTS "kvk" TEXT NOT NULL DEFAULT '';
