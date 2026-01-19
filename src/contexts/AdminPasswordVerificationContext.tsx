import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../lib/api';

interface AdminPasswordVerificationContextType {
  isPageVerified: (pageId: string) => boolean;
  verifyPasswordForPage: (pageId: string, password: string) => Promise<boolean>;
  clearVerification: () => void;
  isVerifying: boolean;
}

export const AdminPasswordVerificationContext = createContext<
  AdminPasswordVerificationContextType | undefined
>(undefined);

const STORAGE_KEY = 'admin_password_verified_pages';

export function AdminPasswordVerificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize from session storage - store verified pages as an object
  const [verifiedPages, setVerifiedPages] = useState<Record<string, boolean>>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  });
  const [isVerifying, setIsVerifying] = useState(false);

  // Sync with session storage
  useEffect(() => {
    if (Object.keys(verifiedPages).length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(verifiedPages));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [verifiedPages]);

  const isPageVerified = useCallback((pageId: string): boolean => {
    return verifiedPages[pageId] === true;
  }, [verifiedPages]);

  const verifyPasswordForPage = useCallback(async (pageId: string, password: string): Promise<boolean> => {
    setIsVerifying(true);
    try {
      await authApi.verifyPassword(password);
      setVerifiedPages(prev => ({ ...prev, [pageId]: true }));
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const clearVerification = useCallback(() => {
    setVerifiedPages({});
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AdminPasswordVerificationContext.Provider
      value={{
        isPageVerified,
        verifyPasswordForPage,
        clearVerification,
        isVerifying,
      }}
    >
      {children}
    </AdminPasswordVerificationContext.Provider>
  );
}
