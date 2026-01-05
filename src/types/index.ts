export type UserRole = 'master_admin' | 'admin' | 'backoffice' | 'connector';

export type LoanStatus = 'login' | 'rejected' | 'approved' | 'disbursed' | 'hold' | 'relook' | 'drop';

export type LoanType = 'PL' | 'HL' | 'BL';

export type HomeType = 'own' | 'rental' | 'self-occupied';

// Pricing Tiers
export type PricingTier = 'starter' | 'professional' | 'enterprise';

export interface PricingPlan {
  id: string;
  name: string;
  tier: PricingTier;
  pricePerSeat: number;
  minSeats: number;
  maxSeats: number | null;
  features: string[];
  isPopular?: boolean;
}

// Organization
export interface Organization {
  id: string;
  name: string;
  logo?: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  pricingTier: PricingTier;
  seats: number;
  usedSeats: number;
  superAdminId: string;
  status: 'active' | 'suspended' | 'trial';
  trialEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Billing
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  organizationId: string;
  organizationName: string;
  amount: number;
  seats: number;
  pricePerSeat: number;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
  status: InvoiceStatus;
  paidAt?: Date;
  createdAt: Date;
}

export interface BillingHistory {
  organizationId: string;
  invoices: Invoice[];
  totalPaid: number;
  totalOutstanding: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: UserRole;
  organizationId?: string;
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
  applicationId?: string;
  applicationDate: Date;
  date?: Date;
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
