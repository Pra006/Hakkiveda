-- AlterTable: add featured product controls
ALTER TABLE "products" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "featuredOrder" INTEGER;

-- CreateIndex
CREATE INDEX "products_isFeatured_idx" ON "products"("isFeatured");
