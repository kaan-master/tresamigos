-- Mollie payment keys (test + live) on IntegrationSettings

ALTER TABLE "IntegrationSettings" ADD COLUMN "mollieEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "IntegrationSettings" ADD COLUMN "mollieMode" TEXT NOT NULL DEFAULT 'test';
ALTER TABLE "IntegrationSettings" ADD COLUMN "mollieLiveApiKey" TEXT NOT NULL DEFAULT '';
ALTER TABLE "IntegrationSettings" ADD COLUMN "mollieTestApiKey" TEXT NOT NULL DEFAULT '';
ALTER TABLE "IntegrationSettings" ADD COLUMN "mollieProfileId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "IntegrationSettings" ADD COLUMN "mollieLastTestAt" TIMESTAMP(3);
ALTER TABLE "IntegrationSettings" ADD COLUMN "mollieLastStatus" TEXT NOT NULL DEFAULT '';
ALTER TABLE "IntegrationSettings" ADD COLUMN "mollieLastMessage" TEXT NOT NULL DEFAULT '';
