import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SessionTimeoutProvider } from "@/contexts/SessionTimeoutContext";
import { AdminPasswordVerificationProvider } from "@/contexts/AdminPasswordVerificationContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { BillingProvider } from "@/contexts/BillingContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import DashboardLayout from "./components/layout/DashboardLayout";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginPage = lazy(() => import("./components/auth/LoginPage"));
const ForgotPasswordPage = lazy(() => import("./components/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./components/auth/ResetPasswordPage"));
const SignupPage = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Customers = lazy(() => import("./pages/Customers"));
const Banks = lazy(() => import("./pages/Banks"));
const Users = lazy(() => import("./pages/Users"));
const DSAPage = lazy(() => import("./pages/DSA"));
const DsaInvoices = lazy(() => import("./pages/DsaInvoices"));
const Reports = lazy(() => import("./pages/Reports"));
const Payouts = lazy(() => import("./pages/Payouts"));
const Profile = lazy(() => import("./pages/Profile"));
const MasterAdminDashboard = lazy(() => import("./pages/MasterAdmin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // Data considered fresh for 30s
      gcTime: 5 * 60 * 1000,      // Keep unused data cached for 5 minutes
      refetchOnMount: true,       // Still refetch stale data on mount
      refetchOnWindowFocus: true, // Still refetch stale data on focus
      refetchOnReconnect: true,   // Still refetch stale data on reconnect
      retry: 1,
    },
  },
});

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, role } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect master_admin to their dashboard
    if (role === 'master_admin') {
      return <Navigate to="/master-admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* Master Admin Routes */}
      <Route
        path="/master-admin"
        element={
          <ProtectedRoute allowedRoles={['master_admin']}>
            <MasterAdminDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'backoffice', 'connector']}>
            <DashboardLayout title="Dashboard" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
      </Route>

      <Route
        path="/customers"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'backoffice', 'connector']}>
            <DashboardLayout title="Customers" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Customers />} />
      </Route>

      <Route
        path="/banks"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <DashboardLayout title="Banks & NBFC" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Banks />} />
      </Route>

      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <DashboardLayout title="User Management" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Users />} />
      </Route>

      <Route
        path="/dsa"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <DashboardLayout title="Corporate DSA" />
          </ProtectedRoute>
        }
      >
        <Route index element={<DSAPage />} />
      </Route>

      <Route
        path="/dsa-invoices"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <DashboardLayout title="DSA Invoices" />
          </ProtectedRoute>
        }
      >
        <Route index element={<DsaInvoices />} />
      </Route>

      <Route
        path="/payouts"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'connector']}>
            <DashboardLayout title="Payouts" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Payouts />} />
      </Route>

      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <DashboardLayout title="Reports" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Reports />} />
      </Route>

      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'backoffice', 'connector']}>
            <DashboardLayout title="My Profile" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SessionTimeoutProvider>
              <AdminPasswordVerificationProvider>
                <OrganizationProvider>
                  <BillingProvider>
                    <AppRoutes />
                  </BillingProvider>
                </OrganizationProvider>
              </AdminPasswordVerificationProvider>
            </SessionTimeoutProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
