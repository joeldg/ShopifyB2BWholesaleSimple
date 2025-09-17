-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "customerTags" JSONB NOT NULL,
    "productIds" JSONB NOT NULL,
    "collectionIds" JSONB NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" REAL NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AutoTaggingRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "criteriaType" TEXT NOT NULL,
    "criteriaValue" REAL NOT NULL,
    "targetTag" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WholesaleApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "customerId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "businessName" TEXT,
    "applicationData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "PricingRule_shop_idx" ON "PricingRule"("shop");

-- CreateIndex
CREATE INDEX "PricingRule_isActive_idx" ON "PricingRule"("isActive");

-- CreateIndex
CREATE INDEX "AutoTaggingRule_shop_idx" ON "AutoTaggingRule"("shop");

-- CreateIndex
CREATE INDEX "AutoTaggingRule_isActive_idx" ON "AutoTaggingRule"("isActive");

-- CreateIndex
CREATE INDEX "WholesaleApplication_shop_idx" ON "WholesaleApplication"("shop");

-- CreateIndex
CREATE INDEX "WholesaleApplication_status_idx" ON "WholesaleApplication"("status");

-- CreateIndex
CREATE INDEX "WholesaleApplication_customerEmail_idx" ON "WholesaleApplication"("customerEmail");
