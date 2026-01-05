import { Request } from 'express';

// User Types
export type UserRole = 'admin' | 'backoffice' | 'connector';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Loan Types
export type LoanStatus = 'login' | 'rejected' | 'approved' | 'disbursed' | 'hold' | 'relook' | 'drop';
export type LoanType = 'PL' | 'HL' | 'BL';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pagination Query
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// Customer Filter Query
export interface CustomerFilterQuery extends PaginationQuery {
  status?: LoanStatus;
  search?: string;
  connectorId?: string;
  startDate?: string;
  endDate?: string;
}

// Dashboard Types
export interface KPIData {
  login: number;
  rejected: number;
  approved: number;
  disbursed: number;
  hold: number;
  relook: number;
  drop: number;
}

export interface TrendDataPoint {
  month: string;
  sales: number;
  disbursed: number;
}

// Report Types
export interface ReportQuery {
  startDate?: string;
  endDate?: string;
  dsaId?: string;
  connectorId?: string;
}

export interface ReportSummary {
  totalApplications: number;
  totalLoanAmount: number;
  disbursedAmount: number;
}
