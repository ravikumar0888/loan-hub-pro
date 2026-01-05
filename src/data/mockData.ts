import { Customer, Bank, User, DSA, KPIData, LoanStatus, LoanType, HomeType } from '@/types';

export const mockKPIData: KPIData = {
  login: 145,
  rejected: 32,
  approved: 89,
  disbursed: 67,
  hold: 23,
  relook: 15,
  drop: 18,
};

export const mockTrendData = [
  { date: 'Jan', sales: 45, disbursed: 32 },
  { date: 'Feb', sales: 52, disbursed: 38 },
  { date: 'Mar', sales: 61, disbursed: 45 },
  { date: 'Apr', sales: 58, disbursed: 42 },
  { date: 'May', sales: 72, disbursed: 55 },
  { date: 'Jun', sales: 68, disbursed: 51 },
  { date: 'Jul', sales: 85, disbursed: 67 },
];

export const mockBanks: Bank[] = [
  { id: '1', name: 'HDFC Bank', createdAt: new Date() },
  { id: '2', name: 'ICICI Bank', createdAt: new Date() },
  { id: '3', name: 'State Bank of India', createdAt: new Date() },
  { id: '4', name: 'Axis Bank', createdAt: new Date() },
  { id: '5', name: 'Kotak Mahindra Bank', createdAt: new Date() },
  { id: '6', name: 'Bajaj Finance', createdAt: new Date() },
  { id: '7', name: 'Tata Capital', createdAt: new Date() },
];

export const mockUsers: User[] = [
  {
    id: '1',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    email: 'rajesh.kumar@loanms.com',
    mobile: '9876543210',
    role: 'admin',
    createdAt: new Date(),
  },
  {
    id: '2',
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@loanms.com',
    mobile: '9876543211',
    role: 'backoffice',
    createdAt: new Date(),
  },
  {
    id: '3',
    firstName: 'Amit',
    lastName: 'Patel',
    email: 'amit.patel@loanms.com',
    mobile: '9876543212',
    role: 'connector',
    createdAt: new Date(),
  },
  {
    id: '4',
    firstName: 'Neha',
    lastName: 'Verma',
    email: 'neha.verma@loanms.com',
    mobile: '9876543213',
    role: 'connector',
    createdAt: new Date(),
  },
  {
    id: '5',
    firstName: 'Vikram',
    lastName: 'Singh',
    email: 'vikram.singh@loanms.com',
    mobile: '9876543214',
    role: 'backoffice',
    createdAt: new Date(),
  },
];

export const mockDSAs: DSA[] = [
  {
    id: '1',
    name: 'FinServe Solutions',
    bankDetails: [
      { id: '1', bankId: '1', bankName: 'HDFC Bank', loanType: 'PL', payoutRatio: 2.5 },
      { id: '2', bankId: '2', bankName: 'ICICI Bank', loanType: 'HL', payoutRatio: 1.8 },
    ],
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'LoanMart India',
    bankDetails: [
      { id: '3', bankId: '3', bankName: 'State Bank of India', loanType: 'BL', payoutRatio: 2.0 },
    ],
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Capital Connect',
    bankDetails: [
      { id: '4', bankId: '4', bankName: 'Axis Bank', loanType: 'PL', payoutRatio: 2.2 },
    ],
    createdAt: new Date(),
  },
];

const statuses: LoanStatus[] = ['login', 'rejected', 'approved', 'disbursed', 'hold', 'relook', 'drop'];
const loanTypes: LoanType[] = ['PL', 'HL', 'BL'];
const homeTypes: HomeType[] = ['own', 'rental', 'self-occupied'];

const connectors = mockUsers.filter(u => u.role === 'connector');

export const mockCustomers: Customer[] = Array.from({ length: 50 }, (_, i) => {
  const connector = connectors[Math.floor(Math.random() * connectors.length)];
  const dsa = mockDSAs[Math.floor(Math.random() * mockDSAs.length)];
  const bank = mockBanks[Math.floor(Math.random() * mockBanks.length)];
  
  return {
    id: `${i + 1}`,
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    applicationId: `APP${String(i + 1001).padStart(6, '0')}`,
    name: [
      'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Neha Singh', 'Vikram Verma',
      'Anjali Gupta', 'Rohit Joshi', 'Deepika Reddy', 'Arjun Mehta', 'Kavita Nair',
      'Suresh Iyer', 'Meera Kapoor', 'Anil Rao', 'Pooja Shah', 'Karan Malhotra',
    ][i % 15],
    motherName: ['Sunita Sharma', 'Kamla Patel', 'Rekha Kumar', 'Usha Singh', 'Meena Verma'][i % 5],
    spouseName: i % 3 === 0 ? '' : ['Anita Sharma', 'Raj Patel', 'Suman Kumar', 'Ravi Singh'][i % 4],
    mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    email: `customer${i + 1}@email.com`,
    currentCompany: ['TCS', 'Infosys', 'Wipro', 'HCL', 'Tech Mahindra'][i % 5],
    currentCompanyExperience: `${Math.floor(1 + Math.random() * 10)} years`,
    officialEmail: `customer${i + 1}@${['tcs', 'infosys', 'wipro', 'hcl', 'techmahindra'][i % 5]}.com`,
    totalWorkExperience: `${Math.floor(3 + Math.random() * 15)} years`,
    currentAddress: `${Math.floor(100 + Math.random() * 900)}, Sector ${Math.floor(1 + Math.random() * 50)}, Mumbai`,
    postalAddress: `${Math.floor(100 + Math.random() * 900)}, Sector ${Math.floor(1 + Math.random() * 50)}, Mumbai - 400001`,
    homeType: homeTypes[Math.floor(Math.random() * 3)],
    reference1: {
      name: ['Suresh Kumar', 'Ramesh Sharma', 'Anil Gupta'][i % 3],
      mobile: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
      address: `${Math.floor(100 + Math.random() * 900)}, Reference Area, Mumbai`,
    },
    reference2: {
      name: ['Mahesh Verma', 'Dinesh Patel', 'Ganesh Rao'][i % 3],
      mobile: `96${Math.floor(10000000 + Math.random() * 90000000)}`,
      address: `${Math.floor(100 + Math.random() * 900)}, Reference Area, Delhi`,
    },
    loanType: loanTypes[Math.floor(Math.random() * 3)],
    loanAmount: Math.floor(100000 + Math.random() * 4900000),
    connectorId: connector.id,
    connectorName: `${connector.firstName} ${connector.lastName}`,
    dsaId: dsa.id,
    dsaName: dsa.name,
    bankId: bank.id,
    bankName: bank.name,
    leadOwner: ['Rajesh Kumar', 'Priya Sharma'][Math.floor(Math.random() * 2)],
    salesManager: ['Vikram Singh', 'Neha Verma'][Math.floor(Math.random() * 2)],
    status: statuses[Math.floor(Math.random() * 7)],
    remarks: [
      { text: 'Initial inquiry received', addedBy: 'Rajesh Kumar', addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { text: 'Documents pending from customer', addedBy: 'Priya Sharma', addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  };
});
