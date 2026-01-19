import { useContext } from 'react';
import { AdminPasswordVerificationContext } from '../contexts/AdminPasswordVerificationContext';

export function useAdminPasswordVerification() {
  const context = useContext(AdminPasswordVerificationContext);
  if (context === undefined) {
    throw new Error(
      'useAdminPasswordVerification must be used within AdminPasswordVerificationProvider'
    );
  }
  return context;
}
