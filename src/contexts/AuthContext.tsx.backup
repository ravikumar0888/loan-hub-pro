import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: User[] = [
  {
    id: '0',
    firstName: 'Master',
    lastName: 'Admin',
    email: 'master@loanms.com',
    mobile: '9876543200',
    role: 'master_admin',
    createdAt: new Date(),
  },
  {
    id: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@loanms.com',
    mobile: '9876543210',
    role: 'admin',
    createdAt: new Date(),
  },
  {
    id: '2',
    firstName: 'BackOffice',
    lastName: 'User',
    email: 'backoffice@loanms.com',
    mobile: '9876543211',
    role: 'backoffice',
    createdAt: new Date(),
  },
  {
    id: '3',
    firstName: 'Connector',
    lastName: 'User',
    email: 'connector@loanms.com',
    mobile: '9876543212',
    role: 'connector',
    createdAt: new Date(),
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    role: null,
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (user && password === 'password123') {
      setAuthState({
        user,
        isAuthenticated: true,
        role: user.role,
      });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      role: null,
    });
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return !!user;
  }, []);

  const resetPassword = useCallback(async (password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return password.length >= 8;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        forgotPassword,
        resetPassword,
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
