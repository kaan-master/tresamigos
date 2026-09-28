-- Google Gmail OAuth + notificatie-adressen per categorie
ALTER TABLE "IntegrationSettings" ADD COLUMN IF NOT EXISTS "mailRelayGoogleRefreshToken" TEXT NOT NULL DEFAULT '';
ALTER TABLE "IntegrationSettings" ADD COLUMN IF NOT EXISTS "mailRelayGoogleAccessToken" TEXT NOT NULL DEFAULT '';
ALTER TABLE "IntegrationSettings" ADD COLUMN IF NOT EXISTS "mailRelayGoogleTokenExpiry" TIMESTAMP(3);
ALTER TABLE "IntegrationSettings" ADD COLUMN IF NOT EXISTS "mailRelayGoogleEmail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "IntegrationSettings" ADD COLUMN IF NOT EXISTS "mailNotifyApplications" TEXT NOT NULL DEFAULT 'work@tresamigos.nl';
ALTER TABLE "IntegrationSettings" ADD COLUMN IF NOT EXISTS "mailNotifyCatering" TEXT NOT NULL DEFAULT 'catering@tresamigos.nl';
ALTER TABLE "IntegrationSettings" ADD COLUMN IF NOT EXISTS "mailNotifyFranchise" TEXT NOT NULL DEFAULT 'Vilmon@tresamigos.nl';
ALTER TABLE "IntegrationSettings" ADD COLUMN IF NOT EXISTS "mailNotifyOther" TEXT NOT NULL DEFAULT 'no-reply@tresamigos.nl';
