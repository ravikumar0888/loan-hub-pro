import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    // Hash the new password
    const passwordHash = await bcrypt.hash('admin@123', 10);

    // Update admin user password
    const admin = await prisma.user.update({
      where: { email: 'admin@loanms.com' },
      data: {
        passwordHash,
      },
    });

    console.log('✅ Admin password updated successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@loanms.com');
    console.log('🔑 Password: admin@123');
    console.log('👤 Name:     ' + admin.firstName + ' ' + admin.lastName);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error('❌ Admin user not found. Please create admin first using: npm run create:admin');
    } else {
      console.error('❌ Error updating admin password:', error);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
