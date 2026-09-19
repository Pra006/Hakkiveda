-- Add admin rating override fields to products table
ALTER TABLE "products"
  ADD COLUMN "adminRating" DOUBLE PRECISION,
  ADD COLUMN "adminReviewCount" INTEGER,
  ADD COLUMN "isAdminRatingEnabled" BOOLEAN NOT NULL DEFAULT false;
