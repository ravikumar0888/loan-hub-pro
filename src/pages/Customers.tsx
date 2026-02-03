import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CustomerTable from '@/components/dashboard/CustomerTable';
import CustomerFormDialog from '@/components/customer/CustomerFormDialog';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/lib/api';

export default function Customers() {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit' | 'view'>('add');

  // Fetch customers from backend
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await customersApi.getCustomers({ limit: 10000 });
      return response.data;
    },
  });

  const customers = customersData || [];

  // Helper to invalidate all dashboard-related queries when customer data changes
  const invalidateDashboardQueries = () => {
    // Invalidate all queries that start with these prefixes (refetchType defaults to 'active')
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-recent-customers'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-top-performers'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-trends'] });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
  };

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      return await customersApi.createCustomer(data);
    },
    onSuccess: () => {
      invalidateDashboardQueries();

      setIsFormDialogOpen(false);
      setSelectedCustomer(null);

      toast({
        title: 'Customer Added',
        description: 'New customer has been successfully added to the database.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create customer',
        variant: 'destructive',
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await customersApi.updateCustomer(id, data);
    },
    onSuccess: () => {
      invalidateDashboardQueries();

      setIsFormDialogOpen(false);
      setSelectedCustomer(null);

      toast({
        title: 'Customer Updated',
        description: 'Customer information has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update customer',
        variant: 'destructive',
      });
    },
  });

  const handleSaveCustomer = async (customerData: any) => {
    if (formMode === 'add') {
      createCustomerMutation.mutate(customerData);
    } else if (formMode === 'edit' && selectedCustomer) {
      updateCustomerMutation.mutate({ id: selectedCustomer.id, data: customerData });
    }
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setFormMode('add');
    setIsFormDialogOpen(true);
  };

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormMode('view');
    setIsFormDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormMode('edit');
    setIsFormDialogOpen(true);
  };

  const canAddCustomer = role === 'superadmin' || role === 'admin' || role === 'backoffice';

  if (isLoadingCustomers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Lead Management</h2>
          <p className="text-muted-foreground">Manage and track all customer applications</p>
        </div>
        {canAddCustomer && (
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Customer
          </Button>
        )}
      </div>

      <CustomerTable
        customers={customers}
        onView={handleView}
        onEdit={handleEdit}
      />

      <CustomerFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        customer={selectedCustomer}
        mode={formMode}
        onSave={handleSaveCustomer}
      />
    </div>
  );
}
