-- Per-categorie Google Gmail-koppelingen (JSON)
ALTER TABLE "IntegrationSettings" ADD COLUMN IF NOT EXISTS "mailRelayGoogleByCategory" JSONB NOT NULL DEFAULT '{}';
