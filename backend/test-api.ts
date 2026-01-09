import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('='.repeat(60));
    console.log('TESTING API ENDPOINTS');
    console.log('='.repeat(60));

    // Test 1: Login
    console.log('\n1. Testing Login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@loanms.com',
      password: 'admin@123',
    });
    console.log('✅ Login successful');
    console.log('   User:', loginRes.data.data.user.email);
    console.log('   Role:', loginRes.data.data.user.role);

    const token = loginRes.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test 2: Get current user
    console.log('\n2. Testing Get Current User...');
    const meRes = await axios.get(`${API_URL}/auth/me`, { headers });
    console.log('✅ Get current user successful');
    console.log('   User:', meRes.data.data.email);

    // Test 3: Get all connector balances
    console.log('\n3. Testing Get Connector Balances...');
    try {
      const balancesRes = await axios.get(`${API_URL}/payouts/balances`, { headers });
      console.log('✅ Get balances successful');
      console.log(`   Found ${balancesRes.data.data.length} connectors`);
    } catch (error: any) {
      console.log('⚠️  Balances endpoint:', error.response?.data?.error || error.message);
    }

    // Test 4: Get ledger entries
    console.log('\n4. Testing Get Ledger Entries...');
    try {
      const ledgerRes = await axios.get(`${API_URL}/payouts/ledger`, { headers });
      console.log('✅ Get ledger entries successful');
      console.log(`   Found ${ledgerRes.data.data.length} entries`);
    } catch (error: any) {
      console.log('⚠️  Ledger endpoint:', error.response?.data?.error || error.message);
    }

    // Test 5: Get customers
    console.log('\n5. Testing Get Customers...');
    try {
      const customersRes = await axios.get(`${API_URL}/customers`, { headers });
      console.log('✅ Get customers successful');
      console.log(`   Found ${customersRes.data.data.length} customers`);
    } catch (error: any) {
      console.log('⚠️  Customers endpoint:', error.response?.data?.error || error.message);
    }

    // Test 6: Get users
    console.log('\n6. Testing Get Users...');
    try {
      const usersRes = await axios.get(`${API_URL}/users`, { headers });
      console.log('✅ Get users successful');
      console.log(`   Found ${usersRes.data.data.length} users`);
    } catch (error: any) {
      console.log('⚠️  Users endpoint:', error.response?.data?.error || error.message);
    }

    // Test 7: Get banks
    console.log('\n7. Testing Get Banks...');
    try {
      const banksRes = await axios.get(`${API_URL}/banks`, { headers });
      console.log('✅ Get banks successful');
      console.log(`   Found ${banksRes.data.data.length} banks`);
    } catch (error: any) {
      console.log('⚠️  Banks endpoint:', error.response?.data?.error || error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('API TESTING COMPLETE');
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

testAPI();
