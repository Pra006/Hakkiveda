-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterEnum (B2BApplicationStatus)
ALTER TYPE "B2BApplicationStatus" ADD VALUE 'MORE_INFORMATION_REQUIRED';
ALTER TYPE "B2BApplicationStatus" ADD VALUE 'SUSPENDED';

-- AlterEnum (B2BBusinessType)
ALTER TYPE "B2BBusinessType" ADD VALUE 'INDIVIDUAL';
ALTER TYPE "B2BBusinessType" ADD VALUE 'SOLE_PROPRIETORSHIP';
ALTER TYPE "B2BBusinessType" ADD VALUE 'PARTNERSHIP';
ALTER TYPE "B2BBusinessType" ADD VALUE 'PRIVATE_COMPANY';

-- AlterTable (b2b_applications — identity verification)
ALTER TABLE "b2b_applications" ADD COLUMN "citizenshipNumber" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "citizenshipFrontUrl" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "citizenshipBackUrl" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "identityStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "b2b_applications" ADD COLUMN "businessInfoStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable (b2b_applications — business address)
ALTER TABLE "b2b_applications" ADD COLUMN "storeName" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "businessRegNo" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "panVatNo" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "businessPhone" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "province" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "district" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "city" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "streetAddress" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "postalCode" TEXT;

-- AlterTable (b2b_applications — store info)
ALTER TABLE "b2b_applications" ADD COLUMN "storeDescription" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "productCategories" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable (b2b_applications — agreement)
ALTER TABLE "b2b_applications" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "b2b_applications" ADD COLUMN "privacyAcceptedAt" TIMESTAMP(3);

-- AlterTable (b2b_applications — admin actions)
ALTER TABLE "b2b_applications" ADD COLUMN "moreInfoMessage" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "moreInfoRequestedAt" TIMESTAMP(3);
ALTER TABLE "b2b_applications" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "b2b_applications" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "rejectedAt" TIMESTAMP(3);
ALTER TABLE "b2b_applications" ADD COLUMN "rejectedById" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "suspendedReason" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "suspendedAt" TIMESTAMP(3);
ALTER TABLE "b2b_applications" ADD COLUMN "suspendedById" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "reinstatedAt" TIMESTAMP(3);
ALTER TABLE "b2b_applications" ADD COLUMN "reinstatedById" TEXT;

-- AlterTable (b2b_applications — verification tracking)
ALTER TABLE "b2b_applications" ADD COLUMN "identityVerifiedAt" TIMESTAMP(3);
ALTER TABLE "b2b_applications" ADD COLUMN "identityVerifiedById" TEXT;
ALTER TABLE "b2b_applications" ADD COLUMN "businessVerifiedAt" TIMESTAMP(3);
ALTER TABLE "b2b_applications" ADD COLUMN "businessVerifiedById" TEXT;
