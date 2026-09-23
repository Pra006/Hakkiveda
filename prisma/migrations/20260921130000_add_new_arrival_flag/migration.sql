-- AlterTable
ALTER TABLE "products" ADD COLUMN "isNewArrival" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "products_isNewArrival_idx" ON "products"("isNewArrival");
