-- CreateEnum
CREATE TYPE "CustomerOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CustomerPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CustomerPaymentMethod" AS ENUM ('ESEWA', 'KHALTI', 'BANK_TRANSFER', 'COD', 'CARD');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('HOME', 'OFFICE', 'OTHER');

-- CreateEnum
CREATE TYPE "B2BApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'CONTACT_REQUIRED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "B2BBusinessType" AS ENUM ('DISTRIBUTOR', 'WHOLESALER', 'RETAILER', 'IMPORTER', 'ONLINE_SELLER', 'PRIVATE_LABEL_BUYER', 'CORPORATE_BUYER', 'INSTITUTIONAL_BUYER', 'SALON_SPA', 'OTHER');

-- CreateEnum
CREATE TYPE "B2BOrderVolume" AS ENUM ('LESS_THAN_100', 'FROM_100_TO_500', 'FROM_500_TO_1000', 'FROM_1000_TO_5000', 'MORE_THAN_5000', 'CUSTOM_PROJECT');

-- CreateEnum
CREATE TYPE "B2BCommunicationChannel" AS ENUM ('WHATSAPP', 'PHONE', 'EMAIL', 'WHATSAPP_EMAIL');

-- CreateEnum
CREATE TYPE "B2BOrgMemberRole" AS ENUM ('ORGANIZATION_OWNER', 'PURCHASER', 'APPROVER', 'ACCOUNTANT', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "B2BOrgMemberStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "B2BAddressType" AS ENUM ('BILLING', 'SHIPPING', 'WAREHOUSE', 'OFFICE');

-- CreateEnum
CREATE TYPE "B2BRFQStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'QUOTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "B2BQuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "B2BPOStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "B2BOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "B2BPaymentTermType" AS ENUM ('PREPAID', 'BANK_TRANSFER', 'COD', 'CREDIT', 'NET_7', 'NET_15', 'NET_30', 'NET_60');

-- CreateEnum
CREATE TYPE "B2BInvoicePaymentStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "B2BOrgStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'ORDER_MANAGER', 'PRODUCT_MANAGER', 'B2B_MANAGER', 'FINANCE_MANAGER', 'SUPPORT_MANAGER');

-- CreateEnum
CREATE TYPE "AdminAuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUSPEND', 'ACTIVATE', 'LOGIN', 'LOGOUT', 'EXPORT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "categoryId" TEXT,
    "brand" TEXT,
    "retailPrice" DOUBLE PRECISION NOT NULL,
    "compareAt" DOUBLE PRECISION,
    "images" TEXT[],
    "stock" INTEGER NOT NULL DEFAULT 0,
    "moq" INTEGER NOT NULL DEFAULT 1,
    "isB2B" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerNumber" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Home',
    "type" "AddressType" NOT NULL DEFAULT 'HOME',
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT,
    "city" TEXT NOT NULL,
    "streetAddress" TEXT,
    "landmark" TEXT,
    "postalCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_carts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "billingAddressId" TEXT,
    "shippingAddressId" TEXT,
    "status" "CustomerOrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "customer_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_payments" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "CustomerPaymentMethod" NOT NULL,
    "status" "CustomerPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_wishlists" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_wishlist_items" (
    "id" TEXT NOT NULL,
    "wishlistId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_applications" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "B2BApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "contactPersonName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "businessType" "B2BBusinessType" NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "businessEmail" TEXT NOT NULL,
    "productsOfInterest" TEXT[],
    "customProductNote" TEXT,
    "estimatedOrderVolume" "B2BOrderVolume",
    "estimatedPurchaseValue" TEXT,
    "targetMarket" TEXT,
    "targetCountry" TEXT,
    "targetProvince" TEXT,
    "targetCity" TEXT,
    "customMessage" TEXT,
    "preferredCommunication" "B2BCommunicationChannel" NOT NULL DEFAULT 'EMAIL',
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "internalNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_organizations" (
    "id" TEXT NOT NULL,
    "organizationNumber" TEXT NOT NULL,
    "b2bApplicationId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "businessType" "B2BBusinessType" NOT NULL,
    "country" TEXT NOT NULL,
    "businessEmail" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "website" TEXT,
    "taxNumber" TEXT,
    "status" "B2BOrgStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultPaymentTerm" "B2BPaymentTermType" NOT NULL DEFAULT 'PREPAID',
    "creditLimit" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "B2BOrgMemberRole" NOT NULL DEFAULT 'EMPLOYEE',
    "status" "B2BOrgMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_addresses" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "B2BAddressType" NOT NULL DEFAULT 'OFFICE',
    "label" TEXT NOT NULL DEFAULT 'Default',
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "province" TEXT,
    "city" TEXT,
    "streetAddress" TEXT NOT NULL,
    "postalCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_price_tiers" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "maxQty" INTEGER,
    "unitPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "b2b_price_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_prices" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "minQty" INTEGER,
    "maxQty" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_carts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_rfqs" (
    "id" TEXT NOT NULL,
    "rfqNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" "B2BRFQStatus" NOT NULL DEFAULT 'DRAFT',
    "message" TEXT,
    "requestedDeliveryDate" TIMESTAMP(3),
    "shippingCountry" TEXT,
    "shippingCity" TEXT,
    "shippingAddress" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_rfqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_rfq_items" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "targetPrice" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "b2b_rfq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_quotations" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "rfqId" TEXT,
    "status" "B2BQuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentTerms" "B2BPaymentTermType",
    "deliveryTerms" TEXT,
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_quotation_items" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "b2b_quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_purchase_orders" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "quotationId" TEXT,
    "status" "B2BPOStatus" NOT NULL DEFAULT 'DRAFT',
    "billingAddress" TEXT,
    "shippingAddress" TEXT,
    "paymentTerms" "B2BPaymentTermType",
    "deliveryNotes" TEXT,
    "notes" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "b2b_purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "placedByMemberId" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "billingAddressId" TEXT,
    "shippingAddressId" TEXT,
    "status" "B2BOrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentTerms" "B2BPaymentTermType",
    "notes" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "b2b_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderId" TEXT,
    "paymentStatus" "B2BInvoicePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "billingAddress" TEXT,
    "shippingAddress" TEXT,
    "paymentTerms" "B2BPaymentTermType",
    "dueDate" TIMESTAMP(3),
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "b2b_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "B2BPaymentTermType" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2b_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "AdminAuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_slug_idx" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_isB2B_idx" ON "products"("isB2B");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_userId_key" ON "customers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customerNumber_key" ON "customers"("customerNumber");

-- CreateIndex
CREATE INDEX "customers_customerNumber_idx" ON "customers"("customerNumber");

-- CreateIndex
CREATE INDEX "customer_addresses_customerId_idx" ON "customer_addresses"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_carts_customerId_key" ON "customer_carts"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_cart_items_cartId_productId_key" ON "customer_cart_items"("cartId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_orders_orderNumber_key" ON "customer_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "customer_orders_customerId_idx" ON "customer_orders"("customerId");

-- CreateIndex
CREATE INDEX "customer_orders_orderNumber_idx" ON "customer_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "customer_orders_status_idx" ON "customer_orders"("status");

-- CreateIndex
CREATE INDEX "customer_orders_createdAt_idx" ON "customer_orders"("createdAt");

-- CreateIndex
CREATE INDEX "customer_order_items_orderId_idx" ON "customer_order_items"("orderId");

-- CreateIndex
CREATE INDEX "customer_payments_customerId_idx" ON "customer_payments"("customerId");

-- CreateIndex
CREATE INDEX "customer_payments_orderId_idx" ON "customer_payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_wishlists_customerId_key" ON "customer_wishlists"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_wishlist_items_wishlistId_productId_key" ON "customer_wishlist_items"("wishlistId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_applications_applicationNumber_key" ON "b2b_applications"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_applications_userId_key" ON "b2b_applications"("userId");

-- CreateIndex
CREATE INDEX "b2b_applications_status_idx" ON "b2b_applications"("status");

-- CreateIndex
CREATE INDEX "b2b_applications_applicationNumber_idx" ON "b2b_applications"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_organizations_organizationNumber_key" ON "b2b_organizations"("organizationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_organizations_b2bApplicationId_key" ON "b2b_organizations"("b2bApplicationId");

-- CreateIndex
CREATE INDEX "b2b_organizations_companyName_idx" ON "b2b_organizations"("companyName");

-- CreateIndex
CREATE INDEX "b2b_organizations_organizationNumber_idx" ON "b2b_organizations"("organizationNumber");

-- CreateIndex
CREATE INDEX "b2b_organizations_status_idx" ON "b2b_organizations"("status");

-- CreateIndex
CREATE INDEX "b2b_organization_members_userId_idx" ON "b2b_organization_members"("userId");

-- CreateIndex
CREATE INDEX "b2b_organization_members_organizationId_idx" ON "b2b_organization_members"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_organization_members_organizationId_userId_key" ON "b2b_organization_members"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "b2b_addresses_organizationId_idx" ON "b2b_addresses"("organizationId");

-- CreateIndex
CREATE INDEX "b2b_price_tiers_productId_idx" ON "b2b_price_tiers"("productId");

-- CreateIndex
CREATE INDEX "b2b_prices_organizationId_idx" ON "b2b_prices"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_prices_productId_organizationId_key" ON "b2b_prices"("productId", "organizationId");

-- CreateIndex
CREATE INDEX "b2b_carts_organizationId_idx" ON "b2b_carts"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_cart_items_cartId_productId_key" ON "b2b_cart_items"("cartId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_rfqs_rfqNumber_key" ON "b2b_rfqs"("rfqNumber");

-- CreateIndex
CREATE INDEX "b2b_rfqs_organizationId_idx" ON "b2b_rfqs"("organizationId");

-- CreateIndex
CREATE INDEX "b2b_rfqs_requestedById_idx" ON "b2b_rfqs"("requestedById");

-- CreateIndex
CREATE INDEX "b2b_rfqs_status_idx" ON "b2b_rfqs"("status");

-- CreateIndex
CREATE INDEX "b2b_rfqs_rfqNumber_idx" ON "b2b_rfqs"("rfqNumber");

-- CreateIndex
CREATE INDEX "b2b_rfq_items_rfqId_idx" ON "b2b_rfq_items"("rfqId");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_quotations_quoteNumber_key" ON "b2b_quotations"("quoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_quotations_rfqId_key" ON "b2b_quotations"("rfqId");

-- CreateIndex
CREATE INDEX "b2b_quotations_organizationId_idx" ON "b2b_quotations"("organizationId");

-- CreateIndex
CREATE INDEX "b2b_quotations_status_idx" ON "b2b_quotations"("status");

-- CreateIndex
CREATE INDEX "b2b_quotations_quoteNumber_idx" ON "b2b_quotations"("quoteNumber");

-- CreateIndex
CREATE INDEX "b2b_quotation_items_quotationId_idx" ON "b2b_quotation_items"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_purchase_orders_poNumber_key" ON "b2b_purchase_orders"("poNumber");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_purchase_orders_quotationId_key" ON "b2b_purchase_orders"("quotationId");

-- CreateIndex
CREATE INDEX "b2b_purchase_orders_organizationId_idx" ON "b2b_purchase_orders"("organizationId");

-- CreateIndex
CREATE INDEX "b2b_purchase_orders_status_idx" ON "b2b_purchase_orders"("status");

-- CreateIndex
CREATE INDEX "b2b_purchase_orders_poNumber_idx" ON "b2b_purchase_orders"("poNumber");

-- CreateIndex
CREATE INDEX "b2b_purchase_order_items_purchaseOrderId_idx" ON "b2b_purchase_order_items"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_orders_orderNumber_key" ON "b2b_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_orders_purchaseOrderId_key" ON "b2b_orders"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "b2b_orders_organizationId_idx" ON "b2b_orders"("organizationId");

-- CreateIndex
CREATE INDEX "b2b_orders_placedByMemberId_idx" ON "b2b_orders"("placedByMemberId");

-- CreateIndex
CREATE INDEX "b2b_orders_status_idx" ON "b2b_orders"("status");

-- CreateIndex
CREATE INDEX "b2b_orders_orderNumber_idx" ON "b2b_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "b2b_orders_createdAt_idx" ON "b2b_orders"("createdAt");

-- CreateIndex
CREATE INDEX "b2b_order_items_orderId_idx" ON "b2b_order_items"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_invoices_invoiceNumber_key" ON "b2b_invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_invoices_orderId_key" ON "b2b_invoices"("orderId");

-- CreateIndex
CREATE INDEX "b2b_invoices_organizationId_idx" ON "b2b_invoices"("organizationId");

-- CreateIndex
CREATE INDEX "b2b_invoices_paymentStatus_idx" ON "b2b_invoices"("paymentStatus");

-- CreateIndex
CREATE INDEX "b2b_invoices_invoiceNumber_idx" ON "b2b_invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "b2b_invoice_items_invoiceId_idx" ON "b2b_invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "b2b_payments_invoiceId_idx" ON "b2b_payments"("invoiceId");

-- CreateIndex
CREATE INDEX "b2b_payments_organizationId_idx" ON "b2b_payments"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_userId_key" ON "admin_users"("userId");

-- CreateIndex
CREATE INDEX "admin_users_role_idx" ON "admin_users"("role");

-- CreateIndex
CREATE INDEX "admin_audit_logs_adminId_idx" ON "admin_audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "admin_audit_logs_entityType_idx" ON "admin_audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs"("action");

-- CreateIndex
CREATE INDEX "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "admin_settings_key_key" ON "admin_settings"("key");

-- CreateIndex
CREATE INDEX "admin_settings_category_idx" ON "admin_settings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_carts" ADD CONSTRAINT "customer_carts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_cart_items" ADD CONSTRAINT "customer_cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "customer_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_cart_items" ADD CONSTRAINT "customer_cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "customer_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "customer_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "customer_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "customer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_wishlists" ADD CONSTRAINT "customer_wishlists_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_wishlist_items" ADD CONSTRAINT "customer_wishlist_items_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "customer_wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_wishlist_items" ADD CONSTRAINT "customer_wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_applications" ADD CONSTRAINT "b2b_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_organizations" ADD CONSTRAINT "b2b_organizations_b2bApplicationId_fkey" FOREIGN KEY ("b2bApplicationId") REFERENCES "b2b_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_organization_members" ADD CONSTRAINT "b2b_organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "b2b_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_organization_members" ADD CONSTRAINT "b2b_organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_addresses" ADD CONSTRAINT "b2b_addresses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "b2b_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_price_tiers" ADD CONSTRAINT "b2b_price_tiers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_prices" ADD CONSTRAINT "b2b_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_prices" ADD CONSTRAINT "b2b_prices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "b2b_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_carts" ADD CONSTRAINT "b2b_carts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "b2b_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_cart_items" ADD CONSTRAINT "b2b_cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "b2b_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_cart_items" ADD CONSTRAINT "b2b_cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_rfqs" ADD CONSTRAINT "b2b_rfqs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "b2b_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_rfqs" ADD CONSTRAINT "b2b_rfqs_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "b2b_organization_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_rfq_items" ADD CONSTRAINT "b2b_rfq_items_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "b2b_rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_rfq_items" ADD CONSTRAINT "b2b_rfq_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_quotations" ADD CONSTRAINT "b2b_quotations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "b2b_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_quotations" ADD CONSTRAINT "b2b_quotations_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "b2b_rfqs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_quotation_items" ADD CONSTRAINT "b2b_quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "b2b_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_quotation_items" ADD CONSTRAINT "b2b_quotation_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_purchase_orders" ADD CONSTRAINT "b2b_purchase_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "b2b_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_purchase_orders" ADD CONSTRAINT "b2b_purchase_orders_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "b2b_quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_purchase_order_items" ADD CONSTRAINT "b2b_purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "b2b_purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_purchase_order_items" ADD CONSTRAINT "b2b_purchase_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_orders" ADD CONSTRAINT "b2b_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "b2b_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_orders" ADD CONSTRAINT "b2b_orders_placedByMemberId_fkey" FOREIGN KEY ("placedByMemberId") REFERENCES "b2b_organization_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_orders" ADD CONSTRAINT "b2b_orders_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "b2b_purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_orders" ADD CONSTRAINT "b2b_orders_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "b2b_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_orders" ADD CONSTRAINT "b2b_orders_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "b2b_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_order_items" ADD CONSTRAINT "b2b_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "b2b_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_order_items" ADD CONSTRAINT "b2b_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_invoices" ADD CONSTRAINT "b2b_invoices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "b2b_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_invoices" ADD CONSTRAINT "b2b_invoices_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "b2b_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_invoice_items" ADD CONSTRAINT "b2b_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "b2b_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_invoice_items" ADD CONSTRAINT "b2b_invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_payments" ADD CONSTRAINT "b2b_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "b2b_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_payments" ADD CONSTRAINT "b2b_payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "b2b_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
