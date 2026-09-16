-- eSewa ePay V2 — extend customer_payments with provider-neutral fields.
-- Additive only; existing rows are backfilled with sensible defaults.

ALTER TABLE "customer_payments"
  ADD COLUMN "provider"        TEXT,
  ADD COLUMN "transactionUuid" TEXT,
  ADD COLUMN "providerRefId"   TEXT,
  ADD COLUMN "rawResponse"     JSONB,
  ADD COLUMN "initiatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "completedAt"     TIMESTAMP(3),
  ADD COLUMN "failedAt"        TIMESTAMP(3),
  ADD COLUMN "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "customer_payments_transactionUuid_key"
  ON "customer_payments"("transactionUuid");

CREATE INDEX "customer_payments_providerRefId_idx"
  ON "customer_payments"("providerRefId");
