# Database Migration Instructions

## Run this migration to add new customer fields

### Option 1: Using Prisma Migrate (Recommended)

Open a **new terminal** in the backend directory and run:

```bash
cd backend
npx prisma migrate dev --name add_customer_fields_and_nominee
```

When prompted, press Enter to accept and apply the migration.

### Option 2: Manual SQL Migration

If Prisma migration doesn't work, connect to your PostgreSQL database and run this SQL:

```sql
-- Add CaseType enum
CREATE TYPE "CaseType" AS ENUM ('fresh', 'bt', 'bt_topup');

-- Add new columns to customers table
ALTER TABLE "customers"
ADD COLUMN "pan_no" VARCHAR(10),
ADD COLUMN "date_of_birth" DATE,
ADD COLUMN "nominee_name" VARCHAR(255),
ADD COLUMN "nominee_relation" VARCHAR(100),
ADD COLUMN "nominee_date_of_birth" DATE,
ADD COLUMN "case_type" "CaseType",
ADD COLUMN "pdf_url" TEXT;

-- Update lead_owner column to be a foreign key
-- First, ensure existing lead_owner values are NULL or valid user IDs
UPDATE "customers" SET "lead_owner" = NULL WHERE "lead_owner" IS NOT NULL AND "lead_owner" NOT IN (SELECT id FROM users);

-- Add foreign key constraint
ALTER TABLE "customers"
ADD CONSTRAINT "customers_lead_owner_fkey"
FOREIGN KEY ("lead_owner") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index on lead_owner
CREATE INDEX "customers_lead_owner_idx" ON "customers"("lead_owner");
```

### After Migration

Once the migration is complete, run:

```bash
cd backend
npm run prisma:generate
```

Then restart your backend server.

## Verify Migration

To verify the migration was successful, run:

```bash
cd backend
npx prisma studio
```

This will open Prisma Studio where you can check if the new columns are present in the customers table.
