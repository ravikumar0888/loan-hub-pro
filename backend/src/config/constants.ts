export const LOAN_STATUSES = ['login', 'rejected', 'approved', 'disbursed', 'hold', 'relook', 'drop'] as const;
export const LOAN_TYPES = ['PL', 'HL', 'BL'] as const;
export const USER_ROLES = ['admin', 'backoffice', 'connector'] as const;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 10,
  maxLimit: 100,
};

export const PRICING_TIER_LIMITS = {
  starter: {
    min: 1,
    max: 5,
    pricePerSeat: 499,
  },
  professional: {
    min: 5,
    max: 25,
    pricePerSeat: 899,
  },
  enterprise: {
    min: 10,
    max: null, // Unlimited
    pricePerSeat: 1499,
  },
};

export const TRIAL_PERIOD_DAYS = 14;

export const USER_ROLES = {
  MASTER_ADMIN: 'master_admin',
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  BACKOFFICE: 'backoffice',
  CONNECTOR: 'connector',
} as const;

export const ORGANIZATION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;
