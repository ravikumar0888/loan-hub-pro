import { Request } from 'express';

// ==================== USER ROLES ====================

export type UserRole = 'master_admin' | 'superadmin' | 'admin' | 'backoffice' | 'connector';

// ==================== MULTI-TENANCY TYPES ====================

export type PricingTier = 'starter' | 'professional' | 'enterprise';
export type OrganizationStatus = 'trial' | 'active' | 'suspended';
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

// ==================== AUTH TYPES ====================

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  organizationId?: string | null;
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

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==================== ORGANIZATION TYPES ====================

export interface Addon {
  id: string;
  role: 'admin' | 'backoffice' | 'channel_partner';
  quantity: number;
  price: number;
}

export interface OrganizationQueryParams extends PaginationQuery {
  status?: OrganizationStatus;
  search?: string;
}

export interface CreateOrganizationDto {
  // Organization details
  name: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  logo?: string;
  pricingTier: PricingTier;
  seats: number;
  monthlyAmount: number; // Total billing amount including add-ons
  addons?: Addon[]; // Add-ons configuration
  // Super admin details
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminMobile: string;
  adminPassword: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logo?: string;
  pricingTier?: PricingTier;
  seats?: number;
  monthlyAmount?: number; // Total billing amount including add-ons
  addons?: Addon[]; // Add-ons configuration
  status?: OrganizationStatus;
  // Super admin updates (optional)
  adminFirstName?: string;
  adminLastName?: string;
  adminEmail?: string;
  adminMobile?: string;
  adminPassword?: string;
}

// ==================== INVOICE TYPES ====================

export interface InvoiceQueryParams extends PaginationQuery {
  organizationId?: string;
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
}

export interface CreateInvoiceDto {
  organizationId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
}

export interface UpdateInvoiceStatusDto {
  status: InvoiceStatus;
}

// ==================== CUSTOMER TYPES ====================

export interface CustomerFilterQuery extends PaginationQuery {
  status?: string;
  connectorId?: string;
  dsaId?: string;
  bankId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// ==================== USER TYPES ====================

export interface UserQuery extends PaginationQuery {
  role?: UserRole;
  search?: string;
}

// ==================== REPORT TYPES ====================

export interface ReportQuery extends PaginationQuery {
  startDate?: string;
  endDate?: string;
  connectorId?: string;
  dsaId?: string;
  bankId?: string;
  status?: LoanStatus;
  leadOwnerId?: string;
}
