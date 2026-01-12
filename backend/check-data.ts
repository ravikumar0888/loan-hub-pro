import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const customerCount = await prisma.customer.count();
    const userCount = await prisma.user.count();
    const orgCount = await prisma.organization.count();

    console.log('Database counts:');
    console.log('- Organizations:', orgCount);
    console.log('- Users:', userCount);
    console.log('- Customers:', customerCount);

    if (customerCount > 0) {
      const customers = await prisma.customer.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          loanAmount: true,
          organizationId: true,
          applicationDate: true,
        },
      });
      console.log('\nSample customers:');
      console.log(JSON.stringify(customers, null, 2));
    }

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        take: 3,
        select: {
          id: true,
          email: true,
          role: true,
          organizationId: true,
        },
      });
      console.log('\nSample users:');
      console.log(JSON.stringify(users, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
