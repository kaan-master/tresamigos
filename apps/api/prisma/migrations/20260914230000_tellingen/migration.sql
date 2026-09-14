-- CreateTable
CREATE TABLE "CountCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountProduct" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountStaff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "loginLookup" TEXT NOT NULL,
    "loginHash" TEXT NOT NULL,
    "loginHint" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountSession" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "staffId" TEXT,
    "staffName" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "countDate" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountLine" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "quantity" DECIMAL(10,2),
    "note" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CountLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CountProduct_categoryId_sortOrder_idx" ON "CountProduct"("categoryId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CountStaff_loginLookup_key" ON "CountStaff"("loginLookup");

-- CreateIndex
CREATE UNIQUE INDEX "CountSession_locationId_countDate_shift_key" ON "CountSession"("locationId", "countDate", "shift");

-- CreateIndex
CREATE INDEX "CountSession_countDate_shift_idx" ON "CountSession"("countDate", "shift");

-- CreateIndex
CREATE INDEX "CountSession_staffId_idx" ON "CountSession"("staffId");

-- CreateIndex
CREATE INDEX "CountLine_sessionId_sortOrder_idx" ON "CountLine"("sessionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "CountProduct" ADD CONSTRAINT "CountProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CountCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountStaff" ADD CONSTRAINT "CountStaff_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountSession" ADD CONSTRAINT "CountSession_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountSession" ADD CONSTRAINT "CountSession_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "CountStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountLine" ADD CONSTRAINT "CountLine_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CountSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountLine" ADD CONSTRAINT "CountLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CountProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
