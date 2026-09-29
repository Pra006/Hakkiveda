-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('PRODUCT', 'DELIVERY', 'WEBSITE', 'CUSTOMER_SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'READ');

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedbacks_userId_idx" ON "feedbacks"("userId");

-- CreateIndex
CREATE INDEX "feedbacks_status_idx" ON "feedbacks"("status");

-- CreateIndex
CREATE INDEX "feedbacks_category_idx" ON "feedbacks"("category");

-- CreateIndex
CREATE INDEX "feedbacks_createdAt_idx" ON "feedbacks"("createdAt");

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
