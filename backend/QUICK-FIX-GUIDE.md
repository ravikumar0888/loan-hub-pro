# Quick Fix Guide - Database Migration

## The Problem

If you're experiencing any of these issues:
- ✗ PAN No is not storing/displaying
- ✗ Date of Birth (DOB) is not storing/displaying
- ✗ Nominee Name, Relation, DOB are not storing/displaying
- ✗ Case Type is not storing/displaying
- ✗ Lead Owner dropdown is empty or not working
- ✗ Error: `The column customers.pan_no does not exist in the current database`

**ROOT CAUSE:** The database migration has NOT been run yet. The database schema is missing the new columns.

## Verify Migration Status

Run this in pgAdmin Query Tool or psql:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name IN ('pan_no', 'date_of_birth', 'nominee_name', 'nominee_relation', 'nominee_date_of_birth', 'case_type', 'pdf_url');
```

- If you see **0 rows** → Migration NOT run
- If you see **7 rows** → Migration already applied

Or use the quick check script: [check-migration.sql](check-migration.sql)

---

## ⚡ FASTEST FIX - Choose ONE option below:

### Option 1: Using pgAdmin (Recommended - Easiest)

1. **Open pgAdmin** and connect to your PostgreSQL server
2. **Navigate to** your `loanms` database
3. **Right-click** on `loanms` → **Query Tool**
4. **Open the file** `backend/run-migration.sql` in a text editor
5. **Copy all the SQL** from that file
6. **Paste it** into the Query Tool
7. **Click Execute** (or press F5)
8. **Check the output** - you should see "Query returned successfully"

After this, run:
```bash
cd backend
npm run prisma:generate
```

Then restart your backend server.

---

### Option 2: Using Command Line (psql)

If you have `psql` installed and in your PATH:

```bash
cd backend
psql -U postgres -d loanms -f run-migration.sql
```

Replace `postgres` with your PostgreSQL username if different.

After this, run:
```bash
npm run prisma:generate
```

Then restart your backend server.

---

### Option 3: Using Windows Batch Script

If you have `psql` in your PATH:

```bash
cd backend
run-migration.bat
```

This will automatically run the migration using your DATABASE_URL from .env

---

### Option 4: Manual Copy-Paste

If none of the above work:

1. **Open** your PostgreSQL client (pgAdmin, DBeaver, etc.)
2. **Connect** to the `loanms` database
3. **Copy and paste this SQL** and run it:

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

---

## After Migration - IMPORTANT!

1. **Generate Prisma Client:**
   ```bash
   cd backend
   npm run prisma:generate
   ```

2. **Restart your backend server:**
   - Stop the current server (Ctrl+C)
   - Start it again: `npm run dev`

3. **Test the API:**
   Visit: http://localhost:5000/api/customers

   You should now see a proper response instead of the error!

---

## Verify Migration Success

Run this query in your PostgreSQL client to verify:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name IN ('pan_no', 'date_of_birth', 'nominee_name', 'nominee_relation', 'nominee_date_of_birth', 'case_type', 'pdf_url')
ORDER BY column_name;
```

You should see 7 rows returned with the new columns.

---

## Troubleshooting

### Error: "relation 'customers' does not exist"
- Make sure you're connected to the correct database (`loanms`)
- Check that your backend has run migrations before

### Error: "type 'CaseType' already exists"
- This is fine! The script handles this with `IF NOT EXISTS`
- Just continue with the rest of the script

### Error: "column 'pan_no' already exists"
- This is also fine! It means the migration already ran
- Skip to the "After Migration" steps

### Still getting the error after migration?
1. Make sure you ran `npm run prisma:generate`
2. Make sure you restarted the backend server
3. Clear your terminal and try again
4. Check PostgreSQL logs for any errors

---

## Need Help?

If you're still stuck:
1. Check that PostgreSQL is running
2. Verify your DATABASE_URL in `.env` is correct
3. Make sure you have permissions to alter tables
4. Try connecting to the database manually first to test credentials
