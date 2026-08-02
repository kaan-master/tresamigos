-- AlterTable
ALTER TABLE "IntegrationSettings" ADD COLUMN "googleAdsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "IntegrationSettings" ADD COLUMN "googleAdsConversionId" TEXT NOT NULL DEFAULT 'AW-16851426878';
ALTER TABLE "IntegrationSettings" ADD COLUMN "newsletterEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "IntegrationSettings" ADD COLUMN "newsletterShowFooter" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "IntegrationSettings" ADD COLUMN "newsletterShowHome" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "IntegrationSettings" ADD COLUMN "newsletterShowPages" BOOLEAN NOT NULL DEFAULT true;
