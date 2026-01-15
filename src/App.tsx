import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { BillingProvider } from "@/contexts/BillingContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./components/auth/LoginPage";
import ForgotPasswordPage from "./components/auth/ForgotPasswordPage";
import ResetPasswordPage from "./components/auth/ResetPasswordPage";
import SignupPage from "./pages/Signup";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Banks from "./pages/Banks";
import Users from "./pages/Users";
import DSAPage from "./pages/DSA";
import Reports from "./pages/Reports";
import Payouts from "./pages/Payouts";
import Profile from "./pages/Profile";
import MasterAdminDashboard from "./pages/MasterAdmin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Data is always considered stale
      gcTime: 0, // Garbage collect immediately (formerly cacheTime)
      refetchOnMount: true, // Always refetch when component mounts
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnReconnect: true, // Refetch when network reconnects
      retry: 1, // Retry failed requests once
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
            <OrganizationProvider>
              <BillingProvider>
                <AppRoutes />
              </BillingProvider>
            </OrganizationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
