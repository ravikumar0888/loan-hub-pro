export type UserRole = 'admin' | 'backoffice' | 'connector';

export type LoanStatus = 'login' | 'rejected' | 'approved' | 'disbursed' | 'hold' | 'relook' | 'drop';

export type LoanType = 'PL' | 'HL' | 'BL';

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

export interface Customer {
  id: string;
  applicationId?: string;
  applicationDate: Date;
  date?: Date;
  name: string;
  mobile: string;
  email: string;
  loanType: LoanType;
  loanAmount: number;
  connectorId: string;
  connectorName?: string;
  connector?: { firstName: string; lastName: string };
  bankName?: string;
  bank?: { name: string };
  leadOwner?: string;
  salesManager?: string;
  status: LoanStatus;
  remarks?: string[];
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
