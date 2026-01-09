import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('Creating SuperAdmin user...');

    // Hash the password
    const password = 'Admin@123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if superadmin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'superadmin' },
    });

    if (existingSuperAdmin) {
      console.log('SuperAdmin already exists!');
      console.log('Email:', existingSuperAdmin.email);
      console.log('\nUpdating password to: Admin@123');

      // Update the password
      await prisma.user.update({
        where: { id: existingSuperAdmin.id },
        data: { passwordHash },
      });

      console.log('✅ SuperAdmin password updated successfully!');
    } else {
      // Create new superadmin
      await prisma.user.create({
        data: {
          email: 'superadmin@loanms.com',
          passwordHash,
          firstName: 'Super',
          lastName: 'Admin',
          mobile: '9999999999',
          role: 'superadmin',
          isActive: true,
        },
      });

      console.log('✅ SuperAdmin created successfully!');
      console.log('\n📧 Email: superadmin@loanms.com');
      console.log('🔑 Password: Admin@123');
    }

    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');
  } catch (error) {
    console.error('❌ Error creating SuperAdmin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
