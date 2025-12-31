import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.customerRemark.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.userBankDetail.deleteMany();
  await prisma.dsaBankDetail.deleteMany();
  await prisma.dsa.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.bank.deleteMany();

  // Create Banks
  console.log('🏦 Creating banks...');
  const banks = await Promise.all([
    prisma.bank.create({ data: { name: 'HDFC Bank' } }),
    prisma.bank.create({ data: { name: 'ICICI Bank' } }),
    prisma.bank.create({ data: { name: 'State Bank of India' } }),
    prisma.bank.create({ data: { name: 'Axis Bank' } }),
    prisma.bank.create({ data: { name: 'Kotak Mahindra Bank' } }),
    prisma.bank.create({ data: { name: 'Bajaj Finance' } }),
    prisma.bank.create({ data: { name: 'Tata Capital' } }),
  ]);
  console.log(`✅ Created ${banks.length} banks`);

  // Create Users
  console.log('👥 Creating users...');
  const defaultPassword = await hashPassword('password123');

  await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@loanms.com',
      mobile: '9999999999',
      passwordHash: defaultPassword,
      role: 'admin',
    },
  });

  const backofficeUser = await prisma.user.create({
    data: {
      firstName: 'Back',
      lastName: 'Office',
      email: 'backoffice@loanms.com',
      mobile: '9999999998',
      passwordHash: defaultPassword,
      role: 'backoffice',
    },
  });

  const connectors = await Promise.all([
    prisma.user.create({
      data: {
        firstName: 'John',
        lastName: 'Connector',
        email: 'connector@loanms.com',
        mobile: '9999999997',
        passwordHash: defaultPassword,
        role: 'connector',
      },
    }),
    prisma.user.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah@loanms.com',
        mobile: '9999999996',
        passwordHash: defaultPassword,
        role: 'connector',
      },
    }),
    prisma.user.create({
      data: {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike@loanms.com',
        mobile: '9999999995',
        passwordHash: defaultPassword,
        role: 'connector',
      },
    }),
  ]);
  console.log(`✅ Created ${3 + connectors.length} users`);

  // Create connector bank details
  console.log('💼 Creating connector bank details...');
  await prisma.userBankDetail.createMany({
    data: [
      { userId: connectors[0].id, bankId: banks[0].id, loanType: 'PL', payoutRatio: 2.5 },
      { userId: connectors[0].id, bankId: banks[1].id, loanType: 'HL', payoutRatio: 1.5 },
      { userId: connectors[1].id, bankId: banks[2].id, loanType: 'PL', payoutRatio: 2.0 },
      { userId: connectors[1].id, bankId: banks[3].id, loanType: 'BL', payoutRatio: 3.0 },
      { userId: connectors[2].id, bankId: banks[4].id, loanType: 'PL', payoutRatio: 2.25 },
    ],
  });
  console.log('✅ Created connector bank details');

  // Create DSAs
  console.log('🏢 Creating DSAs...');
  const dsas = await Promise.all([
    prisma.dsa.create({
      data: {
        name: 'ABC Financial Services',
        bankDetails: {
          create: [
            { bankId: banks[0].id, loanType: 'PL', payoutRatio: 3.0 },
            { bankId: banks[1].id, loanType: 'HL', payoutRatio: 2.0 },
          ],
        },
      },
    }),
    prisma.dsa.create({
      data: {
        name: 'XYZ Loan Consultants',
        bankDetails: {
          create: [
            { bankId: banks[2].id, loanType: 'BL', payoutRatio: 3.5 },
            { bankId: banks[3].id, loanType: 'PL', payoutRatio: 2.5 },
          ],
        },
      },
    }),
  ]);
  console.log(`✅ Created ${dsas.length} DSAs`);

  // Create Customers
  console.log('👨‍💼 Creating customers...');
  const customerNames = [
    'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Gupta', 'Vikram Singh',
    'Anjali Verma', 'Rahul Mehta', 'Pooja Jain', 'Arjun Reddy', 'Kavita Desai',
    'Sanjay Rao', 'Deepika Nair', 'Arun Kumar', 'Neha Kapoor', 'Suresh Yadav',
    'Ritu Agarwal', 'Manish Tiwari', 'Swati Malhotra', 'Karthik Iyer', 'Divya Pillai',
  ];

  const statuses = ['login', 'rejected', 'approved', 'disbursed', 'hold', 'relook', 'drop'];
  const loanTypes = ['PL', 'HL', 'BL'];

  for (let i = 0; i < 50; i++) {
    const randomName = customerNames[Math.floor(Math.random() * customerNames.length)];
    const randomConnector = connectors[Math.floor(Math.random() * connectors.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomLoanType = loanTypes[Math.floor(Math.random() * loanTypes.length)];
    const randomAmount = Math.floor(Math.random() * 2000000) + 100000; // 100k to 2.1M

    await prisma.customer.create({
      data: {
        name: `${randomName} ${i + 1}`,
        mobile: `98765${String(43210 + i).padStart(5, '0')}`,
        email: `customer${i + 1}@example.com`,
        loanType: randomLoanType as any,
        loanAmount: randomAmount,
        connectorId: randomConnector.id,
        leadOwner: Math.random() > 0.5 ? 'Lead Owner ' + (i % 3 + 1) : undefined,
        salesManager: Math.random() > 0.5 ? 'Sales Manager ' + (i % 2 + 1) : undefined,
        status: randomStatus as any,
        applicationDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        remarks: {
          create: [
            {
              remark: 'Initial application received',
              createdBy: backofficeUser.id,
            },
          ],
        },
      },
    });
  }
  console.log('✅ Created 50 customers');

  console.log('\n✨ Database seeding completed successfully!');
  console.log('\n📝 Demo Login Credentials:');
  console.log('┌─────────────────────────────────────────┐');
  console.log('│ Admin:                                  │');
  console.log('│ Email: admin@loanms.com                 │');
  console.log('│ Password: password123                   │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│ BackOffice:                             │');
  console.log('│ Email: backoffice@loanms.com            │');
  console.log('│ Password: password123                   │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│ Connector:                              │');
  console.log('│ Email: connector@loanms.com             │');
  console.log('│ Password: password123                   │');
  console.log('└─────────────────────────────────────────┘\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
