import { Customer, Bank, User, DSA, KPIData, LoanStatus, LoanType } from '@/types';

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
];

const statuses: LoanStatus[] = ['login', 'rejected', 'approved', 'disbursed', 'hold', 'relook', 'drop'];
const loanTypes: LoanType[] = ['PL', 'HL', 'BL'];

export const mockCustomers: Customer[] = Array.from({ length: 50 }, (_, i) => ({
  id: `${i + 1}`,
  date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  name: [
    'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Neha Singh', 'Vikram Verma',
    'Anjali Gupta', 'Rohit Joshi', 'Deepika Reddy', 'Arjun Mehta', 'Kavita Nair',
    'Suresh Iyer', 'Meera Kapoor', 'Anil Rao', 'Pooja Shah', 'Karan Malhotra',
  ][i % 15],
  mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
  email: `customer${i + 1}@email.com`,
  loanType: loanTypes[Math.floor(Math.random() * 3)],
  loanAmount: Math.floor(100000 + Math.random() * 4900000),
  connectorId: mockUsers.filter(u => u.role === 'connector')[Math.floor(Math.random() * 2)].id,
  connectorName: mockUsers.filter(u => u.role === 'connector')[Math.floor(Math.random() * 2)].firstName + ' ' + mockUsers.filter(u => u.role === 'connector')[Math.floor(Math.random() * 2)].lastName,
  leadOwner: ['Rajesh Kumar', 'Priya Sharma'][Math.floor(Math.random() * 2)],
  salesManager: ['Vikram Singh', 'Neha Verma'][Math.floor(Math.random() * 2)],
  status: statuses[Math.floor(Math.random() * 7)],
  remarks: ['Initial inquiry', 'Documents pending', 'Verification in progress'],
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
}));
