-- CreateTable
CREATE TABLE "sale_promotions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "bannerImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_promotion_products" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sale_promotion_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sale_promotions_isActive_idx" ON "sale_promotions"("isActive");
CREATE INDEX "sale_promotions_startDate_endDate_idx" ON "sale_promotions"("startDate", "endDate");

CREATE UNIQUE INDEX "sale_promotion_products_promotionId_productId_key" ON "sale_promotion_products"("promotionId", "productId");
CREATE UNIQUE INDEX "sale_promotion_products_promotionId_displayOrder_key" ON "sale_promotion_products"("promotionId", "displayOrder");
CREATE INDEX "sale_promotion_products_promotionId_idx" ON "sale_promotion_products"("promotionId");
CREATE INDEX "sale_promotion_products_productId_idx" ON "sale_promotion_products"("productId");

-- AddForeignKey
ALTER TABLE "sale_promotion_products" ADD CONSTRAINT "sale_promotion_products_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "sale_promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_promotion_products" ADD CONSTRAINT "sale_promotion_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
