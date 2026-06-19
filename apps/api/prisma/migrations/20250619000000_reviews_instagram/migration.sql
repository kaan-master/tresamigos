-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "instagramFeed" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReviewSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "author" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "rating" INTEGER NOT NULL DEFAULT 5,
    "text" TEXT NOT NULL,
    "publishedAt" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ReviewSubmission_pkey" PRIMARY KEY ("id")
);
