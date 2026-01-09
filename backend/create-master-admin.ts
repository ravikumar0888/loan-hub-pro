import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createMasterAdmin() {
  try {
    console.log('Creating Master Admin user...\n');

    // Check if master admin already exists
    const existingMasterAdmin = await prisma.users.findFirst({
      where: { role: 'master_admin' },
    });

    if (existingMasterAdmin) {
      console.log('✅ Master Admin already exists!');
      console.log('📧 Email:', existingMasterAdmin.email);
      console.log('\nUpdating password to: MasterAdmin@123');

      // Hash the password
      const password_hash = await bcrypt.hash('MasterAdmin@123', 10);

      // Update the password
      await prisma.users.update({
        where: { id: existingMasterAdmin.id },
        data: {
          password_hash,
          updated_at: new Date(),
        },
      });

      console.log('✅ Master Admin password updated successfully!');
    } else {
      // Hash the password
      const password_hash = await bcrypt.hash('MasterAdmin@123', 10);

      // Create new master admin (with organization_id = null)
      const masterAdmin = await prisma.users.create({
        data: {
          id: `user-master-${Date.now()}`,
          email: 'master@loanms.com',
          password_hash,
          first_name: 'Master',
          last_name: 'Admin',
          mobile: '0000000000',
          role: 'master_admin',
          organization_id: null, // Master admin has no organization
          is_active: true,
          updated_at: new Date(),
        },
      });

      console.log('✅ Master Admin created successfully!');
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email: master@loanms.com');
      console.log('🔑 Password: MasterAdmin@123');
      console.log('👤 Name: Master Admin');
      console.log('👑 Role: master_admin');
      console.log('🏢 Organization: None (Platform Admin)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');
    console.log('\n📋 Master Admin Capabilities:');
    console.log('   ✅ View and manage all organizations');
    console.log('   ✅ Create, update, and delete organizations');
    console.log('   ✅ Generate invoices for organizations');
    console.log('   ✅ View billing analytics');
    console.log('   ✅ Access platform-wide data');
    console.log('\n🔗 Login URL: http://localhost:8080/login');
    console.log('🎯 After login, you will be redirected to: /master-admin\n');

  } catch (error: any) {
    console.error('❌ Error creating Master Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createMasterAdmin()
  .then(() => {
    console.log('✨ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
