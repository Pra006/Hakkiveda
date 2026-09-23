-- CreateEnum
CREATE TYPE "CustomerOrderFulfillmentStatus" AS ENUM ('UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "CustomerOrderEventActor" AS ENUM ('SYSTEM', 'ADMIN', 'CUSTOMER');

-- AlterTable
ALTER TABLE "customer_order_items" ADD COLUMN     "productImage" TEXT,
ADD COLUMN     "productName" TEXT,
ADD COLUMN     "productSku" TEXT;

-- AlterTable
ALTER TABLE "customer_orders" ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "courier" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'NPR',
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "estimatedDeliveryDate" TIMESTAMP(3),
ADD COLUMN     "fulfillmentStatus" "CustomerOrderFulfillmentStatus" NOT NULL DEFAULT 'UNFULFILLED',
ADD COLUMN     "paymentStatus" "CustomerPaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingCountry" TEXT,
ADD COLUMN     "shippingFullName" TEXT,
ADD COLUMN     "shippingMethod" TEXT,
ADD COLUMN     "shippingPhone" TEXT,
ADD COLUMN     "shippingPostalCode" TEXT,
ADD COLUMN     "shippingState" TEXT,
ADD COLUMN     "shippingStreet" TEXT,
ADD COLUMN     "trackingNumber" TEXT;

-- AlterTable
ALTER TABLE "customer_payments" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'NPR',
ADD COLUMN     "transactionId" TEXT;

-- CreateTable
CREATE TABLE "customer_order_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "CustomerOrderStatus",
    "message" TEXT NOT NULL,
    "actor" "CustomerOrderEventActor" NOT NULL DEFAULT 'SYSTEM',
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_order_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_order_events_orderId_idx" ON "customer_order_events"("orderId");

-- CreateIndex
CREATE INDEX "customer_order_events_createdAt_idx" ON "customer_order_events"("createdAt");

-- CreateIndex
CREATE INDEX "customer_orders_paymentStatus_idx" ON "customer_orders"("paymentStatus");

-- CreateIndex
CREATE INDEX "customer_orders_fulfillmentStatus_idx" ON "customer_orders"("fulfillmentStatus");

-- AddForeignKey
ALTER TABLE "customer_order_events" ADD CONSTRAINT "customer_order_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "customer_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
