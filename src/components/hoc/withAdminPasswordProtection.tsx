import { ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminPasswordVerification } from '../../hooks/useAdminPasswordVerification';
import { AdminPasswordVerificationDialog } from '../auth/AdminPasswordVerificationDialog';

export function withAdminPasswordProtection<P extends object>(
  Component: ComponentType<P>,
  pageId: string,
  pageName: string
) {
  return function ProtectedComponent(props: P) {
    const { role } = useAuth();
    const { isPageVerified } = useAdminPasswordVerification();
    const navigate = useNavigate();

    // Only apply protection for admin role
    const shouldProtect = role === 'admin';
    const isVerified = isPageVerified(pageId);
    const needsVerification = shouldProtect && !isVerified;

    const handleCancel = () => {
      navigate('/dashboard');
    };

    if (!shouldProtect) {
      // Not an admin, render normally
      return <Component {...props} />;
    }

    return (
      <>
        <div
          className={
            needsVerification
              ? 'pointer-events-none blur-md select-none'
              : ''
          }
        >
          <Component {...props} />
        </div>

        <AdminPasswordVerificationDialog
          open={needsVerification}
          onCancel={handleCancel}
          pageId={pageId}
          pageName={pageName}
        />
      </>
    );
  };
}
