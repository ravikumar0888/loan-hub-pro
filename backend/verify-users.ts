import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function verifyUsers() {
  try {
    console.log('='.repeat(60));
    console.log('VERIFYING DATABASE USERS');
    console.log('='.repeat(60));

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        passwordHash: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`\nTotal users in database: ${users.length}\n`);

    for (const user of users) {
      console.log('-'.repeat(60));
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Active: ${user.isActive}`);
      console.log(`Password hash exists: ${user.passwordHash ? 'Yes' : 'No'}`);
      console.log(`Password hash length: ${user.passwordHash?.length || 0}`);

      // Test password verification for admin user
      if (user.email === 'admin@loanms.com') {
        const testPassword = 'admin@123';
        const isValid = await bcrypt.compare(testPassword, user.passwordHash);
        console.log(`\n** Testing password 'admin@123': ${isValid ? '✅ VALID' : '❌ INVALID'} **`);

        if (!isValid) {
          console.log('⚠️  Password mismatch! Re-hashing and updating...');
          const newHash = await bcrypt.hash(testPassword, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
          });
          console.log('✅ Password updated successfully!');
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION COMPLETE');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUsers();
