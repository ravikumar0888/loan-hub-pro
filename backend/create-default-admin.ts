import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createDefaultAdmin() {
  try {
    console.log('Creating default admin@loanms.com account...\n');

    // Check if admin@loanms.com already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@loanms.com' },
    });

    if (existingAdmin) {
      console.log('Admin already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('\nUpdating password to: admin@123');

      // Hash the password
      const passwordHash = await bcrypt.hash('admin@123', 10);

      // Update the password
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { passwordHash },
      });

      console.log('✅ Admin password updated successfully!');
    } else {
      // Hash the password
      const passwordHash = await bcrypt.hash('admin@123', 10);

      // Create new admin
      await prisma.user.create({
        data: {
          email: 'admin@loanms.com',
          passwordHash,
          firstName: 'Admin',
          lastName: 'User',
          mobile: '8888888888',
          role: 'admin',
          isActive: true,
        },
      });

      console.log('✅ Admin created successfully!');
      console.log('\n📧 Email: admin@loanms.com');
      console.log('🔑 Password: admin@123');
      console.log('👤 Name: Admin User');
      console.log('👑 Role: admin');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('You can now login with:');
    console.log('Email:    admin@loanms.com');
    console.log('Password: admin@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultAdmin();
