export const LOAN_STATUSES = ['login', 'rejected', 'approved', 'disbursed', 'hold', 'relook', 'drop'] as const;
export const LOAN_TYPES = ['PL', 'HL', 'BL'] as const;
export const USER_ROLES = ['admin', 'backoffice', 'connector'] as const;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 10,
  maxLimit: 100,
};

export const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds
