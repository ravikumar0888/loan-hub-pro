import axios from 'axios';

async function testReportsAPI() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'master@loanms.com',
      password: 'MasterAdmin@123',
    });

    const token = loginResponse.data.data.token;
    console.log('Login successful, got token');

    // Test reports API
    const startDate = '2025-12-12T08:27:45.611Z';
    const endDate = '2026-01-12T08:27:45.611Z';

    console.log('\n--- Testing Reports API ---');
    console.log('Date range:', startDate, 'to', endDate);

    const reportsResponse = await axios.get(
      `http://localhost:5000/api/reports?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('Status:', reportsResponse.status);
    console.log('Data:', JSON.stringify(reportsResponse.data, null, 2));

    if (reportsResponse.data.data && reportsResponse.data.data.length > 0) {
      console.log('\n--- First Customer ---');
      const customer = reportsResponse.data.data[0];
      console.log('Name:', customer.name);
      console.log('Loan Amount:', customer.loanAmount);
      console.log('Connector Payout:', customer.connectorPayout);
      console.log('DSA Payout:', customer.dsaPayout);
      console.log('TDS:', customer.tds);
      console.log('NetPay:', customer.netPay);
      console.log('Net Revenue:', customer.netRevenue);
      console.log('Lead Owner Name:', customer.leadOwnerName);
      console.log('Sales Manager Name:', customer.salesManagerName);
    }

    // Test export API
    console.log('\n--- Testing Export API ---');
    const exportResponse = await axios.get(
      `http://localhost:5000/api/reports/export?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('Export Status:', exportResponse.status);
    console.log('Export Data Length:', exportResponse.data.length);
    console.log('Export Preview:', exportResponse.data.substring(0, 500));
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testReportsAPI();
