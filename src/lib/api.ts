// API Configuration and Helper Functions
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Set auth token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'An error occurred',
    }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ success: boolean; data: { token: string; user: any } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    ),

  forgotPassword: (email: string) =>
    apiRequest<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    apiRequest<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  getCurrentUser: () =>
    apiRequest<{ success: boolean; data: any }>('/auth/me'),

  verifyPassword: (password: string) =>
    apiRequest<{ success: boolean; message: string }>('/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
};

// Users API
export const usersApi = {
  getUsers: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[]; pagination: any }>(
      `/users${params && Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  getUserById: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/users/${id}`),

  createUser: (data: any) =>
    apiRequest<{ success: boolean; data: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, data: any) =>
    apiRequest<{ success: boolean; data: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteUser: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),

  getConnectors: () =>
    apiRequest<{ success: boolean; data: any[] }>('/users/connectors'),

  getAdmins: () =>
    apiRequest<{ success: boolean; data: any[] }>('/users/admins'),

  getLimitsStatus: () =>
    apiRequest<{
      success: boolean;
      data: {
        pricingTier: string;
        organizationName: string;
        limits: {
          superadmin: { current: number; max: number };
          admin: { current: number; max: number };
          backoffice: { current: number; max: number };
          connector: { current: number; max: number };
        };
        isCustomizable: boolean;
        addonPricing: { connector: number; backoffice: number; admin: number } | null;
      };
    }>('/users/limits-status'),
};

// Banks API
export const banksApi = {
  getBanks: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[]; pagination: any }>(
      `/banks${params && Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  getAllBanks: () =>
    apiRequest<{ success: boolean; data: any[] }>('/banks/all'),

  getBankById: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/banks/${id}`),

  createBank: (data: { name: string }) =>
    apiRequest<{ success: boolean; data: any }>('/banks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBank: (id: string, data: any) =>
    apiRequest<{ success: boolean; data: any }>(`/banks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteBank: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/banks/${id}`, {
      method: 'DELETE',
    }),
};

// DSAs API
export const dsasApi = {
  getDsas: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[]; pagination: any }>(
      `/dsas${params && Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  getAllDsas: () =>
    apiRequest<{ success: boolean; data: any[] }>('/dsas/all'),

  getDsaById: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/dsas/${id}`),

  createDsa: (data: any) =>
    apiRequest<{ success: boolean; data: any }>('/dsas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDsa: (id: string, data: any) =>
    apiRequest<{ success: boolean; data: any }>(`/dsas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteDsa: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/dsas/${id}`, {
      method: 'DELETE',
    }),
};

// Customers API
export const customersApi = {
  getCustomers: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[]; pagination: any }>(
      `/customers${params && Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  getCustomerById: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/customers/${id}`),

  createCustomer: (data: any) =>
    apiRequest<{ success: boolean; data: any }>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCustomer: (id: string, data: any) =>
    apiRequest<{ success: boolean; data: any }>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCustomer: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/customers/${id}`, {
      method: 'DELETE',
    }),

  addRemark: (id: string, remark: string) =>
    apiRequest<{ success: boolean; data: any }>(`/customers/${id}/remarks`, {
      method: 'POST',
      body: JSON.stringify({ remark }),
    }),

  getRemarks: (id: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/customers/${id}/remarks`),
};

// Dashboard API
export const dashboardApi = {
  getKPIs: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any }>(
      `/dashboard/kpis${params ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  getTrends: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[] }>(
      `/dashboard/trends${params ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  getRecentCustomers: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[] }>(
      `/dashboard/recent-customers${params ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  getTopPerformers: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any }>(
      `/dashboard/top-performers${params ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),
};

// Reports API
export const reportsApi = {
  generateReport: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[] }>(
      `/reports${params && Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  getReportSummary: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any }>(
      `/reports/summary${params && Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  exportReport: async (params?: Record<string, any>): Promise<Blob> => {
    const token = getAuthToken();

    // Filter out undefined values from params
    const filteredParams: Record<string, string> = {};
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          filteredParams[key] = String(params[key]);
        }
      });
    }

    const queryString = Object.keys(filteredParams).length > 0
      ? `?${new URLSearchParams(filteredParams).toString()}`
      : '';

    const response = await fetch(
      `${API_URL}/reports/export${queryString}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Export failed: ${response.status} - ${errorText}`);
    }

    return response.blob();
  },
};

// Payouts API
export const payoutsApi = {
  getAllConnectorBalances: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[] }>(
      `/payouts/balances${params ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  getConnectorBalance: (connectorId: string, params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any }>(
      `/payouts/balance/${connectorId}${params ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  getMonthlyPayout: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any }>(
      `/payouts/monthly${params ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  getLedgerEntries: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[]; pagination: any }>(
      `/payouts/ledger${params ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  getMonthlyPayoutsByConnector: (connectorId: string, params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[] }>(
      `/payouts/monthly-by-connector/${connectorId}${params ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  addLedgerEntry: (data: any) =>
    apiRequest<{ success: boolean; data: any }>('/payouts/ledger', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteLedgerEntry: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/payouts/ledger/${id}`, {
      method: 'DELETE',
    }),

  generatePayoutPDF: (data: any) =>
    apiRequest<{ success: boolean; data: any }>('/payouts/generate-pdf', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Organizations API
export const organizationsApi = {
  getAll: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[]; pagination: any }>(
      `/organizations${params ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  getById: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/organizations/${id}`),

  create: (data: any) =>
    apiRequest<{ success: boolean; data: any }>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiRequest<{ success: boolean; data: any }>(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/organizations/${id}`, {
      method: 'DELETE',
    }),

  getStats: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/organizations/${id}/stats`),
};

// Invoices API
export const invoicesApi = {
  getAll: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[]; pagination: any }>(
      `/invoices${params ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  create: (data: any) =>
    apiRequest<{ success: boolean; data: any }>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    apiRequest<{ success: boolean; data: any }>(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getAnalytics: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any }>(
      `/invoices/analytics${params ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),

  download: (id: string) =>
    apiRequest<{ success: boolean; data: { pdfUrl: string }; message: string }>(
      `/invoices/${id}/download`
    ),

  delete: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/invoices/${id}`, {
      method: 'DELETE',
    }),
};

// Signup API
export const signupApi = {
  createOrganization: (data: any) =>
    apiRequest<{ success: boolean; data: any }>('/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Profile API
export const profileApi = {
  getProfile: () =>
    apiRequest<{ success: boolean; data: any }>('/profile/me'),

  updateProfile: async (data: any, photo?: File) => {
    const token = getAuthToken();
    const formData = new FormData();

    // Append all profile data fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });

    // Append photo if provided
    if (photo) {
      formData.append('profilePhoto', photo);
    }

    const response = await fetch(`${API_URL}/profile/me`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'An error occurred',
      }));
      throw new Error(error.error || error.message || 'Update failed');
    }

    return response.json();
  },

  uploadPhoto: async (photo: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('profilePhoto', photo);

    const response = await fetch(`${API_URL}/profile/me/photo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'An error occurred',
      }));
      throw new Error(error.error || error.message || 'Upload failed');
    }

    return response.json();
  },

  deletePhoto: () =>
    apiRequest<{ success: boolean; message: string }>('/profile/me/photo', {
      method: 'DELETE',
    }),
};

// Notifications API
export const notificationsApi = {
  getNotifications: (params?: { limit?: number; onlyUnread?: boolean }) =>
    apiRequest<{ success: boolean; data: any[] }>(
      `/notifications${params ? `?${new URLSearchParams(params as any).toString()}` : ''}`
    ),

  getUnreadCount: () =>
    apiRequest<{ success: boolean; data: { count: number } }>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),

  markAllAsRead: () =>
    apiRequest<{ success: boolean; message: string }>('/notifications/mark-all-read', {
      method: 'PUT',
    }),
};

// DSA Invoice API
export const dsaInvoiceApi = {
  generateInvoice: (data: { dsaId: string; month: number; year: number }) =>
    apiRequest<{ success: boolean; data: any }>('/dsa-invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getInvoices: (params?: { dsaId?: string; month?: string; year?: string; status?: string }) =>
    apiRequest<{ success: boolean; data: any[] }>(
      `/dsa-invoices${params ? `?${new URLSearchParams(params as any).toString()}` : ''}`
    ),

  getInvoiceById: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/dsa-invoices/${id}`),

  deleteInvoice: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/dsa-invoices/${id}`, {
      method: 'DELETE',
    }),
};
