-- Track first vs returning admin logins (for feature highlights)

ALTER TABLE "AdminUser" ADD COLUMN "loginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdminUser" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- Bestaande accounts hebben de admin al gebruikt → geen "eerste login"-highlight
UPDATE "AdminUser" SET "loginCount" = 1 WHERE "loginCount" = 0;
