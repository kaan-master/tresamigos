-- Google OAuth Client ID/Secret opslaan in admin (niet alleen .env)
ALTER TABLE "IntegrationSettings" ADD COLUMN IF NOT EXISTS "mailRelayGoogleClientId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "IntegrationSettings" ADD COLUMN IF NOT EXISTS "mailRelayGoogleClientSecret" TEXT NOT NULL DEFAULT '';
