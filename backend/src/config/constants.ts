export const LOAN_STATUSES = ['login', 'rejected', 'approved', 'disbursed', 'hold', 'relook', 'drop'] as const;
export const LOAN_TYPES = ['PL', 'HL', 'BL'] as const;
export const ALLOWED_ROLES_FOR_CREATION = ['admin', 'backoffice', 'connector'] as const;

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
    userLimits: {
      superadmin: 1,
      admin: 1,
      backoffice: 2,
      connector: 10,
    },
  },
  professional: {
    min: 5,
    max: 25,
    pricePerSeat: 899,
    userLimits: {
      superadmin: 1,
      admin: 2,
      backoffice: 4,
      connector: 20,
    },
  },
  enterprise: {
    min: 10,
    max: null, // Unlimited
    pricePerSeat: 1499,
    userLimits: {
      superadmin: 1,
      admin: 5,
      backoffice: 10,
      connector: 50,
    },
    isCustomizable: true,
    addonPricing: {
      connector: 100,    // ₹100 per additional connector
      backoffice: 200,   // ₹200 per additional backoffice user
      admin: 500,        // ₹500 per additional admin user
    },
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
