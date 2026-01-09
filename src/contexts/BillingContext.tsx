import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Invoice, InvoiceStatus } from '@/types';
import { invoicesApi } from '@/lib/api';
import { useAuth } from './AuthContext';

interface BillingContextType {
  invoices: Invoice[];
  isLoading: boolean;
  isError: boolean;
  createInvoice: (invoice: any) => Promise<Invoice>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
  getInvoicesByOrganization: (organizationId: string) => Invoice[];
  getInvoice: (id: string) => Invoice | undefined;
  getTotalRevenue: () => number;
  getOutstandingAmount: () => number;
  getMonthlyRevenue: (year: number, month: number) => number;
  refetch: () => void;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch invoices from backend API
  const { data: invoicesData, isLoading, isError, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await invoicesApi.getAll();
      return response.data;
    },
    enabled: !!user, // Only fetch if user is logged in
  });

  const invoices = invoicesData || [];

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const response = await invoicesApi.create(invoiceData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  // Update invoice status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      await invoicesApi.updateStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const createInvoice = useCallback(async (invoiceData: any): Promise<Invoice> => {
    const result = await createMutation.mutateAsync(invoiceData);
    return result;
  }, [createMutation]);

  const updateInvoiceStatus = useCallback(async (id: string, status: InvoiceStatus) => {
    await updateStatusMutation.mutateAsync({ id, status });
  }, [updateStatusMutation]);

  const getInvoicesByOrganization = useCallback((organizationId: string) => {
    return invoices.filter((inv: Invoice) => inv.organizationId === organizationId);
  }, [invoices]);

  const getInvoice = useCallback((id: string) => {
    return invoices.find((inv: Invoice) => inv.id === id);
  }, [invoices]);

  const getTotalRevenue = useCallback(() => {
    return invoices
      .filter((inv: Invoice) => inv.status === 'paid')
      .reduce((sum: number, inv: Invoice) => sum + inv.amount, 0);
  }, [invoices]);

  const getOutstandingAmount = useCallback(() => {
    return invoices
      .filter((inv: Invoice) => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum: number, inv: Invoice) => sum + inv.amount, 0);
  }, [invoices]);

  const getMonthlyRevenue = useCallback((year: number, month: number) => {
    return invoices
      .filter((inv: Invoice) => {
        if (inv.status !== 'paid' || !inv.paidAt) return false;
        const paidDate = new Date(inv.paidAt);
        return paidDate.getFullYear() === year && paidDate.getMonth() === month;
      })
      .reduce((sum: number, inv: Invoice) => sum + inv.amount, 0);
  }, [invoices]);

  return (
    <BillingContext.Provider
      value={{
        invoices,
        isLoading,
        isError,
        createInvoice,
        updateInvoiceStatus,
        getInvoicesByOrganization,
        getInvoice,
        getTotalRevenue,
        getOutstandingAmount,
        getMonthlyRevenue,
        refetch,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}
