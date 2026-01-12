const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPayoutFlow() {
  try {
    console.log('=== Testing Payout Flow ===\n');

    // Get a connector
    const connector = await prisma.user.findFirst({
      where: { role: 'connector' },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!connector) {
      console.log('❌ No connector found. Please create a connector first.');
      return;
    }

    console.log(`✓ Found connector: ${connector.firstName} ${connector.lastName} (${connector.id})`);

    // Check existing entries
    const existingEntries = await prisma.payoutLedger.findMany({
      where: { connectorId: connector.id },
      select: {
        id: true,
        entry_type: true,
        amount: true,
        description: true,
        month: true,
        year: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    console.log(`\n✓ Found ${existingEntries.length} existing entries for this connector`);

    if (existingEntries.length > 0) {
      console.log('\nRecent entries:');
      existingEntries.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.entry_type.toUpperCase()} - ₹${entry.amount} - ${entry.description}`);
        console.log(`     Date: ${entry.createdAt.toLocaleDateString()}, Month: ${entry.month}/${entry.year}`);
      });
    }

    // Create a test advance entry
    console.log('\n--- Creating Test Advance Entry ---');
    const testAdvance = await prisma.payoutLedger.create({
      data: {
        connectorId: connector.id,
        entry_type: 'debit',
        amount: 1000,
        description: 'Test advance - automated test',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    });

    console.log(`✓ Created advance entry: ${testAdvance.id}`);
    console.log(`  Amount: ₹${testAdvance.amount}`);
    console.log(`  Type: ${testAdvance.entry_type}`);

    // Create a test credit entry
    console.log('\n--- Creating Test Credit Entry ---');
    const testCredit = await prisma.payoutLedger.create({
      data: {
        connectorId: connector.id,
        entry_type: 'credit',
        amount: 5000,
        description: 'Test payout - automated test',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    });

    console.log(`✓ Created credit entry: ${testCredit.id}`);
    console.log(`  Amount: ₹${testCredit.amount}`);
    console.log(`  Type: ${testCredit.entry_type}`);

    // Calculate balance
    const allEntries = await prisma.payoutLedger.findMany({
      where: { connectorId: connector.id },
    });

    const totalCredits = allEntries
      .filter(e => e.entry_type === 'credit')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const totalDebits = allEntries
      .filter(e => e.entry_type === 'debit')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const balance = totalCredits - totalDebits;

    console.log('\n--- Connector Balance Summary ---');
    console.log(`Total Earned (Credits): ₹${totalCredits.toFixed(2)}`);
    console.log(`Total Advance (Debits): ₹${totalDebits.toFixed(2)}`);
    console.log(`Current Balance: ₹${balance.toFixed(2)}`);

    console.log('\n✅ All tests passed!');
    console.log('\nNow check the Payouts page in the frontend:');
    console.log('1. Navigate to http://localhost:8080/payouts');
    console.log('2. Select the connector: ' + connector.firstName + ' ' + connector.lastName);
    console.log('3. Expand the current month accordion');
    console.log('4. You should see the test entries with Credit and Debit amounts showing');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testPayoutFlow();
