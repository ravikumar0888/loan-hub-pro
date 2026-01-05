import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Invoice, InvoiceStatus } from '@/types';

interface BillingContextType {
  invoices: Invoice[];
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Invoice;
  updateInvoiceStatus: (id: string, status: InvoiceStatus, paidAt?: Date) => void;
  getInvoicesByOrganization: (organizationId: string) => Invoice[];
  getInvoice: (id: string) => Invoice | undefined;
  getTotalRevenue: () => number;
  getOutstandingAmount: () => number;
  getMonthlyRevenue: (year: number, month: number) => number;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

const STORAGE_KEY = 'loanms_invoices';

// Mock invoices for demo
const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2024-001',
    organizationId: 'org-1',
    organizationName: 'ABC Finance Corp',
    amount: 8990,
    seats: 10,
    pricePerSeat: 899,
    billingPeriodStart: new Date('2024-06-01'),
    billingPeriodEnd: new Date('2024-06-30'),
    dueDate: new Date('2024-07-15'),
    status: 'paid',
    paidAt: new Date('2024-07-10'),
    createdAt: new Date('2024-06-01'),
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2024-002',
    organizationId: 'org-2',
    organizationName: 'Quick Loans Ltd',
    amount: 1497,
    seats: 3,
    pricePerSeat: 499,
    billingPeriodStart: new Date('2024-06-01'),
    billingPeriodEnd: new Date('2024-06-30'),
    dueDate: new Date('2024-07-15'),
    status: 'paid',
    paidAt: new Date('2024-07-12'),
    createdAt: new Date('2024-06-01'),
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2024-003',
    organizationId: 'org-3',
    organizationName: 'Premier DSA Services',
    amount: 74950,
    seats: 50,
    pricePerSeat: 1499,
    billingPeriodStart: new Date('2024-06-01'),
    billingPeriodEnd: new Date('2024-06-30'),
    dueDate: new Date('2024-07-15'),
    status: 'pending',
    createdAt: new Date('2024-06-01'),
  },
  {
    id: 'inv-4',
    invoiceNumber: 'INV-2024-004',
    organizationId: 'org-1',
    organizationName: 'ABC Finance Corp',
    amount: 8990,
    seats: 10,
    pricePerSeat: 899,
    billingPeriodStart: new Date('2024-07-01'),
    billingPeriodEnd: new Date('2024-07-31'),
    dueDate: new Date('2024-08-15'),
    status: 'pending',
    createdAt: new Date('2024-07-01'),
  },
];

export function BillingProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((inv: Invoice) => ({
        ...inv,
        billingPeriodStart: new Date(inv.billingPeriodStart),
        billingPeriodEnd: new Date(inv.billingPeriodEnd),
        dueDate: new Date(inv.dueDate),
        paidAt: inv.paidAt ? new Date(inv.paidAt) : undefined,
        createdAt: new Date(inv.createdAt),
      }));
    }
    return mockInvoices;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  }, [invoices]);

  const generateInvoiceNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const count = invoices.filter(inv => inv.invoiceNumber.includes(`INV-${year}`)).length + 1;
    return `INV-${year}-${count.toString().padStart(3, '0')}`;
  }, [invoices]);

  const createInvoice = useCallback((invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Invoice => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      createdAt: new Date(),
    };
    setInvoices(prev => [...prev, newInvoice]);
    return newInvoice;
  }, [generateInvoiceNumber]);

  const updateInvoiceStatus = useCallback((id: string, status: InvoiceStatus, paidAt?: Date) => {
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === id
          ? { ...inv, status, paidAt: status === 'paid' ? (paidAt || new Date()) : inv.paidAt }
          : inv
      )
    );
  }, []);

  const getInvoicesByOrganization = useCallback((organizationId: string) => {
    return invoices.filter(inv => inv.organizationId === organizationId);
  }, [invoices]);

  const getInvoice = useCallback((id: string) => {
    return invoices.find(inv => inv.id === id);
  }, [invoices]);

  const getTotalRevenue = useCallback(() => {
    return invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }, [invoices]);

  const getOutstandingAmount = useCallback(() => {
    return invoices
      .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }, [invoices]);

  const getMonthlyRevenue = useCallback((year: number, month: number) => {
    return invoices
      .filter(inv => {
        if (inv.status !== 'paid' || !inv.paidAt) return false;
        const paidDate = new Date(inv.paidAt);
        return paidDate.getFullYear() === year && paidDate.getMonth() === month;
      })
      .reduce((sum, inv) => sum + inv.amount, 0);
  }, [invoices]);

  return (
    <BillingContext.Provider
      value={{
        invoices,
        createInvoice,
        updateInvoiceStatus,
        getInvoicesByOrganization,
        getInvoice,
        getTotalRevenue,
        getOutstandingAmount,
        getMonthlyRevenue,
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
