-- Migration: Add customer fields and nominee details
-- Run this SQL script in your PostgreSQL database

-- Step 1: Create CaseType enum
DO $$ BEGIN
    CREATE TYPE "CaseType" AS ENUM ('fresh', 'bt', 'bt_topup');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add new columns to customers table
ALTER TABLE "customers"
ADD COLUMN IF NOT EXISTS "pan_no" VARCHAR(10),
ADD COLUMN IF NOT EXISTS "date_of_birth" DATE,
ADD COLUMN IF NOT EXISTS "nominee_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "nominee_relation" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "nominee_date_of_birth" DATE,
ADD COLUMN IF NOT EXISTS "case_type" "CaseType",
ADD COLUMN IF NOT EXISTS "pdf_url" TEXT;

-- Step 3: Clean up invalid lead_owner values (set to NULL if they don't reference valid users)
UPDATE "customers"
SET "lead_owner" = NULL
WHERE "lead_owner" IS NOT NULL
  AND "lead_owner" NOT IN (SELECT id FROM users);

-- Step 4: Add foreign key constraint for lead_owner (if it doesn't exist)
DO $$ BEGIN
    ALTER TABLE "customers"
    ADD CONSTRAINT "customers_lead_owner_fkey"
    FOREIGN KEY ("lead_owner") REFERENCES "users"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 5: Add index on lead_owner (if it doesn't exist)
CREATE INDEX IF NOT EXISTS "customers_lead_owner_idx" ON "customers"("lead_owner");

-- Verification query - Run this to check the new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name IN ('pan_no', 'date_of_birth', 'nominee_name', 'nominee_relation', 'nominee_date_of_birth', 'case_type', 'pdf_url')
ORDER BY column_name;
