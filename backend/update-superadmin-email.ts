import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSuperAdminEmail() {
  try {
    console.log('Updating SuperAdmin email address...');

    // Find the existing superadmin user
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'superadmin' },
    });

    if (!existingSuperAdmin) {
      console.error('❌ No SuperAdmin user found in database');
      console.log('💡 Run: npm run create:superadmin to create one first');
      return;
    }

    console.log(`\nFound SuperAdmin: ${existingSuperAdmin.email}`);
    console.log('Updating email to: superadmin@loanms.com');

    // Check if the new email is already taken by another user
    const emailConflict = await prisma.user.findUnique({
      where: { email: 'superadmin@loanms.com' },
    });

    if (emailConflict && emailConflict.id !== existingSuperAdmin.id) {
      console.error('❌ Email superadmin@loanms.com is already in use by another user');
      return;
    }

    // Update the email
    const updatedUser = await prisma.user.update({
      where: { id: existingSuperAdmin.id },
      data: { email: 'superadmin@loanms.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    console.log('\n✅ SuperAdmin email updated successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 New Email:    superadmin@loanms.com');
    console.log('🔑 Password:     Admin@123');
    console.log('👤 Name:         ' + updatedUser.firstName + ' ' + updatedUser.lastName);
    console.log('👑 Role:         ' + updatedUser.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✨ You can now login with the new email address!');
  } catch (error: any) {
    console.error('❌ Error updating SuperAdmin email:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateSuperAdminEmail()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
