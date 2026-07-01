-- CreateTable
CREATE TABLE "CateringOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'nieuw',
    "boxId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "proteins" TEXT[],
    "toppings" TEXT[],
    "salsas" TEXT[],
    "diet" TEXT[],
    "notes" TEXT NOT NULL DEFAULT '',
    "fulfillment" TEXT NOT NULL,
    "locationId" TEXT NOT NULL DEFAULT '',
    "locationName" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "eventDate" TEXT NOT NULL,
    "eventTime" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "company" TEXT NOT NULL DEFAULT '',
    "adminNotes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "CateringOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CateringOrder_orderNumber_key" ON "CateringOrder"("orderNumber");
