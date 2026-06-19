-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "vacancyRoles" JSONB NOT NULL DEFAULT '{}';
