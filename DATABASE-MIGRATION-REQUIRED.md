# ⚠️ CRITICAL: Database Migration Required

## Current Issue

The application is experiencing **401 Unauthorized** and **500 Internal Server Error** because the database schema is outdated. The Prisma schema has new fields that don't exist in the actual PostgreSQL database.

### Error Message:
```
The column `customers.pan_no` does not exist in the current database.
```

This error appears in `/api/customers` endpoint and cascades to login and other functionality.

## What's Missing

The database is missing these new columns in the `customers` table:
- `pan_no` (String)
- `date_of_birth` (DateTime)
- `personal_email` (String)
- `nominee_name` (String)
- `nominee_relation` (String)
- `nominee_date_of_birth` (DateTime)
- `case_type` (String)
- `pdf_url` (String)

## Solution Options

### Option 1: Run Prisma Migration (Recommended)

```bash
cd backend
npm run prisma:migrate
```

This will:
1. Create a new migration file based on schema changes
2. Apply the migration to your database
3. Update the Prisma client

### Option 2: Use the Pre-Made SQL Migration Script

If you have the `backend/run-migration.sql` file from previous instructions:

```bash
# Connect to PostgreSQL
psql -U postgres -d loanms

# Run the migration script
\i F:/Rudvir/loan-hub-pro/backend/run-migration.sql

# Verify columns were added
\d customers
```

### Option 3: Manual SQL (If Other Options Fail)

Run this SQL directly in your PostgreSQL database:

```sql
-- Add new columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS pan_no TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS personal_email TEXT,
ADD COLUMN IF NOT EXISTS nominee_name TEXT,
ADD COLUMN IF NOT EXISTS nominee_relation TEXT,
ADD COLUMN IF NOT EXISTS nominee_date_of_birth TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS case_type TEXT,
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;
```

## After Running Migration

1. **Regenerate Prisma Client:**
   ```bash
   cd backend
   npm run prisma:generate
   ```

2. **Restart Backend Server:**
   - Stop the current backend server (Ctrl+C)
   - Start it again:
     ```bash
     cd backend
     npm run dev
     ```

3. **Verify Login Works:**
   - Try logging in with any user credentials
   - Check that no 401/500 errors appear
   - Verify customers page loads correctly

## Verification Steps

### Check Database Schema
```bash
cd backend
npx prisma db pull
```

This will sync your Prisma schema with the actual database. If it shows no changes, your migration was successful.

### Check Backend Logs
```bash
# View error logs
cd backend
tail -f logs/error.log
```

If you see no more "column does not exist" errors, the migration worked.

### Test All Endpoints

After migration, test these in order:

1. **Login** (http://localhost:5000/api/auth/login)
   - Should return 200 with token

2. **Get Customers** (http://localhost:5000/api/customers)
   - Should return customer list (empty or with data)

3. **Dashboard** (http://localhost:5000/api/dashboard/kpis)
   - Should return KPI data

## Current Status of Features

### ✅ Completed Backend Updates:

1. **SubAdmin Permissions:**
   - Can view/edit customers where they are Lead Owner
   - Can view/edit users they created
   - Can access Users and Reports pages
   - Full CRUD on their own data

2. **BackOffice Permissions:**
   - Can view/edit customers where they are Lead Owner
   - Can view/edit users they created
   - Can access Dashboard, Customers, Users, and Reports pages
   - Same functionality as SubAdmin

3. **User Filtering:**
   - SubAdmins see only users they created (`createdBy = userId`)
   - BackOffice see only users they created (`createdBy = userId`)
   - Admin sees all users

### ✅ Completed Frontend Updates:

1. **Route Protection:**
   - `/users` accessible by: admin, subadmin, backoffice
   - `/reports` accessible by: admin, subadmin, backoffice

2. **Sidebar Menu:**
   - Users menu visible to: admin, subadmin, backoffice
   - Reports menu visible to: admin, subadmin, backoffice

3. **Edit Functionality:**
   - Reports page has edit button for: admin, subadmin, backoffice
   - Edit dialog works in both view and edit modes

### ⚠️ Waiting for Database Migration:

These features are implemented but won't work until migration is complete:
- Personal Email field in customer form
- PAN No field in customer form
- Date of Birth field in customer form
- Nominee fields (Name, Relation, DOB)
- PDF generation for customers
- Case Type field

## Why Migration is Critical

Without the database migration:
1. ❌ Login fails with 401 errors
2. ❌ Customers page fails with 500 errors
3. ❌ Dashboard fails to load
4. ❌ All API calls to `/api/customers` fail
5. ❌ Users cannot log in or use the application

After the migration:
1. ✅ Login works for all roles
2. ✅ Customers page loads correctly
3. ✅ Dashboard displays KPIs
4. ✅ SubAdmin and BackOffice can manage their data
5. ✅ All new fields (PAN, DOB, Nominee, etc.) work correctly

## Need Help?

If you encounter issues during migration:

1. **Check PostgreSQL is running:**
   ```bash
   pg_ctl status
   ```

2. **Check database connection:**
   ```bash
   cd backend
   npx prisma db pull
   ```

3. **Reset database (⚠️ Deletes all data):**
   ```bash
   cd backend
   npm run prisma:reset
   ```

4. **Check migration history:**
   ```bash
   cd backend
   npx prisma migrate status
   ```

## Summary

**You must run the database migration to fix the 401/500 errors.**

Recommended command:
```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
npm run dev
```

This will add the missing columns and restart the backend server.
