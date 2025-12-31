import { z } from 'zod';

// Auth Validators
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// User Validators
export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'backoffice', 'connector']),
  bankDetails: z.array(z.object({
    bankId: z.string().uuid(),
    loanType: z.enum(['PL', 'HL', 'BL']),
    payoutRatio: z.number().min(0).max(100),
  })).optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  mobile: z.string().regex(/^\d{10}$/).optional(),
  role: z.enum(['admin', 'backoffice', 'connector']).optional(),
  isActive: z.boolean().optional(),
  bankDetails: z.array(z.object({
    bankId: z.string().uuid(),
    loanType: z.enum(['PL', 'HL', 'BL']),
    payoutRatio: z.number().min(0).max(100),
  })).optional(),
});

// Bank Validators
export const createBankSchema = z.object({
  name: z.string().min(1, 'Bank name is required'),
});

export const updateBankSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

// DSA Validators
export const createDsaSchema = z.object({
  name: z.string().min(1, 'DSA name is required'),
  bankDetails: z.array(z.object({
    bankId: z.string().uuid(),
    loanType: z.enum(['PL', 'HL', 'BL']),
    payoutRatio: z.number().min(0).max(100),
  })),
});

export const updateDsaSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  bankDetails: z.array(z.object({
    bankId: z.string().uuid(),
    loanType: z.enum(['PL', 'HL', 'BL']),
    payoutRatio: z.number().min(0).max(100),
  })).optional(),
});

// Customer Validators
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  email: z.string().email('Invalid email address').optional(),
  loanType: z.enum(['PL', 'HL', 'BL']),
  loanAmount: z.number().positive('Loan amount must be positive'),
  connectorId: z.string().uuid().optional(),
  leadOwner: z.string().optional(),
  salesManager: z.string().optional(),
  status: z.enum(['login', 'rejected', 'approved', 'disbursed', 'hold', 'relook', 'drop']).default('login'),
  remarks: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  mobile: z.string().regex(/^\d{10}$/).optional(),
  email: z.string().email().optional(),
  loanType: z.enum(['PL', 'HL', 'BL']).optional(),
  loanAmount: z.number().positive().optional(),
  connectorId: z.string().uuid().optional(),
  leadOwner: z.string().optional(),
  salesManager: z.string().optional(),
  status: z.enum(['login', 'rejected', 'approved', 'disbursed', 'hold', 'relook', 'drop']).optional(),
});

export const addRemarkSchema = z.object({
  remark: z.string().min(1, 'Remark cannot be empty'),
});
