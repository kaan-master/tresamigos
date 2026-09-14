-- Page media slots (afbeeldingen + focal points per pagina)
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "pageMedia" JSONB NOT NULL DEFAULT '{}';
