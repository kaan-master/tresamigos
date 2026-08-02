-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSettings" (
    "id" TEXT NOT NULL DEFAULT 'primary',
    "mailRelayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mailRelayProvider" TEXT NOT NULL DEFAULT 'smtp',
    "mailRelayHost" TEXT NOT NULL DEFAULT '',
    "mailRelayPort" INTEGER NOT NULL DEFAULT 587,
    "mailRelaySecure" BOOLEAN NOT NULL DEFAULT false,
    "mailRelayUsername" TEXT NOT NULL DEFAULT '',
    "mailRelayPassword" TEXT NOT NULL DEFAULT '',
    "mailRelayFromEmail" TEXT NOT NULL DEFAULT '',
    "mailRelayFromName" TEXT NOT NULL DEFAULT 'Tres Amigos',
    "mailRelayLastTestAt" TIMESTAMP(3),
    "mailRelayLastStatus" TEXT NOT NULL DEFAULT '',
    "mailRelayLastMessage" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_subscribedAt_idx" ON "NewsletterSubscriber"("subscribedAt");
