import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function verifyAdminUsers() {
  try {
    console.log('Checking admin users in database...\n');

    // Get all admin/superadmin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: { in: ['superadmin', 'admin'] }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in database');
      return;
    }

    console.log(`Found ${adminUsers.length} admin user(s):\n`);

    for (const user of adminUsers) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.firstName} ${user.lastName}`);
      console.log(`👑 Role: ${user.role}`);
      console.log(`✅ Active: ${user.isActive}`);

      // Test password
      const testPasswords = ['Admin@123', 'admin@123', 'password123'];
      let passwordMatched = false;

      for (const testPass of testPasswords) {
        const isMatch = await bcrypt.compare(testPass, user.passwordHash);
        if (isMatch) {
          console.log(`🔑 Password: ${testPass} ✅ MATCH`);
          passwordMatched = true;
          break;
        }
      }

      if (!passwordMatched) {
        console.log('🔑 Password: Unknown (none of the default passwords match)');
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    console.log('\n💡 Login Credentials Summary:');
    for (const user of adminUsers) {
      const testPasswords = ['Admin@123', 'admin@123', 'password123'];
      let matchedPassword = 'Unknown';

      for (const testPass of testPasswords) {
        const isMatch = await bcrypt.compare(testPass, user.passwordHash);
        if (isMatch) {
          matchedPassword = testPass;
          break;
        }
      }

      console.log(`\n${user.role.toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${matchedPassword}`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminUsers();
