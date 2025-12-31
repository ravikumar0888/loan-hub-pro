export type UserRole = 'admin' | 'backoffice' | 'connector';

export type LoanStatus = 'login' | 'rejected' | 'approved' | 'disbursed' | 'hold' | 'relook' | 'drop';

export type LoanType = 'PL' | 'HL' | 'BL';

export type HomeType = 'own' | 'rental' | 'self-occupied';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: UserRole;
  createdAt: Date;
}

export interface Bank {
  id: string;
  name: string;
  createdAt: Date;
}

export interface BankDetail {
  id: string;
  bankId: string;
  bankName: string;
  loanType: LoanType;
  payoutRatio: number;
}

export interface Reference {
  name: string;
  mobile: string;
  address: string;
}

export interface Customer {
  id: string;
  date: Date;
  applicationId: string;
  // Personal Details
  name: string;
  motherName: string;
  spouseName: string;
  mobile: string;
  email: string;
  // Professional Details
  currentCompany: string;
  currentCompanyExperience: string;
  officialEmail: string;
  totalWorkExperience: string;
  currentAddress: string;
  postalAddress: string;
  homeType: HomeType;
  // References
  reference1: Reference;
  reference2: Reference;
  // Loan Details
  loanType: LoanType;
  loanAmount: number;
  connectorId: string;
  connectorName: string;
  dsaId: string;
  dsaName: string;
  bankId: string;
  bankName: string;
  leadOwner: string;
  salesManager: string;
  status: LoanStatus;
  remarks: Array<{ text: string; addedBy: string; addedAt: Date }>;
  createdAt: Date;
}

export interface DSA {
  id: string;
  name: string;
  bankDetails: BankDetail[];
  createdAt: Date;
}

export interface KPIData {
  login: number;
  rejected: number;
  approved: number;
  disbursed: number;
  hold: number;
  relook: number;
  drop: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
}
