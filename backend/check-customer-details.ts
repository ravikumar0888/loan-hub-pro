import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCustomerDetails() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        connector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userBankDetails: {
              include: {
                bank: true,
              },
            },
          },
        },
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
        dsa: {
          select: {
            id: true,
            name: true,
            bankDetails: {
              include: {
                bank: true,
              },
            },
          },
        },
        leadOwnerUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log('Total customers:', customers.length);
    console.log('\nCustomer details:');
    customers.forEach((customer, index) => {
      console.log(`\n--- Customer ${index + 1} ---`);
      console.log('ID:', customer.id);
      console.log('Name:', customer.name);
      console.log('Status:', customer.status);
      console.log('Loan Amount:', customer.loanAmount);
      console.log('Loan Type:', customer.loanType);
      console.log('Application Date:', customer.applicationDate);
      console.log('Subvention Amount:', customer.subventionAmount);
      console.log('Organization ID:', customer.organizationId);
      console.log('Bank:', customer.bank ? customer.bank.name : 'NULL');
      console.log('DSA:', customer.dsa ? customer.dsa.name : 'NULL');
      console.log('Connector:', customer.connector ? `${customer.connector.firstName} ${customer.connector.lastName}` : 'NULL');
      console.log('Connector Bank Details:', customer.connector?.userBankDetails?.length || 0);
      console.log('DSA Bank Details:', customer.dsa?.bankDetails?.length || 0);
      console.log('Lead Owner:', customer.leadOwnerUser ? `${customer.leadOwnerUser.firstName} ${customer.leadOwnerUser.lastName}` : 'NULL');
      console.log('Sales Manager:', customer.salesManager || 'NULL');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomerDetails();
