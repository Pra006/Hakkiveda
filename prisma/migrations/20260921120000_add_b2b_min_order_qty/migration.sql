-- AlterTable: add B2B minimum order quantity to products and variants
ALTER TABLE "products" ADD COLUMN "b2bMinOrderQty" INTEGER;
ALTER TABLE "product_variants" ADD COLUMN "b2bMinOrderQty" INTEGER;
