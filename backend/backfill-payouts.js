const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfillPayouts() {
  try {
    console.log('=== Backfilling Missing Payout Entries ===\n');

    // Get all disbursed customers
    const disbursedCustomers = await prisma.customer.findMany({
      where: { status: 'disbursed' },
      include: {
        connector: {
          include: {
            userBankDetails: {
              include: {
                bank: true,
              },
            },
          },
        },
        bank: true,
      },
    });

    console.log(`Found ${disbursedCustomers.length} disbursed customers\n`);

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const customer of disbursedCustomers) {
      console.log(`Processing: ${customer.name} (${customer.id})`);

      // Check if payout entry already exists
      const existingEntry = await prisma.payoutLedger.findFirst({
        where: {
          customerId: customer.id,
          entry_type: 'credit',
        },
      });

      if (existingEntry) {
        console.log(`  ⊘ Skipped - Entry already exists (₹${existingEntry.amount})\n`);
        skipped++;
        continue;
      }

      if (!customer.connectorId) {
        console.log(`  ⊘ Skipped - No connector assigned\n`);
        skipped++;
        continue;
      }

      // Find matching bank detail
      const bankDetail = customer.connector?.userBankDetails?.find(
        (bd) => bd.bank.id === customer.bankId && bd.loanType === customer.loanType
      );

      if (!bankDetail) {
        console.log(`  ✗ Failed - No matching bank detail for ${customer.loanType} at ${customer.bank?.name}\n`);
        failed++;
        continue;
      }

      // Calculate payout
      let payout = (Number(customer.loanAmount) * Number(bankDetail.payoutRatio)) / 100;

      // Deduct subvention amount if present
      if (customer.subventionAmount) {
        payout -= Number(customer.subventionAmount);
      }

      // Use the disbursement month or current month
      const disbursementDate = customer.updatedAt || customer.createdAt;
      const month = disbursementDate.getMonth() + 1;
      const year = disbursementDate.getFullYear();

      // Create credit entry
      const entry = await prisma.payoutLedger.create({
        data: {
          connectorId: customer.connectorId,
          customerId: customer.id,
          entry_type: 'credit',
          amount: new Prisma.Decimal(payout),
          description: `Payout for customer ${customer.name} - ${customer.loanType} - ${customer.bank?.name || 'N/A'}`,
          month,
          year,
        },
      });

      console.log(`  ✓ Created payout entry: ₹${payout.toFixed(2)} (Month: ${month}/${year})\n`);
      created++;
    }

    console.log('=== Summary ===');
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
    console.log(`\n✅ Backfill complete!`);

  } catch (error) {
    console.error('\n❌ Backfill failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillPayouts();
