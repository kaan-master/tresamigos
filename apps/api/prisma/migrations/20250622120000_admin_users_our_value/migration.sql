-- Admin subaccounts + Our Value + SEO global fields
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "seoSiteUrl" TEXT NOT NULL DEFAULT 'https://tresamigos.nl';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "seoGoogleVerification" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "seoBingVerification" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "ourValue" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "permissions" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email");
