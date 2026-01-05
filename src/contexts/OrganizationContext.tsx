import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Organization, PricingPlan, PricingTier } from '@/types';

// Default Pricing Plans
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tier: 'starter',
    pricePerSeat: 499,
    minSeats: 1,
    maxSeats: 5,
    features: [
      'Up to 5 users',
      'Basic loan management',
      'Email support',
      'Standard reports',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    tier: 'professional',
    pricePerSeat: 899,
    minSeats: 5,
    maxSeats: 25,
    features: [
      'Up to 25 users',
      'Advanced loan management',
      'Priority support',
      'Custom reports',
      'API access',
      'Multi-bank integration',
    ],
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    pricePerSeat: 1499,
    minSeats: 10,
    maxSeats: null,
    features: [
      'Unlimited users',
      'Full platform access',
      'Dedicated support',
      'Custom integrations',
      'White-label options',
      'SLA guarantee',
      'Onboarding assistance',
    ],
  },
];

interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  pricingPlans: PricingPlan[];
  createOrganization: (org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'usedSeats'>) => Organization;
  updateOrganization: (id: string, updates: Partial<Organization>) => void;
  deleteOrganization: (id: string) => void;
  getOrganization: (id: string) => Organization | undefined;
  setCurrentOrganization: (org: Organization | null) => void;
  calculateMonthlyBilling: (tier: PricingTier, seats: number) => number;
  getPlanByTier: (tier: PricingTier) => PricingPlan | undefined;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const STORAGE_KEY = 'loanms_organizations';

// Mock organizations for demo
const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'ABC Finance Corp',
    email: 'admin@abcfinance.com',
    phone: '9876543210',
    address: 'Mumbai, Maharashtra',
    pricingTier: 'professional',
    seats: 10,
    usedSeats: 7,
    superAdminId: 'user-1',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'org-2',
    name: 'Quick Loans Ltd',
    email: 'contact@quickloans.com',
    phone: '9876543211',
    address: 'Delhi, India',
    pricingTier: 'starter',
    seats: 3,
    usedSeats: 3,
    superAdminId: 'user-2',
    status: 'active',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-05-15'),
  },
  {
    id: 'org-3',
    name: 'Premier DSA Services',
    email: 'info@premierdsa.com',
    phone: '9876543212',
    address: 'Bangalore, Karnataka',
    pricingTier: 'enterprise',
    seats: 50,
    usedSeats: 32,
    superAdminId: 'user-3',
    status: 'active',
    createdAt: new Date('2023-11-01'),
    updatedAt: new Date('2024-06-10'),
  },
];

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((org: Organization) => ({
        ...org,
        createdAt: new Date(org.createdAt),
        updatedAt: new Date(org.updatedAt),
        trialEndsAt: org.trialEndsAt ? new Date(org.trialEndsAt) : undefined,
      }));
    }
    return mockOrganizations;
  });

  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(organizations));
  }, [organizations]);

  const createOrganization = useCallback((orgData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'usedSeats'>): Organization => {
    const newOrg: Organization = {
      ...orgData,
      id: `org-${Date.now()}`,
      usedSeats: 1, // Super admin is the first user
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setOrganizations(prev => [...prev, newOrg]);
    return newOrg;
  }, []);

  const updateOrganization = useCallback((id: string, updates: Partial<Organization>) => {
    setOrganizations(prev =>
      prev.map(org =>
        org.id === id
          ? { ...org, ...updates, updatedAt: new Date() }
          : org
      )
    );
  }, []);

  const deleteOrganization = useCallback((id: string) => {
    setOrganizations(prev => prev.filter(org => org.id !== id));
  }, []);

  const getOrganization = useCallback((id: string) => {
    return organizations.find(org => org.id === id);
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
        createOrganization,
        updateOrganization,
        deleteOrganization,
        getOrganization,
        setCurrentOrganization,
        calculateMonthlyBilling,
        getPlanByTier,
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
