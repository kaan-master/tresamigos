-- CreateTable
CREATE TABLE "FranchiseInquiry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'nieuw',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "desiredLocation" TEXT NOT NULL DEFAULT '',
    "currentRole" TEXT NOT NULL DEFAULT '',
    "company" TEXT NOT NULL DEFAULT '',
    "investment" TEXT NOT NULL DEFAULT '',
    "visitedLocation" TEXT NOT NULL DEFAULT '',
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FranchiseInquiry_pkey" PRIMARY KEY ("id")
);
