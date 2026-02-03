import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Building,
  UserCog,
  FileText,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut,
  Wallet,
  User,
  Receipt,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ collapsed, onToggle, isMobile = false }: SidebarProps) {
  const { role, logout, user } = useAuth();
  const location = useLocation();

  // Map role to display name
  const getRoleDisplayName = (role: string | undefined) => {
    if (role === 'master_admin') return 'Master Admin';
    if (role === 'superadmin') return 'Super Admin';
    if (role === 'connector') return 'Channel Partner';
    if (role === 'backoffice') return 'Back Office';
    return role?.replace(/^\w/, (c) => c.toUpperCase()) || '';
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['superadmin', 'admin', 'backoffice', 'connector'],
    },
    {
      label: 'Loan Application',
      icon: Users,
      path: '/customers',
      roles: ['superadmin', 'admin', 'backoffice', 'connector'],
    },
    {
      label: 'Banks & NBFC',
      icon: Building,
      path: '/banks',
      roles: ['superadmin'],
    },
    {
      label: 'Users',
      icon: UserCog,
      path: '/users',
      roles: ['superadmin', 'admin'],
    },
    {
      label: 'Corporate DSA',
      icon: Briefcase,
      path: '/dsa',
      roles: ['superadmin'],
    },
    {
      label: 'DSA Invoices',
      icon: Receipt,
      path: '/dsa-invoices',
      roles: ['superadmin', 'admin'],
    },
    {
      label: 'Payouts',
      icon: Wallet,
      path: '/payouts',
      roles: ['superadmin', 'admin', 'connector'],
    },
    {
      label: 'Reports',
      icon: FileText,
      path: '/reports',
      roles: ['superadmin', 'admin'],
    },
  ];

  // Filter menu items based on user role
  // Note: master_admin has no menu items - they use a separate admin panel
  const filteredMenuItems = React.useMemo(() => {
    if (!role) {
      return [];
    }

    // Normalize role for case-insensitive comparison
    const normalizedRole = role.toLowerCase().trim();

    // Filter menu items by role
    const filtered = menuItems.filter((item) =>
      item.roles.some(r => r.toLowerCase() === normalizedRole)
    );

    return filtered;
  }, [role]);

  return (
    <aside
      className={cn(
        'bg-sidebar transition-all duration-300 flex flex-col shadow-xl z-50',
        isMobile ? 'h-full w-full' : 'fixed left-0 top-0 h-screen',
        collapsed ? 'w-20' : 'w-full sm:w-80 md:w-64',
        !isMobile && collapsed ? 'w-20' : ''
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-sidebar-border relative">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-sidebar-foreground truncate">FinConnect</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">Simplifying Lending Ecosystems</p>
            </div>
          )}
        </div>
        {/* Close button on mobile - positioned for better visibility */}
        {isMobile && !collapsed && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle();
            }}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-sidebar-foreground/60">{getRoleDisplayName(role)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {filteredMenuItems.length > 0 ? (
          filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'sidebar-link',
                  isActive && 'sidebar-link-active'
                )}
                onClick={() => {
                  if (isMobile) {
                    onToggle();
                  }
                }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="animate-fade-in">{item.label}</span>
                )}
              </NavLink>
            );
          })
        ) : (
          !collapsed && (
            <div className="text-sidebar-foreground/60 text-sm text-center py-4">
              {role ? 'No menu items available' : 'Loading menu...'}
            </div>
          )
        )}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Logout button clicked'); // Debug log
            logout();
            if (isMobile) {
              onToggle();
            }
          }}
          className="sidebar-link w-full text-destructive hover:bg-destructive/10 min-h-[48px]"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Show close button on mobile, collapse toggle on desktop */}
        {isMobile ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Bottom close button clicked'); // Debug log
              onToggle();
            }}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-lg text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors font-medium"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
            <span>Close Menu</span>
          </button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
        )}
      </div>
    </aside>
  );
}
