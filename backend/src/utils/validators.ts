import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// ==================== VALIDATION MIDDLEWARE ====================

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// ==================== AUTH VALIDATORS ====================

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

// ==================== ORGANIZATION VALIDATORS ====================

export const signupSchema = z.object({
  // Organization details
  name: z.string().min(1, 'Organization name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  address: z.string().optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  logo: z.string().optional(),
  pricingTier: z.enum(['starter', 'professional', 'enterprise'], {
    errorMap: () => ({ message: 'Invalid pricing tier' }),
  }),
  seats: z.number().int().min(1, 'At least 1 seat required'),
  // Super admin details
  adminFirstName: z.string().min(1, 'Admin first name is required'),
  adminLastName: z.string().min(1, 'Admin last name is required'),
  adminEmail: z.string().email('Invalid admin email'),
  adminMobile: z.string().regex(/^\d{10}$/, 'Admin mobile must be 10 digits'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
  address: z.string().min(1).optional(),
  website: z.string().url().optional().or(z.literal('')),
  logo: z.string().optional(),
  pricingTier: z.enum(['starter', 'professional', 'enterprise']).optional(),
  seats: z.number().int().min(1).optional(),
  status: z.enum(['trial', 'active', 'suspended']).optional(),
});

// ==================== INVOICE VALIDATORS ====================

export const createInvoiceSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  billingPeriodStart: z.string().datetime('Invalid date format'),
  billingPeriodEnd: z.string().datetime('Invalid date format'),
  dueDate: z.string().datetime('Invalid date format'),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled']),
});

// ==================== USER VALIDATORS ====================

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['superadmin', 'admin', 'backoffice', 'connector']),
  bankDetails: z
    .array(
      z.object({
        bankId: z.string().uuid(),
        loanType: z.enum(['PL', 'HL', 'BL']),
        payoutRatio: z.number().min(0).max(100),
      })
    )
    .optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  mobile: z.string().regex(/^\d{10}$/).optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['superadmin', 'admin', 'backoffice', 'connector']).optional(),
  isActive: z.boolean().optional(),
  bankDetails: z
    .array(
      z.object({
        bankId: z.string().uuid(),
        loanType: z.enum(['PL', 'HL', 'BL']),
        payoutRatio: z.number().min(0).max(100),
      })
    )
    .optional(),
});

// ==================== BANK VALIDATORS ====================

export const createBankSchema = z.object({
  name: z.string().min(1, 'Bank name is required'),
});

export const updateBankSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

// ==================== DSA VALIDATORS ====================

export const createDsaSchema = z.object({
  name: z.string().min(1, 'DSA name is required'),
  bankDetails: z.array(
    z.object({
      bankId: z.string().uuid(),
      loanType: z.enum(['PL', 'HL', 'BL']),
      payoutRatio: z.number().min(0).max(100),
    })
  ),
});

export const updateDsaSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  bankDetails: z
    .array(
      z.object({
        bankId: z.string().uuid(),
        loanType: z.enum(['PL', 'HL', 'BL']),
        payoutRatio: z.number().min(0).max(100),
      })
    )
    .optional(),
});

// ==================== CUSTOMER VALIDATORS ====================

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  loanType: z.enum(['PL', 'HL', 'BL']),
  loanAmount: z.number().positive('Loan amount must be positive'),
  connectorId: z.string().uuid().optional(),
  dsaId: z.string().uuid().optional(),
  bankId: z.string().uuid().optional(),
  leadOwner: z.string().optional(),
  salesManager: z.string().optional(),
  status: z.enum(['login', 'rejected', 'approved', 'disbursed', 'hold', 'relook', 'drop']).default('login'),
  remarks: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  mobile: z.string().regex(/^\d{10}$/).optional(),
  email: z.string().email().optional().or(z.literal('')),
  loanType: z.enum(['PL', 'HL', 'BL']).optional(),
  loanAmount: z.number().positive().optional(),
  connectorId: z.string().uuid().optional(),
  dsaId: z.string().uuid().optional(),
  bankId: z.string().uuid().optional(),
  leadOwner: z.string().optional(),
  salesManager: z.string().optional(),
  status: z.enum(['login', 'rejected', 'approved', 'disbursed', 'hold', 'relook', 'drop']).optional(),
});

export const addRemarkSchema = z.object({
  remark: z.string().min(1, 'Remark cannot be empty'),
});
