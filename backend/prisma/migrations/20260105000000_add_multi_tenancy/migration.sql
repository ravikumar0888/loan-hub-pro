-- Add new enum types for multi-tenancy
CREATE TYPE "OrganizationStatus" AS ENUM ('trial', 'active', 'suspended');
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE "PricingTier" AS ENUM ('starter', 'professional', 'enterprise');

-- Add master_admin to UserRole enum
ALTER TYPE "UserRole" ADD VALUE 'master_admin';

-- Create organizations table
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "logo" TEXT,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "address" TEXT NOT NULL,
    "website" VARCHAR(255),
    "pricing_tier" "PricingTier" NOT NULL,
    "seats" INTEGER NOT NULL,
    "used_seats" INTEGER NOT NULL DEFAULT 0,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'trial',
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- Create invoices table
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "organization_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "seats" INTEGER NOT NULL,
    "price_per_seat" DECIMAL(10,2) NOT NULL,
    "billing_period_start" DATE NOT NULL,
    "billing_period_end" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- Add organizationId to existing tables
ALTER TABLE "users" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "customers" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "banks" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "dsas" ADD COLUMN "organization_id" TEXT;

-- Create unique indexes
CREATE UNIQUE INDEX "organizations_email_key" ON "organizations"("email");
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- Create indexes
CREATE INDEX "organizations_status_idx" ON "organizations"("status");
CREATE INDEX "organizations_email_idx" ON "organizations"("email");
CREATE INDEX "invoices_organization_id_idx" ON "invoices"("organization_id");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");
CREATE INDEX "invoices_due_date_idx" ON "invoices"("due_date");
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");
CREATE INDEX "customers_organization_id_idx" ON "customers"("organization_id");
CREATE INDEX "banks_organization_id_idx" ON "banks"("organization_id");
CREATE INDEX "dsas_organization_id_idx" ON "dsas"("organization_id");

-- Add foreign key constraints
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "banks" ADD CONSTRAINT "banks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dsas" ADD CONSTRAINT "dsas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create default organization
INSERT INTO "organizations" ("id", "name", "email", "phone", "address", "pricing_tier", "seats", "used_seats", "status", "created_at", "updated_at")
VALUES (
    gen_random_uuid(),
    'Default Organization',
    'admin@loanms.com',
    '9999999999',
    'Default Address',
    'professional',
    100,
    (SELECT COUNT(*) FROM "users" WHERE "is_active" = true),
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Assign all existing data to default organization
UPDATE "users" SET "organization_id" = (SELECT "id" FROM "organizations" LIMIT 1) WHERE "organization_id" IS NULL;
UPDATE "customers" SET "organization_id" = (SELECT "id" FROM "organizations" LIMIT 1) WHERE "organization_id" IS NULL;
UPDATE "banks" SET "organization_id" = (SELECT "id" FROM "organizations" LIMIT 1) WHERE "organization_id" IS NULL;
UPDATE "dsas" SET "organization_id" = (SELECT "id" FROM "organizations" LIMIT 1) WHERE "organization_id" IS NULL;
