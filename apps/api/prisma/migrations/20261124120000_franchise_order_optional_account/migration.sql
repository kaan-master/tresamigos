-- Handmatige registratie: account optioneel (WhatsApp), contact + prijsoverride

ALTER TABLE "FranchiseShopOrder" ALTER COLUMN "accountId" DROP NOT NULL;
ALTER TABLE "FranchiseShopOrder" ADD COLUMN "contactName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "FranchiseShopOrder" ADD COLUMN "contactPhone" TEXT NOT NULL DEFAULT '';
