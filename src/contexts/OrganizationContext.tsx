import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Organization, PricingPlan, PricingTier } from '@/types';
import { organizationsApi } from '@/lib/api';
import { useAuth } from './AuthContext';

// Default Pricing Plans - pricePerSeat is actually the fixed package price
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Standard',
    tier: 'starter',
    pricePerSeat: 4999, // Fixed package price (not per seat)
    minSeats: 14,
    maxSeats: 14,
    features: [
      '1 Superadmin',
      '1 Admin',
      '2 Backoffice users',
      '10 Connectors',
      'Basic loan management',
      'Email support',
      'Standard reports',
    ],
    userLimits: {
      superadmin: 1,
      admin: 1,
      backoffice: 2,
      connector: 10,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    tier: 'professional',
    pricePerSeat: 13999, // Fixed package price (not per seat)
    minSeats: 66,
    maxSeats: 66,
    features: [
      '1 Superadmin',
      '5 Admins',
      '10 Backoffice users',
      '50 Connectors',
      'Advanced loan management',
      'Priority support',
      'Custom reports',
      'API access',
      'Multi-bank integration',
    ],
    isPopular: true,
    userLimits: {
      superadmin: 1,
      admin: 5,
      backoffice: 10,
      connector: 50,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    pricePerSeat: 8999, // Fixed package price (not per seat)
    minSeats: 33,
    maxSeats: 33,
    features: [
      '1 Superadmin',
      '2 Admins',
      '5 Backoffice users',
      '25 Connectors',
      'Full platform access',
      'Dedicated support',
      'Custom integrations',
      'White-label options',
      'SLA guarantee',
      'Onboarding assistance',
    ],
    userLimits: {
      superadmin: 1,
      admin: 2,
      backoffice: 5,
      connector: 25,
    },
    isCustomizable: true,
    addonPricing: {
      connector: 100,    // ₹100 per additional connector
      backoffice: 200,   // ₹200 per additional backoffice user
      admin: 500,        // ₹500 per additional admin user
    },
  },
];

interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  pricingPlans: PricingPlan[];
  isLoading: boolean;
  isError: boolean;
  createOrganization: (org: any) => Promise<Organization>;
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  getOrganization: (id: string) => Organization | undefined;
  setCurrentOrganization: (org: Organization | null) => void;
  calculateMonthlyBilling: (tier: PricingTier, seats: number) => number;
  getPlanByTier: (tier: PricingTier) => PricingPlan | undefined;
  refetch: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);

  // Fetch organizations from backend API (only for master_admin and superadmin)
  const { data: organizationsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await organizationsApi.getAll();
      return response.data;
    },
    enabled: !!user && (role === 'master_admin' || role === 'superadmin'), // Only fetch for authorized roles
  });

  const organizations = organizationsData || [];

  // Create organization mutation
  const createMutation = useMutation({
    mutationFn: async (orgData: any) => {
      const response = await organizationsApi.create(orgData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  // Update organization mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Organization> }) => {
      await organizationsApi.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  // Delete organization mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await organizationsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  const createOrganization = useCallback(async (orgData: any): Promise<Organization> => {
    const result = await createMutation.mutateAsync(orgData);
    return result;
  }, [createMutation]);

  const updateOrganization = useCallback(async (id: string, updates: Partial<Organization>) => {
    await updateMutation.mutateAsync({ id, updates });
  }, [updateMutation]);

  const deleteOrganization = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const getOrganization = useCallback((id: string) => {
    return organizations.find((org: Organization) => org.id === id);
  }, [organizations]);

  const getPlanByTier = useCallback((tier: PricingTier) => {
    return PRICING_PLANS.find(plan => plan.tier === tier);
  }, []);

  const calculateMonthlyBilling = useCallback((tier: PricingTier, seats: number) => {
    const plan = PRICING_PLANS.find(p => p.tier === tier);
    if (!plan) return 0;
    return plan.pricePerSeat * seats;
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        pricingPlans: PRICING_PLANS,
        isLoading,
        isError,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        getOrganization,
        setCurrentOrganization,
        calculateMonthlyBilling,
        getPlanByTier,
        refetch,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
