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
};

// Users API
export const usersApi = {
  getUsers: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[]; pagination: any }>(
      `/users?${new URLSearchParams(params).toString()}`
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
};

// Banks API
export const banksApi = {
  getBanks: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[]; pagination: any }>(
      `/banks?${new URLSearchParams(params).toString()}`
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
      `/dsas?${new URLSearchParams(params).toString()}`
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
      `/customers?${new URLSearchParams(params).toString()}`
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
};

// Reports API
export const reportsApi = {
  generateReport: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any[] }>(
      `/reports?${new URLSearchParams(params).toString()}`
    ),

  getReportSummary: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any }>(
      `/reports/summary?${new URLSearchParams(params).toString()}`
    ),

  exportReport: async (params?: Record<string, any>): Promise<Blob> => {
    const token = getAuthToken();
    const response = await fetch(
      `${API_URL}/reports/export?${new URLSearchParams(params).toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  },
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
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getAnalytics: (params?: Record<string, any>) =>
    apiRequest<{ success: boolean; data: any }>(
      `/invoices/analytics${params ? `?${new URLSearchParams(params).toString()}` : ''}`
    ),
};

// Signup API
export const signupApi = {
  createOrganization: (data: any) =>
    apiRequest<{ success: boolean; data: any }>('/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
