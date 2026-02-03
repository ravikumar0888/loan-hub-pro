import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  title?: string;
  children?: React.ReactNode;
}

export default function DashboardLayout({ title = 'Dashboard', children }: DashboardLayoutProps) {
  const { isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Debug logging for menu state
  React.useEffect(() => {
    console.log('Mobile menu state:', mobileMenuOpen ? 'OPEN' : 'CLOSED');
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-30 lg:hidden cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Overlay clicked - closing menu');
            setMobileMenuOpen(false);
          }}
          role="button"
          aria-label="Close menu"
        />
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Sidebar - Mobile */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-300',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar
          collapsed={false}
          onToggle={() => setMobileMenuOpen(false)}
          isMobile={true}
        />
      </div>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        )}
      >
        <Header title={title} onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="p-3 sm:p-4 md:p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
