import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthState } from '@/types';
import { authApi, setAuthToken, removeAuthToken } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  displayName: string | null; // Company name for admin (if set), or organization name
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    role: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          if (response.success && response.data) {
            setAuthState({
              user: response.data,
              isAuthenticated: true,
              role: response.data.role,
            });
          }
        } catch (error) {
          // Token is invalid, remove it
          removeAuthToken();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(email, password);

      if (response.success && response.data) {
        // Save token to localStorage
        setAuthToken(response.data.token);

        // Update auth state
        setAuthState({
          user: response.data.user,
          isAuthenticated: true,
          role: response.data.user.role,
        });

        return true;
      }
      return false;
    } catch (error) {
      // Error handled silently - no logging of sensitive data
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    removeAuthToken();
    sessionStorage.removeItem('admin_password_verified_pages');
    setAuthState({
      user: null,
      isAuthenticated: false,
      role: null,
    });
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      const response = await authApi.forgotPassword(email);
      return response.success;
    } catch (error) {
      // Error handled silently
      return false;
    }
  }, []);

  const resetPassword = useCallback(async (password: string): Promise<boolean> => {
    try {
      // In a real scenario, you'd get the token from URL params
      const token = new URLSearchParams(window.location.search).get('token') || '';
      const response = await authApi.resetPassword(token, password);
      return response.success;
    } catch (error) {
      // Error handled silently - no logging of sensitive data
      return false;
    }
  }, []);

  // Refresh user data from API
  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        setAuthState({
          user: response.data,
          isAuthenticated: true,
          role: response.data.role,
        });
      }
    } catch (error) {
      // Error handled silently
    }
  }, []);

  // Compute display name based on role
  // For admin: use companyName if set, otherwise organization name
  // For others: use organization name
  const displayName = React.useMemo(() => {
    if (!authState.user) return null;
    const userData = authState.user as any;

    // For admin role, prefer companyName if set
    if (authState.role === 'admin' && userData.companyName) {
      return userData.companyName;
    }

    // For all roles (including admin without companyName), use organization name
    if (userData.organization?.name) {
      return userData.organization.name;
    }

    return null;
  }, [authState.user, authState.role]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        forgotPassword,
        resetPassword,
        refreshUser,
        displayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
