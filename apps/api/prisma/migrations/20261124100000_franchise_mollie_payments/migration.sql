-- Franchise: factuur vs iDEAL + Mollie payment state op orders

ALTER TABLE "FranchiseAccount" ADD COLUMN "allowInvoicePayment" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "FranchiseShopOrder" ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'invoice';
ALTER TABLE "FranchiseShopOrder" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "FranchiseShopOrder" ADD COLUMN "molliePaymentId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "FranchiseShopOrder" ADD COLUMN "paidAt" TIMESTAMP(3);

CREATE INDEX "FranchiseShopOrder_molliePaymentId_idx" ON "FranchiseShopOrder"("molliePaymentId");
