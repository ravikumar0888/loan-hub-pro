import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./components/auth/LoginPage";
import ForgotPasswordPage from "./components/auth/ForgotPasswordPage";
import ResetPasswordPage from "./components/auth/ResetPasswordPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Banks from "./pages/Banks";
import Users from "./pages/Users";
import DSAPage from "./pages/DSA";
import Reports from "./pages/Reports";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, role } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout title="Dashboard" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
      </Route>
      
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <DashboardLayout title="Customers" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Customers />} />
      </Route>
      
      <Route
        path="/banks"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Banks & NBFC" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Banks />} />
      </Route>
      
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="User Management" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Users />} />
      </Route>
      
      <Route
        path="/dsa"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Corporate DSA" />
          </ProtectedRoute>
        }
      >
        <Route index element={<DSAPage />} />
      </Route>
      
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Reports" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Reports />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
