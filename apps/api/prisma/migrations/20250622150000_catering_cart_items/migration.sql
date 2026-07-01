-- AlterTable
ALTER TABLE "CateringOrder" ADD COLUMN "items" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "CateringOrder" ADD COLUMN "subtotalCents" INTEGER NOT NULL DEFAULT 0;
