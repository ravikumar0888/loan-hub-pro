# Fix for Nominee Fields Not Storing/Updating

## The Issue

You're experiencing that **Nominee Name, Relation, and Nominee DOB** are not being stored or displayed when you:
- Create a new customer
- Edit an existing customer
- View customer details

This also affects **PAN No** and **Date of Birth** fields.

## Root Cause

The database migration has **NOT been applied yet**. The database columns for these fields don't exist.

## Quick Diagnosis

### Step 1: Check if Migration Was Applied

Open pgAdmin and run this query on your `loanms` database:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name IN (
    'pan_no',
    'date_of_birth',
    'nominee_name',
    'nominee_relation',
    'nominee_date_of_birth',
    'case_type',
    'pdf_url'
  )
ORDER BY column_name;
```

**Expected Result:** 7 rows showing these columns
**If you see 0 rows:** Migration has NOT been run

### Step 2: Apply the Migration

You can use the quick check script: `backend/check-migration.sql`

## Solution: Run the Migration

### Method 1: Using pgAdmin (Recommended)

1. **Open pgAdmin** and connect to PostgreSQL
2. **Right-click** on your `loanms` database → **Query Tool**
3. **Open** the file: `backend/run-migration.sql`
4. **Copy all the SQL** from that file
5. **Paste** into the Query Tool
6. **Click Execute** (or press F5)
7. **Verify** you see "Query returned successfully"

### Method 2: Using psql Command Line

```bash
cd backend
psql -U postgres -d loanms -f run-migration.sql
```

Replace `postgres` with your PostgreSQL username if different.

### Method 3: Manual SQL (Copy-Paste)

If the above methods don't work, copy and paste this SQL into your PostgreSQL client:

```sql
-- Create CaseType enum
DO $$ BEGIN
    CREATE TYPE "CaseType" AS ENUM ('fresh', 'bt', 'bt_topup');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to customers table
ALTER TABLE "customers"
ADD COLUMN IF NOT EXISTS "pan_no" VARCHAR(10),
ADD COLUMN IF NOT EXISTS "date_of_birth" DATE,
ADD COLUMN IF NOT EXISTS "nominee_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "nominee_relation" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "nominee_date_of_birth" DATE,
ADD COLUMN IF NOT EXISTS "case_type" "CaseType",
ADD COLUMN IF NOT EXISTS "pdf_url" TEXT;

-- Clean up invalid lead_owner values
UPDATE "customers"
SET "lead_owner" = NULL
WHERE "lead_owner" IS NOT NULL
  AND "lead_owner" NOT IN (SELECT id FROM users);

-- Add foreign key constraint for lead_owner
DO $$ BEGIN
    ALTER TABLE "customers"
    ADD CONSTRAINT "customers_lead_owner_fkey"
    FOREIGN KEY ("lead_owner") REFERENCES "users"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add index on lead_owner
CREATE INDEX IF NOT EXISTS "customers_lead_owner_idx" ON "customers"("lead_owner");
```

## After Running Migration

### Step 1: Generate Prisma Client

```bash
cd backend
npm run prisma:generate
```

This regenerates the Prisma client with the new fields.

### Step 2: Restart Backend Server

Stop the backend (Ctrl+C) and restart:

```bash
npm run dev
```

### Step 3: Test the Application

1. **Open** the customer form (Add or Edit)
2. **Fill in** Nominee Name, Relation, and Nominee DOB
3. **Fill in** PAN No and Date of Birth
4. **Submit** the form
5. **View** the customer details
6. **Verify** all fields are displayed correctly

## Verification Query

After migration, run this to verify the columns exist:

```sql
SELECT
    column_name,
    data_type,
    is_nullable,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name IN (
    'pan_no',
    'date_of_birth',
    'nominee_name',
    'nominee_relation',
    'nominee_date_of_birth',
    'case_type',
    'pdf_url'
  )
ORDER BY column_name;
```

Expected output:
```
column_name              | data_type                  | is_nullable | character_maximum_length
------------------------|----------------------------|-------------|-------------------------
case_type               | USER-DEFINED               | YES         | NULL
date_of_birth           | date                       | YES         | NULL
nominee_date_of_birth   | date                       | YES         | NULL
nominee_name            | character varying          | YES         | 255
nominee_relation        | character varying          | YES         | 100
pan_no                  | character varying          | YES         | 10
pdf_url                 | text                       | YES         | NULL
```

## Troubleshooting

### Issue: "Type CaseType already exists"
This is fine! The script handles this automatically. Continue with the rest.

### Issue: "Column already exists"
This means the migration already ran partially. Skip to Step 1 (Generate Prisma Client).

### Issue: Still not storing after migration
1. Make sure you ran `npm run prisma:generate`
2. Make sure you restarted the backend server
3. Check browser console for errors
4. Check backend terminal for errors

### Issue: "Cannot read properties of undefined"
This usually means the backend is returning old data format. Clear your browser cache or do a hard refresh (Ctrl+Shift+R).

## Code Implementation Details

The implementation is complete and correct:

### Frontend Mapping
- Form fields: `nomineeName`, `nomineeRelation`, `nomineeDateOfBirth`
- Customer data: `customer.nomineeName`, `customer.nomineeRelation`, `customer.nomineeDateOfBirth`

### Backend Mapping
- Prisma schema: `nomineeName`, `nomineeRelation`, `nomineeDateOfBirth`
- Database columns: `nominee_name`, `nominee_relation`, `nominee_date_of_birth`

### API Payload
When creating/updating a customer, the data sent is:
```json
{
  "nomineeName": "John Doe",
  "nomineeRelation": "Spouse",
  "nomineeDateOfBirth": "1990-01-15T00:00:00.000Z"
}
```

## Summary

The issue is **NOT with the code** - the code is working correctly. The issue is that the **database schema is outdated**.

Once you run the migration SQL script, all the nominee fields (and PAN No, DOB, Case Type) will work perfectly in:
- ✓ Add new customer
- ✓ Edit existing customer
- ✓ View customer details
- ✓ PDF generation

## Need More Help?

See the complete migration guide: [backend/QUICK-FIX-GUIDE.md](backend/QUICK-FIX-GUIDE.md)
