import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('Starting role migration...\n');

    // Step 1: Add 'superadmin' value to enum if it doesn't exist
    console.log('Step 1: Adding superadmin value to UserRole enum...');
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'superadmin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')) THEN
          ALTER TYPE "UserRole" ADD VALUE 'superadmin' BEFORE 'admin';
        END IF;
      END $$;
    `);
    console.log('✓ Superadmin value added to enum');

    // Step 2: Update existing users - admin → superadmin
    console.log('\nStep 2: Updating admin users to superadmin...');
    const adminToSuperadmin = await prisma.$executeRawUnsafe(`
      UPDATE users SET role = 'superadmin' WHERE role = 'admin';
    `);
    console.log(`✓ Updated ${adminToSuperadmin} users from 'admin' to 'superadmin'`);

    // Step 3: Update existing users - subadmin → admin
    console.log('\nStep 3: Updating subadmin users to admin...');
    const subadminToAdmin = await prisma.$executeRawUnsafe(`
      UPDATE users SET role = 'admin' WHERE role = 'subadmin';
    `);
    console.log(`✓ Updated ${subadminToAdmin} users from 'subadmin' to 'admin'`);

    // Step 4: Clean up enum - remove 'subadmin' value
    console.log('\nStep 4: Cleaning up enum type...');

    // Create new enum type without 'subadmin'
    await prisma.$executeRawUnsafe(`
      CREATE TYPE "UserRole_new" AS ENUM ('superadmin', 'admin', 'backoffice', 'connector');
    `);
    console.log('✓ Created new UserRole enum');

    // Update column to use new type
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users ALTER COLUMN role TYPE "UserRole_new" USING role::text::"UserRole_new";
    `);
    console.log('✓ Updated users table to use new enum');

    // Drop old type and rename
    await prisma.$executeRawUnsafe(`
      DROP TYPE "UserRole";
    `);
    console.log('✓ Dropped old UserRole enum');

    await prisma.$executeRawUnsafe(`
      ALTER TYPE "UserRole_new" RENAME TO "UserRole";
    `);
    console.log('✓ Renamed new enum to UserRole');

    console.log('\n✅ Role migration completed successfully!\n');
    console.log('Role mapping:');
    console.log('  ✓ admin → superadmin');
    console.log('  ✓ subadmin → admin');
    console.log('  ✓ backoffice → backoffice (unchanged)');
    console.log('  ✓ connector → connector (unchanged)\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
