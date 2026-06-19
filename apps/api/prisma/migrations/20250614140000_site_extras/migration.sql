-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "openingHours" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "SiteSettings" ADD COLUMN "ourStory" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "SiteSettings" ADD COLUMN "reviews" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "SiteSettings" ADD COLUMN "promoPopup" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "SiteSettings" ADD COLUMN "mailRelay" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "PromoLead" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoLead_email_key" ON "PromoLead"("email");
