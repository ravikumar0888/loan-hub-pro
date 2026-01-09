-- Role Renaming Migration
-- Admin → Superadmin
-- Subadmin → Admin

-- Step 1: Update the enum type to include new values
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'superadmin';

-- Step 2: Update existing users
-- Change all 'admin' to 'superadmin'
UPDATE users SET role = 'superadmin' WHERE role = 'admin';

-- Change all 'subadmin' to 'admin'
UPDATE users SET role = 'admin' WHERE role = 'subadmin';

-- Step 3: Remove old enum value (Note: PostgreSQL doesn't support removing enum values directly)
-- Instead, we'll recreate the enum

-- Create a temporary type
CREATE TYPE "UserRole_new" AS ENUM ('superadmin', 'admin', 'backoffice', 'connector');

-- Update the column to use the new type
ALTER TABLE users ALTER COLUMN role TYPE "UserRole_new" USING role::text::"UserRole_new";

-- Drop the old type
DROP TYPE "UserRole";

-- Rename the new type to the original name
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
