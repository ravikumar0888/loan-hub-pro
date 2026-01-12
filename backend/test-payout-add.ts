import axios from 'axios';

async function testPayoutAdd() {
  try {
    // Login
    console.log('Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'master@loanms.com',
      password: 'MasterAdmin@123',
    });

    const token = loginResponse.data.data.token;
    console.log('✓ Login successful');

    // Get connectors
    console.log('\nFetching connectors...');
    const connectorsResponse = await axios.get('http://localhost:5000/api/users/connectors', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const connectors = connectorsResponse.data.data;
    console.log(`✓ Found ${connectors.length} connectors`);

    if (connectors.length === 0) {
      console.log('No connectors found. Cannot test payout add.');
      return;
    }

    const testConnector = connectors[0];
    console.log(`Using connector: ${testConnector.firstName} ${testConnector.lastName} (${testConnector.id})`);

    // Test 1: Add advance (debit)
    console.log('\n--- Test 1: Add Advance (Debit) ---');
    const advanceData = {
      connectorId: testConnector.id,
      entryType: 'debit',
      amount: 5000,
      description: 'Test advance payment',
      month: 1,
      year: 2026,
    };

    console.log('Sending request:', JSON.stringify(advanceData, null, 2));

    const advanceResponse = await axios.post('http://localhost:5000/api/payouts/ledger', advanceData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✓ Advance added successfully');
    console.log('Response:', JSON.stringify(advanceResponse.data, null, 2));

    // Test 2: Add credit entry
    console.log('\n--- Test 2: Add Credit Entry ---');
    const creditData = {
      connectorId: testConnector.id,
      entryType: 'credit',
      amount: 10000,
      description: 'Test manual credit',
      month: 1,
      year: 2026,
    };

    console.log('Sending request:', JSON.stringify(creditData, null, 2));

    const creditResponse = await axios.post('http://localhost:5000/api/payouts/ledger', creditData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✓ Credit added successfully');
    console.log('Response:', JSON.stringify(creditResponse.data, null, 2));

    // Test 3: Get connector balance
    console.log('\n--- Test 3: Get Connector Balance ---');
    const balanceResponse = await axios.get(
      `http://localhost:5000/api/payouts/balance/${testConnector.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('✓ Balance retrieved successfully');
    console.log('Balance:', JSON.stringify(balanceResponse.data.data, null, 2));

    console.log('\n✓✓✓ All tests passed! ✓✓✓');
  } catch (error: any) {
    console.error('\n✗ Test failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Wait for server to start, then run tests
setTimeout(() => {
  console.log('Starting payout tests...\n');
  testPayoutAdd();
}, 5000);
