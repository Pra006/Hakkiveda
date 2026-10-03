-- CreateTable
CREATE TABLE "video_rituals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "category" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_rituals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "video_rituals_isActive_displayOrder_idx" ON "video_rituals"("isActive", "displayOrder");
