-- Catering BTW-id voor bedrijfsbestellingen
ALTER TABLE "CateringOrder" ADD COLUMN IF NOT EXISTS "vatId" TEXT NOT NULL DEFAULT '';

-- Franchise shop accounts, producten, prijzen per vestiging, bestellingen
CREATE TABLE IF NOT EXISTS "FranchiseAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FranchiseAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FranchiseAccount_email_key" ON "FranchiseAccount"("email");
CREATE INDEX IF NOT EXISTS "FranchiseAccount_locationId_idx" ON "FranchiseAccount"("locationId");

CREATE TABLE IF NOT EXISTS "FranchiseShopProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "sku" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FranchiseShopProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FranchiseProductPrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FranchiseProductPrice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FranchiseProductPrice_productId_locationId_key" ON "FranchiseProductPrice"("productId", "locationId");
CREATE INDEX IF NOT EXISTS "FranchiseProductPrice_locationId_idx" ON "FranchiseProductPrice"("locationId");

CREATE TABLE IF NOT EXISTS "FranchiseShopOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'nieuw',
    "accountId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "locationCode" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "invoiceNumber" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "FranchiseShopOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FranchiseShopOrder_orderNumber_key" ON "FranchiseShopOrder"("orderNumber");
CREATE INDEX IF NOT EXISTS "FranchiseShopOrder_accountId_idx" ON "FranchiseShopOrder"("accountId");
CREATE INDEX IF NOT EXISTS "FranchiseShopOrder_locationId_idx" ON "FranchiseShopOrder"("locationId");
CREATE INDEX IF NOT EXISTS "FranchiseShopOrder_createdAt_idx" ON "FranchiseShopOrder"("createdAt");

CREATE TABLE IF NOT EXISTS "FranchiseShopOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "lineTotalCents" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FranchiseShopOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FranchiseShopOrderItem_orderId_sortOrder_idx" ON "FranchiseShopOrderItem"("orderId", "sortOrder");

DO $$ BEGIN
  ALTER TABLE "FranchiseAccount" ADD CONSTRAINT "FranchiseAccount_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FranchiseProductPrice" ADD CONSTRAINT "FranchiseProductPrice_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "FranchiseShopProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FranchiseProductPrice" ADD CONSTRAINT "FranchiseProductPrice_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FranchiseShopOrder" ADD CONSTRAINT "FranchiseShopOrder_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "FranchiseAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FranchiseShopOrderItem" ADD CONSTRAINT "FranchiseShopOrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "FranchiseShopOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
